import { ApiShape, HostToWorkerMessage, WorkerToHostMessage } from './shared.ts';
import { KitApi } from "../api/types.ts";

/**
 * Assembles the communication proxy for the KitApi based on the provided shape.
 * This proxy sends requests to the host and handles responses asynchronously.
 * @param shape 
 * @param port 
 * @param path 
 * @returns 
 */
function createKitProxy<T extends object>(shape: ApiShape, port: MessagePort, path: string[] = []): T {
    const kit: { [key: string]: unknown } = {};

    for (const key in shape) {
        const currentPath = [...path, key];
        const value = shape[key];

        if (value === 'function') {
            kit[key] = (...args: unknown[]): Promise<unknown> => {
                return new Promise((resolve, reject) => {
                    const id = crypto.randomUUID();
                    const message: WorkerToHostMessage = {
                        type: 'actionRequest', payload: { id, path: currentPath, args },
                    };

                    const responseHandler = (event: MessageEvent<HostToWorkerMessage>) => {
                        if (event.data.type === 'actionResponse' && event.data.payload.id === id) {
                            port.removeEventListener('message', responseHandler);
                            const { result, error } = event.data.payload;
                            error ? reject(new Error(error)) : resolve(result);
                        }
                    };
                    port.addEventListener('message', responseHandler);
                    port.postMessage(message);
                });
            };
        } else if (typeof value === 'object') {
            kit[key] = createKitProxy(value, port, currentPath);
        }
    }
    return kit as T;
}

/**
 * Flexible worker message handler that sets up the KitApi proxy and executes user-provided code.
 * @param event 
 * @returns 
 */
self.onmessage = async (event: MessageEvent<{ code: string; context: string; apiShape: ApiShape }>) => {
    const port = event.ports[0];
    if (!port) {
        self.close();
        return;
    }
    
    port.start();

    const { code, context, apiShape } = event.data;
    try {
        const kit = createKitProxy<KitApi>(apiShape, port);
        const sandboxedFunction = new Function('kit', 'context', `'use strict'; return (async () => { ${code} })();`);
        await sandboxedFunction(kit, context);
        const result: WorkerToHostMessage = {
            type: 'executionResult', payload: { status: 'success', data: 'completed' },
        };
        port.postMessage(result);
    } catch (error: unknown) {
        const result: WorkerToHostMessage = {
            type: 'executionResult', payload: { status: 'error', error: (error as Error).message },
        };
        port.postMessage(result);
    } finally {
        port.close();
    }
};