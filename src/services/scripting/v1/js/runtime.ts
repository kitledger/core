import {
	ExecutionResultPayload,
	HostToWorkerMessage,
	KitActionsApi,
	KitActionsApiShape,
	WorkerToHostMessage,
} from "./shared.ts";

// Create a worker with no file system, network, or environment access.
const worker = new Worker(new URL("./worker.ts", import.meta.url).href, {
	type: "module",
	deno: {
		permissions: "none",
	},
});

/**
 * The **actual implementation** of the Kit API.
 * It must conform to the `KitActionsApi` interface from `shared_types.ts`.
 */
const kitActionsApiImplementation: KitActionsApi = {
	billing: {
		invoices: {
			create: async (data) => {
				console.log(`HOST: Fulfilling billing.invoices.create with`, data);
				// Imagine database logic here...
				return { invoiceId: `inv_${crypto.randomUUID()}`, status: "created" };
			},
		},
	},
	utils: {
		log: async (...args) => {
			console.log("[User Script Log]:", ...args);
			return "logged";
		},
	},
};

/**
 * A type-safe, recursive function to find and execute a method on the
 * `kitActionsApiImplementation` object based on a path array.
 */
async function invokeApiMethod(path: string[], args: unknown[]): Promise<unknown> {
	let current: unknown = kitActionsApiImplementation;
	for (const key of path) {
		if (typeof current === "object" && current !== null && key in current) {
			current = (current as Record<string, unknown>)[key];
		}
		else {
			throw new Error(`API path not found: ${path.join(".")}`);
		}
	}

	if (typeof current !== "function") {
		throw new Error(`API path does not resolve to a function: ${path.join(".")}`);
	}

	return await current(...args);
}

// Listen for messages (Action Requests) from the worker.
worker.addEventListener("message", async (event: MessageEvent<WorkerToHostMessage>) => {
	const message = event.data;

	if (message.type !== "actionRequest") {
		return;
	}

	const { id, path, args } = message.payload;
	try {
		const result = await invokeApiMethod(path, args);
		const response: HostToWorkerMessage = {
			type: "actionResponse",
			payload: { id, result },
		};
		worker.postMessage(response);
	}
	catch (e) {
		const response: HostToWorkerMessage = {
			type: "actionResponse",
			payload: { id, error: (e as Error).message },
		};
		worker.postMessage(response);
	}
});

/**
 * Generates a serializable object representing the API's structure.
 * This is sent to the worker so it can build the proxy.
 */
function getApiShape<T extends object>(obj: T): KitActionsApiShape {
	const shape: KitActionsApiShape = {};
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const value = obj[key];
			if (typeof value === "function") {
				shape[key] = "function";
			}
			else if (typeof value === "object" && value !== null) {
				shape[key] = getApiShape(value);
			}
		}
	}
	return shape;
}

export function executeScript(code: string, context: string): Promise<ExecutionResultPayload> {
	const apiShape = getApiShape(kitActionsApiImplementation);
	return new Promise((resolve) => {
		const resultHandler = (event: MessageEvent<WorkerToHostMessage>) => {
			if (event.data.type === "executionResult") {
				worker.removeEventListener("message", resultHandler);
				resolve(event.data.payload);
			}
		};
		worker.addEventListener("message", resultHandler);

		const message: HostToWorkerMessage = {
			type: "execute",
			payload: { code, context, apiShape },
		};
		worker.postMessage(message);
	});
}
