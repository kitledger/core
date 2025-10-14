/**
 * @file This is the host-side script execution engine. It launches a static
 * worker and sends it pre-compiled user code to be executed in a sandbox.
 */

import { acquireSlot, initializeConcurrency, releaseSlot } from "./concurrency_limiter.ts";
import { ExecutionResultPayload, WorkerToHostMessage } from "./shared.ts";
import { apiMethodMap, getApiMethod } from "../api/methods.ts";
import type { ApiMethod } from "@kitledger/actions/__definition";
import { workerConfig } from "../../../../config.ts";

initializeConcurrency(workerConfig.poolSize);

const workerURL = new URL("./worker.ts", import.meta.url);

/**
 * Invokes a method on the host-side API implementation.
 */
async function invokeApiMethod(methodName: ApiMethod, args: unknown[]): Promise<unknown> {
	const method = getApiMethod(methodName);
	// @ts-ignore - We trust our RPC mechanism to provide the correct arguments.
	return await method(...args);
}

/**
 * Sets a timeout for the worker execution.
 */
function timeout(ms: number, worker: Worker): Promise<never> {
	return new Promise((_, reject) =>
		setTimeout(() => {
			worker.terminate();
			reject(new Error(`Script execution timed out after ${ms}ms`));
		}, ms)
	);
}

/**
 * Executes a pre-compiled user script in a sandboxed Deno worker.
 * @param code The pre-compiled JavaScript code to execute.
 * @param context A stringified JSON object containing the script's execution context.
 * @param entryPoint The name of the exported function to execute.
 * @returns A promise that resolves with the final status of the script execution.
 */
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
							});
						}
						catch (e) {
							hostPort.postMessage({
								type: "actionResponse",
								payload: { id: message.payload.id, error: (e as Error).message },
							});
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

			const apiShape = Object.keys(apiMethodMap);
			const payload = { code, context, apiShape };
			worker.postMessage(payload, [channel.port2]);
		});

		return await Promise.race([
			executionPromise,
			timeout(5000, worker),
		]);
	}
	finally {
		worker.terminate();
		releaseSlot();
	}
}
