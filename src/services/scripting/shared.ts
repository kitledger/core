export type ApiMethod = "UNIT_MODEL.CREATE";

export type ActionRequestPayload = {
	id: string;
	methodName: ApiMethod;
	args: unknown[];
};

export type ExecutionResultPayload = {
	status: "success" | "error";
	error?: string;
};

export type WorkerToHostMessage =
	| { type: "actionRequest"; payload: ActionRequestPayload }
	| { type: "executionResult"; payload: ExecutionResultPayload };

export type ActionResponsePayload = {
	id: string;
	result?: unknown;
	error?: string;
};

export type HostToWorkerMessage = {
	type: "actionResponse";
	payload: ActionResponsePayload;
};