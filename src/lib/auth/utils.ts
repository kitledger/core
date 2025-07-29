import { HashWorkerResponse, WorkerData } from "./hash_worker.ts";

export function hashPassword(input: string): Promise<string> {
	if (!input || typeof input !== "string") {
		throw new Error("Input must be a non-empty string");
	}

	return new Promise((resolve, reject) => {
		const worker = new Worker(new URL("./hash_worker.ts", import.meta.url).href, {
			type: "module",
		});

		const workerData: WorkerData = {
			input,
			options: {
				type: 2, // argon2id
				memoryCost: 65536, // 64 MiB
				timeCost: 5, // 5 iterations
				parallelism: 1,
			},
		};

		worker.postMessage(workerData);

		worker.onmessage = (event: MessageEvent<HashWorkerResponse>) => {
			const msg = event.data;
			if (msg.error) {
				reject(new Error(msg.error));
			} else {
				resolve(msg.hash!);
			}
		};

		worker.onerror = (error: ErrorEvent) => {
			reject(new Error(`Worker error: ${error.message}`));
		};

		worker.onmessageerror = (error: MessageEvent) => {
			reject(new Error(`Message error: ${error.data}`));
		};
	});
}
