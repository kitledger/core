import { initializeConcurrency, acquireSlot, releaseSlot } from './concurrency_limiter.ts';
import { KitApi, ApiShape, WorkerToHostMessage, HostToWorkerMessage, ExecutionResultPayload } from './shared.ts';
import { workerConfig } from "../../../../config.ts";

initializeConcurrency(workerConfig.poolSize);
const workerURL = new URL('./worker.ts', import.meta.url);

const kitApiImplementation: KitApi = {
    billing: {
        invoices: {
            create: async (data) => {
                console.log(`HOST: Fulfilling billing.invoices.create with`, data);
                return { invoiceId: `inv_${crypto.randomUUID()}`, status: 'created' };
            },
        },
    },
    utils: {
        log: async (...args) => {
            console.log('[User Script Log]:', ...args);
            return 'logged';
        },
    },
};

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

function timeout(ms: number, worker: Worker): Promise<never> {
    return new Promise((_, reject) => setTimeout(() => {
        worker.terminate();
        reject(new Error(`Script execution timed out after ${ms}ms`));
    }, ms));
}

export async function executeScript(code: string, context: string): Promise<ExecutionResultPayload> {
    await acquireSlot();
    
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
            executionPromise,
            timeout(5000, worker)
        ]);
    } finally {
        worker.terminate();
        releaseSlot();
    }
}