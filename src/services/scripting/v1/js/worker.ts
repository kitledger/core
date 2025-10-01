const pendingActionRequests = new Map<string, (value: any) => void>();

self.addEventListener("message", (event: MessageEvent) => {
    const { type, id, payload } = event.data;
    if (type === "actionResponse" && id && pendingActionRequests.has(id)) {
        const resolve = pendingActionRequests.get(id)!;
        resolve(payload);
        pendingActionRequests.delete(id);
    }
});

async function executeUntrustedCode({ code, context, apiShape }: { code: string; context: string; apiShape: any }) {
    const createKitFromShape = (shape: any, path: string[] = []) => {
        const kit: { [key: string]: any } = {};
        for (const key in shape) {
            const currentPath = [...path, key];
            if (shape[key] === 'function') {
                kit[key] = (...data: unknown[]) => new Promise((resolve) => {
                    const id = crypto.randomUUID();
                    pendingActionRequests.set(id, resolve);
                    self.postMessage({
                        type: "actionRequest",
                        id,
                        payload: { path: currentPath, data },
                    });
                });
            } else if (typeof shape[key] === 'object') {
                kit[key] = createKitFromShape(shape[key], currentPath);
            }
        }
        return kit;
    };

    try {
        const sandboxedFunction = new Function("kit", "context", `'use strict'; return (async () => { ${code} })();`);
        const kit = createKitFromShape(apiShape);
        await sandboxedFunction(kit, context);
        self.postMessage({ type: "executionResult", payload: { status: "success", data: { status: "completed" } } });
    } catch (error: unknown) {
        self.postMessage({ type: "executionResult", payload: { status: "error", data: (error as Error).message } });
    }
}

self.onmessage = (event: MessageEvent) => {
    if (event.data.type === "execute") {
        executeUntrustedCode(event.data.payload);
    }
};