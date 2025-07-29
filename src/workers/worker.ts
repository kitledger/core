import { hashPassword } from "../lib/auth/utils.ts";

export enum availableWorkerTasks {
	HASH_PASSWORD = "HASH_PASSWORD",
}

type IncomingMessage = {
	id: string;
	task: string;
	payload: unknown;
};

self.onmessage = async (e: MessageEvent<IncomingMessage>) => {
	const { id, task, payload } = e.data;

	try {
		let result: unknown;

		switch (task) {
			case availableWorkerTasks.HASH_PASSWORD:
				result = await hashPassword(payload as string);
				break;

			default:
				throw new Error(`Unknown task: ${task}`);
		}

		self.postMessage({ id, status: "success", data: result });
	} catch (error) {
		const err = error as Error;
		self.postMessage({ id, status: "error", data: err.message });
	}
};
