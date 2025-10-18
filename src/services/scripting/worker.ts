/**
 * @file This script is the entry point for the sandboxed Deno Web Worker.
 * It receives pre-compiled user code and dynamically builds the global `kit`
 * object which acts as an RPC proxy to the host.
 */

import type { HostToWorkerMessage, WorkerToHostMessage } from "./shared.ts";
import type { ApiMethod } from "@kitledger/actions/__definition";

/**
 * A recursive type for the dynamically constructed proxy object.
 * It can have any string key, and its value is either another proxy object
 * or a final RPC function.
 */
type RecursiveProxy = {
	[key: string]: RecursiveProxy | ((...args: unknown[]) => Promise<unknown>);
};

/**
 * Dynamically constructs the nested `kit` proxy object in a type-safe way.
 * @param port The message port for communicating with the host.
 * @param methodNames An array of available API method names (e.g., 'log.info').
 * @returns The fully constructed `kit` proxy object.
 */
function createKitProxy(port: MessagePort, methodNames: ApiMethod[]): RecursiveProxy {
	const kl: RecursiveProxy = {};
	for (const methodName of methodNames) {
		const path = methodName.split(".");
		let currentLevel = kl;

		for (let i = 0; i < path.length - 1; i++) {
			const part = path[i];
			if (!currentLevel[part]) {
				currentLevel[part] = {};
			}
			currentLevel = currentLevel[part] as RecursiveProxy;
		}

		const finalPart = path[path.length - 1];
		currentLevel[finalPart] = (...args: unknown[]): Promise<unknown> => {
			return new Promise((resolve, reject) => {
				const id = crypto.randomUUID();
				const message: WorkerToHostMessage = {
					type: "actionRequest",
					payload: { id, methodName, args },
				};

				const responseHandler = (event: MessageEvent<HostToWorkerMessage>) => {
					if (event.data.type === "actionResponse" && event.data.payload.id === id) {
						port.removeEventListener("message", responseHandler);
						const { result, error } = event.data.payload;
						error ? reject(new Error(error)) : resolve(result);
					}
				};
				port.addEventListener("message", responseHandler);
				port.postMessage(message);
			});
		};
	}
	return kl;
}

/**
 * Handles the initial message from the host to set up and execute the script.
 */
self.onmessage = async (
	event: MessageEvent<{
		code: string;
		context: string;
		apiShape: ApiMethod[];
	}>,
) => {
	const port = event.ports[0];
	if (!port) {
		self.close();
		return;
	}

	port.start();

	const { code, context, apiShape } = event.data;

	try {
		const kl = createKitProxy(port, apiShape);

		// The execution logic is now much simpler.
		// We wrap the entire user script in an async function and immediately execute it.
		const scriptFn = new Function("kl", "context", `(async () => { ${code} })();`);

		await scriptFn(kl, JSON.parse(context));

		port.postMessage({ type: "executionResult", payload: { status: "success" } });
	}
	catch (error: unknown) {
		port.postMessage({ type: "executionResult", payload: { status: "error", error: (error as Error).message } });
	}
	finally {
		port.close();
		self.close();
	}
};
