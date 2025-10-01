import {
	ActionResponsePayload,
	HostToWorkerMessage,
	KitActionsApi,
	KitActionsApiShape,
	WorkerToHostMessage,
} from "./shared.ts";

// A map to hold the `resolve` functions of pending promises for API calls.
const pendingActionRequests = new Map<string, (response: ActionResponsePayload) => void>();

/**
 * Creates a deeply nested proxy object that mirrors the API shape.
 * Function calls on this object are translated into `postMessage` calls to the host.
 *
 * @param shape The serializable API shape from the host.
 * @param path The current path in the recursive creation.
 * @returns A proxy object that conforms to the KitApi interface.
 */
function createKitProxy<T extends object>(shape: KitActionsApiShape, path: string[] = []): T {
	const kit: { [key: string]: unknown } = {};

	for (const key in shape) {
		const currentPath = [...path, key];
		const value = shape[key];

		if (value === "function") {
			// This is a function, so create the async message-passing wrapper.
			kit[key] = (...args: unknown[]): Promise<unknown> => {
				return new Promise((resolve, reject) => {
					const id = crypto.randomUUID();

					// The handler for the response from the host.
					const responseHandler = (response: ActionResponsePayload) => {
						pendingActionRequests.delete(id);
						if (response.error) {
							reject(new Error(response.error));
						}
						else {
							resolve(response.result);
						}
					};

					pendingActionRequests.set(id, responseHandler);

					const message: WorkerToHostMessage = {
						type: "actionRequest",
						payload: { id, path: currentPath, args },
					};
					self.postMessage(message);
				});
			};
		}
		else {
			// This is a nested object, so recurse.
			kit[key] = createKitProxy(value, currentPath);
		}
	}
	// We cast here because we are programmatically building an object
	// that conforms to the generic type T.
	return kit as T;
}

/**
 * The main execution function for untrusted code.
 */
async function executeUntrustedCode(code: string, context: string, apiShape: KitActionsApiShape) {
	try {
		// Create the fully-typed `kit` object for the sandboxed function.
		const kit = createKitProxy<KitActionsApi>(apiShape);

		// Dynamically create and execute the user's code.
		const sandboxedFunction = new Function(
			"kit",
			"context",
			`'use strict'; return (async () => { ${code} })();`,
		);

		await sandboxedFunction(kit, context);

		const result: WorkerToHostMessage = {
			type: "executionResult",
			payload: { status: "success", data: "completed" },
		};
		self.postMessage(result);
	}
	catch (error: unknown) {
		const result: WorkerToHostMessage = {
			type: "executionResult",
			payload: { status: "error", error: (error as Error).message },
		};
		self.postMessage(result);
	}
}

// Main message handler for the worker.
self.onmessage = (event: MessageEvent<HostToWorkerMessage>) => {
	const message = event.data;

	switch (message.type) {
		case "execute": {
			const { code, context, apiShape } = message.payload;
			executeUntrustedCode(code, context, apiShape);
			break;
		}
		case "actionResponse": {
			const { id } = message.payload;
			if (pendingActionRequests.has(id)) {
				const resolve = pendingActionRequests.get(id)!;
				resolve(message.payload);
			}
			break;
		}
	}
};
