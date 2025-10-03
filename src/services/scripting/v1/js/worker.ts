/**
 * @file This script is the entry point for the sandboxed Deno Web Worker.
 * It is responsible for receiving user code and a context object from the host,
 * executing the code, and reporting the result (success or error) back to the host.
 *
 * The worker relies on an Import Map provided by the host during its creation.
 * This map resolves imports from '@kitledger/actions/*' to dynamically generated
 * proxy modules that communicate with the host via a MessagePort for all API calls.
 */
self.onmessage = async (event: MessageEvent<{ code: string; context: string; }>) => {
    const port = event.ports[0];
    if (!port) {
        self.close();
        return;
    }

    port.start();

    const { code, context } = event.data;
    try {
        const sandboxedFunction = new Function('port', 'context', `'use strict'; return (async () => { ${code} })();`);
        await sandboxedFunction(port, context);

        const result = {
            type: 'executionResult',
            payload: { status: 'success', data: 'completed' },
        };
        port.postMessage(result);
    } catch (error: unknown) {
        const result = {
            type: 'executionResult',
            payload: { status: 'error', error: (error as Error).message },
        };
        port.postMessage(result);
    } finally {
        port.close();
    }
};