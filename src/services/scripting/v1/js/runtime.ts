import { initializeConcurrency, acquireSlot, releaseSlot } from './concurrency_limiter.ts';
import { ApiShape, WorkerToHostMessage, HostToWorkerMessage, ExecutionResultPayload } from './shared.ts';
import { kitApiImplementation } from '../api/api.ts';
import { workerConfig } from "../../../../config.ts";

/**
 * Initializes the concurrency limiter with the configured pool size.
 */
initializeConcurrency(workerConfig.poolSize);

/**
 * The URL of the worker script, constructed relative to this module.
 */
const workerURL = new URL('./worker.ts', import.meta.url);

/**
 * Serializes the nested structure of the KitActions API into a searchable object.
 * @param obj The object to derive the API shape from.
 * @returns The ApiShape representing the structure of the provided object.
 */
function getApiShape<T extends object>(obj: T): ApiShape {
    const shape: ApiShape = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (typeof value === 'function') {
                shape[key] = 'function';
            } else if (typeof value === 'object' && value !== null) {
                shape[key] = getApiShape(value);
            }
        }
    }
    return shape;
}

/**
 * Invokes a method on the KitActions API based on the provided path.
 * @param path 
 * @param args 
 * @returns 
 */
async function invokeApiMethod(path: string[], args: unknown[]): Promise<unknown> {
    let current: unknown = kitApiImplementation;
    for (const key of path) {
        if (typeof current === 'object' && current !== null && key in current) {
            current = (current as Record<string, unknown>)[key];
        } else {
            throw new Error(`API path not found: ${path.join('.')}`);
        }
    }
    if (typeof current !== 'function') {
        throw new Error(`API path does not resolve to a function: ${path.join('.')}`);
    }
    return await current(...args);
}

/**
 * Sets a timeout for the worker execution, terminating it if it exceeds the specified duration.
 * @param ms 
 * @param worker 
 * @returns 
 */
function timeout(ms: number, worker: Worker): Promise<never> {
    return new Promise((_, reject) => setTimeout(() => {
        worker.terminate();
        reject(new Error(`Script execution timed out after ${ms}ms`));
    }, ms));
}


/**
 * executes the provided JavaScript code in a sandboxed worker environment with the given context.
 * @param code 
 * @param context 
 * @returns 
 */
export async function executeScript(code: string, context: string): Promise<ExecutionResultPayload> {
    await acquireSlot();
    
	/**
	 * Initialize a sandboxed worker with no permissions (Deno specific flag).
	 */
    const worker = new Worker(workerURL.href, { type: 'module', deno: { permissions: 'none' } });

    try {
        const executionPromise = new Promise<ExecutionResultPayload>((resolve, reject) => {
            const channel = new MessageChannel();
            const hostPort = channel.port1;

            hostPort.onmessage = async (event: MessageEvent<WorkerToHostMessage>) => {
                const message = event.data;
                switch (message.type) {
                    case 'actionRequest': {
                        try {
                            const result = await invokeApiMethod(message.payload.path, message.payload.args);
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

            const payload = { code, context, apiShape: getApiShape(kitApiImplementation) };
            worker.postMessage(payload, [channel.port2]);
        });

        return await Promise.race([

			// Return whichever promise settles first: either the execution or the timeout.
			// TODO: Make the timeout duration dynamic based on script type.
            executionPromise,
            timeout(5000, worker)
        ]);
    } finally {
		
		// Ensure the worker is terminated and the slot is released after execution.
        worker.terminate();
        releaseSlot();
    }
}