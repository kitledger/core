const worker = new Worker(new URL("./worker.ts", import.meta.url).href, {
    type: "module",
    deno: {
        permissions: "none",
    },
});

const KitApi = {
    billing: {
        invoices: {
            create: async (data: { customerId: string, amount: number }) => {
                console.log(`Main thread: Fulfilling billing.invoices.create`);
                return { invoiceId: `inv_${crypto.randomUUID()}`, status: "created" };
            },
        }
    },
    utils: {
        log: (...args: unknown[]) => {
            console.log("[User Script Log]:", ...args);
            return "logged";
        }
    }
};

worker.addEventListener('message', async (event: MessageEvent) => {
    const { type, id, payload } = event.data;
    if (type !== 'actionRequest') return;

    try {
        let action = payload.path.reduce((acc: any, key: string) => acc[key], KitApi);
        const result = await action(...(Array.isArray(payload.data) ? payload.data : [payload.data]));
        worker.postMessage({ type: 'actionResponse', id, payload: { status: 'success', data: result } });
    } catch (e: any) {
        worker.postMessage({ type: 'actionResponse', id, payload: { status: 'error', data: (e as Error).message } });
    }
});

function getApiShape(obj: any): any {
    const shape: { [key: string]: any } = {};
    for (const key in obj) {
        if (typeof obj[key] === 'function') {
            shape[key] = 'function';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            shape[key] = getApiShape(obj[key]);
        }
    }
    return shape;
}

export function executeScript(code: string, context: string): Promise<any> {
    const apiShape = getApiShape(KitApi);
    return new Promise((resolve) => {
        const resultHandler = (event: MessageEvent) => {
            if (event.data.type === 'executionResult') {
                worker.removeEventListener('message', resultHandler);
                resolve(event.data.payload);
            }
        };
        worker.addEventListener('message', resultHandler);
        worker.postMessage({ type: 'execute', payload: { code, context, apiShape } });
    });
}