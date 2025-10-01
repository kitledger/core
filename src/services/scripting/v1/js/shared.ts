export type ApiShape = { [key: string]: 'function' | ApiShape; };
export type ActionRequestPayload = { id: string; path: string[]; args: unknown[]; };
export type ActionResponsePayload = { id: string; result?: unknown; error?: string; };
export type ExecutionResultPayload = { status: 'success' | 'error'; data?: unknown; error?: string; };
export type WorkerToHostMessage = | { type: 'actionRequest'; payload: ActionRequestPayload } | { type: 'executionResult'; payload: ExecutionResultPayload };
export type HostToWorkerMessage = | { type: 'actionResponse'; payload: ActionResponsePayload };