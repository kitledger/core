/**
 * @file This is the host-side script execution engine. It is responsible for
 * spinning up sandboxed Deno workers, providing them with the necessary API
 * proxies via Import Maps, and handling their requests securely.
 */

import { initializeConcurrency, acquireSlot, releaseSlot } from './concurrency_limiter.ts';
import { WorkerToHostMessage, HostToWorkerMessage, ExecutionResultPayload } from './shared.ts';
import { getApiMethod } from '../api/api.ts';
import { ACTIONS_DEFINITION } from '@kitledger/actions/__definition';
import type { ApiMethod } from '@kitledger/actions/__definition';
import { workerConfig } from "../../../../config.ts";

const scriptTimeout = 30000;


initializeConcurrency(workerConfig.poolSize);

const workerURL = new URL('./worker.ts', import.meta.url);

/**
 * Generates the JavaScript source code for a virtual module that exports proxy functions.
 * @param methods An array of method names for this module (e.g., ['info', 'warn']).
 * @param moduleName The name of the module (e.g., 'log').
 * @param portName The variable name of the message port inside the worker.
 * @returns The JavaScript source code for the proxy module.
 */
function createProxyModule(methods: readonly string[], moduleName: string, portName: string): string {
    const exports = methods.map(method => `
        export function ${method}(...args) {
            return new Promise((resolve, reject) => {
                const id = crypto.randomUUID();
                const message = {
                    type: 'actionRequest',
                    payload: { id, methodName: '${moduleName}.${method}', args }
                };
                const responseHandler = (event) => {
                    if (event.data.type === 'actionResponse' && event.data.payload.id === id) {
                        ${portName}.removeEventListener('message', responseHandler);
                        const { result, error } = event.data.payload;
                        error ? reject(new Error(error)) : resolve(result);
                    }
                };
                ${portName}.addEventListener('message', responseHandler);
                ${portName}.postMessage(message);
            });
        }
    `).join('');
    return exports;
}

/**
 * Creates an Import Map to resolve @kitledger/actions modules to virtual code.
 * @param portName The variable name of the message port inside the worker.
 * @returns An object representing the JSON structure of an Import Map.
 */
function createImportMap(portName: string): { imports: Record<string, string> } {
    const imports: Record<string, string> = {};
    for (const moduleName in ACTIONS_DEFINITION) {
        const methods = ACTIONS_DEFINITION[moduleName as keyof typeof ACTIONS_DEFINITION];
        const moduleSource = createProxyModule(methods, moduleName, portName);
        imports[`@kitledger/actions/${moduleName}`] = `data:text/javascript,${encodeURIComponent(moduleSource)}`;
    }
    return { imports };
}

/**
 * Invokes a method on the host-side API implementation in a type-safe manner.
 * @param methodName The unique identifier of the method to invoke.
 * @param args An array of arguments to pass to the method.
 * @returns The result of the API method call.
 */
async function invokeApiMethod(methodName: ApiMethod, args: unknown[]): Promise<unknown> {
    const method = getApiMethod(methodName);
    // @ts-ignore - We trust our RPC mechanism to provide the correct arguments.
    return await method(...args);
}

/**
 * Sets a timeout for the worker execution, terminating it if it exceeds the specified duration.
 * @param ms The timeout duration in milliseconds.
 * @param worker The worker instance to monitor.
 * @returns A promise that rejects if the timeout is exceeded.
 */
function timeout(ms: number, worker: Worker): Promise<never> {
    return new Promise((_, reject) => setTimeout(() => {
        worker.terminate();
        reject(new Error(`Script execution timed out after ${ms}ms`));
    }, ms));
}

/**
 * Executes the provided user script in a sandboxed Deno worker.
 * @param code The user-provided TypeScript/JavaScript code to execute.
 * @param context A stringified JSON object containing the script's execution context.
 * @returns A promise that resolves with the final status of the script execution.
 */
export async function executeScript(code: string, context: string): Promise<ExecutionResultPayload> {
    await acquireSlot();

    const importMap = createImportMap('port');
    const importMapString = JSON.stringify(importMap);
    const importMapURL = `data:application/json,${encodeURIComponent(importMapString)}`;

    const worker = new Worker(workerURL.href, {
        type: 'module',
        deno: {
            permissions: 'none',
        }	
    });

    try {
        const executionPromise = new Promise<ExecutionResultPayload>((resolve, reject) => {
            const channel = new MessageChannel();
            const hostPort = channel.port1;

            hostPort.onmessage = async (event: MessageEvent<WorkerToHostMessage>) => {
                const message = event.data;
                switch (message.type) {
                    case 'actionRequest': {
                        try {
                            const result = await invokeApiMethod(message.payload.methodName, message.payload.args);
                            const response: HostToWorkerMessage = { type: 'actionResponse', payload: { id: message.payload.id, result } };
                            hostPort.postMessage(response);
                        } catch (e) {
                            const response: HostToWorkerMessage = { type: 'actionResponse', payload: { id: message.payload.id, error: (e as Error).message } };
                            hostPort.postMessage(response);
                        }
                        break;
                    }
                    case 'executionResult': {
                        hostPort.close();
                        if (message.payload.status === 'success') {
                            resolve(message.payload);
                        } else {
                            reject(new Error(message.payload.error ?? 'Unknown execution error'));
                        }
                        break;
                    }
                }
            };

            const payload = { code, context };
            worker.postMessage(payload, [channel.port2]);
        });

        return await Promise.race([
            executionPromise,
            timeout(scriptTimeout, worker)
        ]);
    } finally {
        worker.terminate();
        releaseSlot();
    }
}