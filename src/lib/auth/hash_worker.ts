import { hash } from "@node-rs/argon2";

export interface WorkerData {
	input: string;
	options: {
		type: number;
		memoryCost: number;
		timeCost: number;
		parallelism: number;
	};
}

export interface HashWorkerResponse {
	hash?: string;
	error?: string;
}

self.onmessage = (event: MessageEvent<WorkerData>) => {
	const workerData = event.data;
	if (!workerData || !workerData.input || typeof workerData.input !== "string") {
		self.postMessage({ error: "Input must be a non-empty string" } as HashWorkerResponse);
		return;
	}

	hash(workerData.input, workerData.options)
		.then((hashed) => self.postMessage({ hash: hashed } as HashWorkerResponse))
		.catch((err: Error) => self.postMessage({ error: err.message } as HashWorkerResponse));
};
