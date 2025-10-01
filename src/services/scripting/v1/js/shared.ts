export interface KitApi {
    billing: {
        invoices: {
            create: (data: { customerId: string; amount: number; }) => Promise<{ invoiceId: string; status: 'created' }>;
        };
    };
    utils: {
        log: (...args: unknown[]) => Promise<'logged'>;
    };
}

export type ApiShape = { [key: string]: 'function' | ApiShape; };
export type ActionRequestPayload = { id: string; path: string[]; args: unknown[]; };
export type ActionResponsePayload = { id: string; result?: unknown; error?: string; };
export type ExecutionResultPayload = { status: 'success' | 'error'; data?: unknown; error?: string; };
export type WorkerToHostMessage = | { type: 'actionRequest'; payload: ActionRequestPayload } | { type: 'executionResult'; payload: ExecutionResultPayload };
export type HostToWorkerMessage = | { type: 'actionResponse'; payload: ActionResponsePayload };