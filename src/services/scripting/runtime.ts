import {
	acquireWorker,
	initializePool,
	releaseWorker,
} from "./concurrency_limiter.ts";
import type {
	ExecutionResultPayload,
	HostToWorkerMessage,
	Method,
	WorkerToHostMessage,
} from "@kitledger/actions/runtime";

const apiMethodMap: Record<Method, (payload: unknown) => unknown> = {
	"UNIT_MODEL.CREATE": (payload: unknown) => {
		console.log("[User Script | API]: UNIT_MODEL.CREATE called with:", payload);
		return { id: `um_${crypto.randomUUID()}`, status: "created" };
	},
};

function getApiMethod(methodName: Method): (payload: unknown) => unknown {
	const method = apiMethodMap[methodName];
	if (!method) {
		throw new Error(`Unknown API method: ${methodName}`);
	}
	return method;
}

async function invokeApiMethod(methodName: Method, payload: unknown): Promise<unknown> {
	const method = getApiMethod(methodName);
	return await method(payload);
}

initializePool();

function timeout(
	ms: number,
	terminatedFlag: { value: boolean },
): Promise<never> {
	return new Promise((_, reject) =>
		setTimeout(() => {
			terminatedFlag.value = true;
			reject(new Error(`Script execution timed out after ${ms}ms`));
		}, ms)
	);
}

/**
 * Arguments for executing a Kit Action Script.
 */
export interface ExecuteScriptArgs {
	/** The bundled, executable JavaScript code. */
	code: string;
	/** A JSON string representing the script's 'input' object. */
	inputJSON: string;
	/** The script type, e.g., "ServerEvent", "EndpointRequest". */
	scriptType: string;
	/** The specific trigger, e.g., "beforeCreate" or "GET". */
	trigger?: string;
	/** The execution timeout in milliseconds. */
	timeoutMs: number;
}

export async function executeScript(args: ExecuteScriptArgs): Promise<ExecutionResultPayload> {
	const pooledWorker = await acquireWorker();
	const worker = pooledWorker.worker;
	pooledWorker.jobsDone++;

	const terminatedFlag = { value: false };

	try {
		const executionPromise = new Promise<ExecutionResultPayload>((resolve, reject) => {
			const channel = new MessageChannel();
			const hostPort = channel.port1;

			hostPort.onmessage = async (event: MessageEvent<WorkerToHostMessage<unknown>>) => {
				if (terminatedFlag.value) return;

				const message = event.data;
				switch (message.type) {
					case "ACTION_REQUEST": {
						try {
							const result = await invokeApiMethod(message.payload.method, message.payload.payload);
							hostPort.postMessage({
								type: "ACTION_RESPONSE",
								payload: { id: message.payload.id, result },
							} as HostToWorkerMessage<unknown>);
						} catch (e) {
							hostPort.postMessage({
								type: "ACTION_RESPONSE",
								payload: { id: message.payload.id, error: (e as Error).message },
							} as HostToWorkerMessage<unknown>);
						}
						break;
					}
					case "EXECUTION_RESULT": {
						hostPort.close();
						if (message.payload.status === "SUCCESS") resolve(message.payload);
						else reject(new Error(message.payload.error ?? "Unknown execution error"));
						break;
					}
				}
			};

			hostPort.onmessageerror = (err) => {
				if (!terminatedFlag.value) {
					reject(new Error(`MessagePort error: ${err.data}`));
				}
			};

			worker.postMessage(args, [channel.port2]);
		});

		return await Promise.race([
			executionPromise,
			timeout(args.timeoutMs, terminatedFlag),
		]);
	} finally {
		terminatedFlag.value = true;
		releaseWorker(pooledWorker, terminatedFlag.value);
	}
}