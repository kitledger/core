import { workerPool } from "../../server/services/workers/pool.js";
import { availableWorkerTasks } from "../../server/services/workers/worker.js";
import assert from "node:assert";
import test from "node:test";
import { v7 as generate } from "uuid";

test("Worker pool can add and run tasks", async () => {
	const passwordToHash = generate();

	const result = await workerPool.execute(passwordToHash, availableWorkerTasks.HASH_PASSWORD);

	assert(typeof result === "string" && result.length > 0, "Expected a valid hashed password");
	assert(result.startsWith("$argon2id$"), "Expected the result to be a valid argon2id hash");
});
