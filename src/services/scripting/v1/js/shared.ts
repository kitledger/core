/**
 * Defines the structure and types for the API provided to user scripts.
 * This is the single source of truth for the API shape.
 */
export interface KitActionsApi {
	billing: {
		invoices: {
			create: (data: {
				customerId: string;
				amount: number;
			}) => Promise<{ invoiceId: string; status: "created" }>;
		};
	};
	utils: {
		log: (...args: unknown[]) => Promise<"logged">;
	};
}

/**
 * A serializable representation of the API's shape, used to build the proxy in the worker.
 */
export type KitActionsApiShape = {
	[key: string]: "function" | KitActionsApiShape;
};

// --- Message Types for Worker Communication ---

export type ActionRequestPayload = {
	id: string;
	path: string[];
	args: unknown[];
};

export type ActionResponsePayload = {
	id: string;
	result?: unknown;
	error?: string;
};

export type ExecutionResultPayload = {
	status: "success" | "error";
	data?: unknown;
	error?: string;
};

/**
 * Discriminated union for messages sent from the Worker to the Host.
 */
export type WorkerToHostMessage =
	| { type: "actionRequest"; payload: ActionRequestPayload }
	| { type: "executionResult"; payload: ExecutionResultPayload };

/**
 * Discriminated union for messages sent from the Host to the Worker.
 */
export type HostToWorkerMessage =
	| { type: "execute"; payload: { code: string; context: string; apiShape: KitActionsApiShape } }
	| { type: "actionResponse"; payload: ActionResponsePayload };
