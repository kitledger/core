import assert from "node:assert";
import {test, after} from "node:test";
import { executeScript, shutdownScripting } from "../../server/services/scripting/runtime.js";

const iterations = 1000;

test(`Kit Action Script Benchmark - ${iterations} Concurrent Executions`, async () => {
	const preCompiledUserCode = `
	var __defProp = Object.defineProperty;
	var __export = (target, all) => {
	for (var name in all)
		__defProp(target, name, { get: all[name], enumerable: true });
	};
	var unit_model_exports = {};
	__export(unit_model_exports, {
	create: () => create
	});
	function __host_rpc(method, data) {
	return new Promise((resolve, reject) => {
		const id = crypto.randomUUID();
		const payload = { id, method, payload: data };
		const responseHandler = (event) => {
		if (event.data && event.data.type === "ACTION_RESPONSE" && event.data.payload.id === id) {
			self.removeEventListener("message", responseHandler);
			const { result, error } = event.data.payload;
			if (error) {
			reject(new Error(error));
			} else {
			resolve(result);
			}
		}
		};
		self.addEventListener("message", responseHandler);
		self.postMessage({ type: "ACTION_REQUEST", payload });
	});
	}
	async function create(data) {
	return await __host_rpc("UNIT_MODEL.CREATE", data);
	}
	async function sample_default(context) {

	// Do just one operation
	await unit_model_exports.create({
		ref_id: \`model-\${context.eventId}\`,
		name: "Sample Model",
	});
	}
	export {
	sample_default as default
	};
	`;

	console.log(`--- Executing Kit Action Script (${iterations}x Concurrency Benchmark) ---`);

	const promises = [];

	const startTime = performance.now();

	for (let i = 0; i < iterations; i++) {
		const contextData = JSON.stringify({ eventId: `evt_batch_${i}` });

		promises.push(
			executeScript({
				code: preCompiledUserCode,
				inputJSON: contextData,
				scriptType: "ScheduledTask",
				timeoutMs: 5000,
			}),
		);
	}

	// Wait for all 1,000 scripts to complete
	await Promise.all(promises);

	const endTime = performance.now();
	const duration = endTime - startTime;
	const avg = duration / iterations;

	console.log("--- Benchmark Finished ---");
	console.log(`Total executions: ${iterations}`);
	console.log(`Total time: ${duration.toFixed(2)} ms`);
	console.log(`Average script time: ${avg.toFixed(2)} ms/script`);
	console.log("---------------------------------");

	assert(typeof duration === "number" && duration > 0, "Duration should be a positive number");
	assert(typeof avg === "number" && avg > 0, "Average time should be a positive number");
});

after(() => {
    shutdownScripting();
});
