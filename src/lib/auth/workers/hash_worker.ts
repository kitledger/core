import { parentPort, workerData } from "worker_threads";
import { hash } from "@node-rs/argon2";

interface WorkerData {
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

const { input, options } = workerData as WorkerData;

if (!input || typeof input !== "string") {
	parentPort!.postMessage({ error: "Input must be a non-empty string" } as HashWorkerResponse);
} else {
	hash(input, options)
		.then((hashed) => parentPort!.postMessage({ hash: hashed } as HashWorkerResponse))
		.catch((err: Error) => parentPort!.postMessage({ error: err.message } as HashWorkerResponse));
}
