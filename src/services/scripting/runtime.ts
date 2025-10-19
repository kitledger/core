import { acquireSlot, initializeConcurrency, releaseSlot } from "./concurrency_limiter.ts";
import type { Method, ExecutionResultPayload, HostToWorkerMessage, WorkerToHostMessage } from "@kitledger/actions/_internal";
import { workerConfig } from "../../config.ts";

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

initializeConcurrency(workerConfig.poolSize);

const workerURL = new URL("./worker.ts", import.meta.url);

async function invokeApiMethod(methodName: Method, payload: unknown): Promise<unknown> {
	const method = getApiMethod(methodName);
	return await method(payload);
}

function timeout(
	ms: number,
	worker: Worker,
	terminatedFlag: { value: boolean },
): Promise<never> {
	return new Promise((_, reject) =>
		setTimeout(() => {
			terminatedFlag.value = true;
			worker.terminate();
			reject(new Error(`Script execution timed out after ${ms}ms`));
		}, ms)
	);
}

export async function executeScript(code: string, context: string): Promise<ExecutionResultPayload> {
	await acquireSlot();
	let slotHeld = true;
	const worker = new Worker(workerURL.href, { type: "module", deno: { permissions: "none" } });

	const terminatedFlag = { value: false };

	const releaseSlotOnce = () => {
		if (slotHeld) {
			releaseSlot();
			slotHeld = false;
		}
	};

	try {
		const executionPromise = new Promise<ExecutionResultPayload>((resolve, reject) => {
			const channel = new MessageChannel();
			const hostPort = channel.port1;

			hostPort.onmessage = async (event: MessageEvent<WorkerToHostMessage<unknown>>) => {
				if (terminatedFlag.value) return;

				const message = event.data;
				switch (message.type) {
					case "ACTION_REQUEST": {
						releaseSlotOnce();

						let result: unknown;
						let error: string | undefined;

						try {
							result = await invokeApiMethod(message.payload.method, message.payload.payload);
						} catch (e) {
							error = (e as Error).message;
						}

						if (terminatedFlag.value) {
							return;
						}

						await acquireSlot();
						slotHeld = true;

						if (terminatedFlag.value) {
							releaseSlotOnce();
							return;
						}

						try {
							if (error) {
								hostPort.postMessage({
									type: "ACTION_RESPONSE",
									payload: { id: message.payload.id, error },
								} as HostToWorkerMessage<unknown>);
							} else {
								hostPort.postMessage({
									type: "ACTION_RESPONSE",
									payload: { id: message.payload.id, result },
								} as HostToWorkerMessage<unknown>);
							}
						} catch (_postError) {
							releaseSlotOnce();
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

			const payload = { code, context };
			worker.postMessage(payload, [channel.port2]);
		});

		return await Promise.race([
			executionPromise,
			timeout(5000, worker, terminatedFlag),
		]);
	} finally {
		terminatedFlag.value = true;
		worker.terminate();
		releaseSlotOnce();
	}
}