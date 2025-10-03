/**
 * @file Defines the shared types used for communication (via postMessage)
 * between the host (runtime.ts) and the sandboxed Deno worker (worker.ts).
 */

import type { ApiMethod } from '@kitledger/actions/__definition';

/**
 * The payload sent from the worker to the host to request an API method execution.
 */
export type ActionRequestPayload = {
    id: string;
    methodName: ApiMethod;
    args: unknown[];
};

/**
 * The payload sent from the host to the worker in response to an ActionRequest.
 */
export type ActionResponsePayload = {
    id: string;
    result?: unknown;
    error?: string;
};

/**
 * The payload sent from the worker to the host when the script has finished executing.
 */
export type ExecutionResultPayload = {
    status: 'success' | 'error';
    data?: unknown;
    error?: string;
};

/**
 * A union of all possible message types sent from the worker to the host.
 */
export type WorkerToHostMessage =
    | { type: 'actionRequest'; payload: ActionRequestPayload }
    | { type: 'executionResult'; payload: ExecutionResultPayload };

/**
 * A union of all possible message types sent from the host to the worker.
 */
export type HostToWorkerMessage =
    | { type: 'actionResponse'; payload: ActionResponsePayload };