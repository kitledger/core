import { workerPool } from "../../server/services/workers/pool.ts";
import { availableWorkerTasks } from "../../server/services/workers/worker.ts";
import { assert } from "@std/assert";
import { generate } from "@std/uuid/unstable-v7";

Deno.test("Worker pool can add and run tasks", async () => {
	const passwordToHash = generate();

	const result = await workerPool.execute(passwordToHash, availableWorkerTasks.HASH_PASSWORD);

	assert(typeof result === "string" && result.length > 0, "Expected a valid hashed password");
	assert(result.startsWith("$argon2id$"), "Expected the result to be a valid argon2id hash");
});
