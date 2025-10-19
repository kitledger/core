import { acquireSlot, initializeConcurrency, releaseSlot } from "./concurrency_limiter.ts";
import type { ApiMethod, ExecutionResultPayload, HostToWorkerMessage, WorkerToHostMessage } from "./shared.ts";
import { workerConfig } from "../../config.ts";

// --- Host-Side API Implementation ---

const apiMethodMap: Record<ApiMethod, (...args: unknown[]) => unknown> = {
	"UNIT_MODEL.CREATE": (...args: unknown[]) => {
		console.log("[User Script | API]: UNIT_MODEL.CREATE called with:", ...args);
		// Placeholder: Return a simple success or ID
		return { id: `um_${crypto.randomUUID()}`, status: "created" };
	},
};

function getApiMethod(methodName: ApiMethod): (...args: unknown[]) => unknown {
	const method = apiMethodMap[methodName];
	if (!method) {
		throw new Error(`Unknown API method: ${methodName}`);
	}
	return method;
}
// --- End of Host-Side API ---

initializeConcurrency(workerConfig.poolSize);

const workerURL = new URL("./worker.ts", import.meta.url);

async function invokeApiMethod(methodName: ApiMethod, args: unknown[]): Promise<unknown> {
	const method = getApiMethod(methodName);
	return await method(...args);
}

function timeout(ms: number, worker: Worker): Promise<never> {
	return new Promise((_, reject) =>
		setTimeout(() => {
			worker.terminate();
			reject(new Error(`Script execution timed out after ${ms}ms`));
		}, ms)
	);
}

export async function executeScript(code: string, context: string): Promise<ExecutionResultPayload> {
	await acquireSlot();
	const worker = new Worker(workerURL.href, { type: "module", deno: { permissions: "none" } });

	try {
		const executionPromise = new Promise<ExecutionResultPayload>((resolve, reject) => {
			const channel = new MessageChannel();
			const hostPort = channel.port1;

			hostPort.onmessage = async (event: MessageEvent<WorkerToHostMessage>) => {
				const message = event.data;
				switch (message.type) {
					case "actionRequest": {
						try {
							const result = await invokeApiMethod(message.payload.methodName, message.payload.args);
							hostPort.postMessage({
								type: "actionResponse",
								payload: { id: message.payload.id, result },
							} as HostToWorkerMessage); // MODIFIED: Added assertion
						} catch (e) {
							hostPort.postMessage({
								type: "actionResponse",
								payload: { id: message.payload.id, error: (e as Error).message },
							} as HostToWorkerMessage); // MODMODIFIED: Added assertion
						}
						break;
					}
					case "executionResult": {
						hostPort.close();
						if (message.payload.status === "success") resolve(message.payload);
						else reject(new Error(message.payload.error ?? "Unknown execution error"));
						break;
					}
				}
			};

			const payload = { code, context };
			worker.postMessage(payload, [channel.port2]);
		});

		return await Promise.race([
			executionPromise,
			timeout(5000, worker),
		]);
	} finally {
		worker.terminate();
		releaseSlot();
	}
}