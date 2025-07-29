import { Worker } from "worker_threads";
import { HashWorkerResponse } from "./workers/hash_worker.js";

export async function hashPassword(input: string): Promise<string> {
	if (!input || typeof input !== "string") {
		throw new Error("Input must be a non-empty string");
	}

	return new Promise((resolve, reject) => {
		const worker = new Worker(new URL("./workers/hash_worker.ts", import.meta.url), {
			workerData: {
				input,
				options: {
					type: 2, // argon2id
					memoryCost: 65536, // 64 MiB
					timeCost: 5, // 5 iterations
					parallelism: 1,
				},
			},
		});

		worker.on("message", (msg: HashWorkerResponse) => {
			if (msg.error) {
				reject(new Error(msg.error));
			} else {
				resolve(msg.hash!);
			}
		});

		worker.on("error", reject);
		worker.on("exit", (code) => {
			if (code !== 0) {
				reject(new Error(`Worker stopped with exit code ${code}`));
			}
		});
	});
}
