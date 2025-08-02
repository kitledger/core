import { hashPassword } from "../../domain/auth/utils.ts";

export enum availableWorkerTasks {
	HASH_PASSWORD = "HASH_PASSWORD",
}

type IncomingMessage = {
	id: string;
	task: string;
	payload: unknown;
};

/**
 * Defines the router map. To add a new task, you only need to add a new entry here.
 */
const taskRouter = new Map<string, (payload: unknown) => Promise<unknown>>([
	[availableWorkerTasks.HASH_PASSWORD, (payload) => hashPassword(payload as string)],
]);

/**
 * The message handler now uses the map to find and execute the correct task.
 */
self.onmessage = async (e: MessageEvent<IncomingMessage>) => {
	const { id, task, payload } = e.data;

	const handler = taskRouter.get(task);

	if (!handler) {
		const err = new Error(`Unknown task: ${task}`);
		self.postMessage({ id, status: "error", data: err.message });
		return;
	}

	try {
		const result = await handler(payload);
		self.postMessage({ id, status: "success", data: result });
	} catch (error) {
		const err = error as Error;
		self.postMessage({ id, status: "error", data: err.message });
	}
};
