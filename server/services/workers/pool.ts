import { FixedThreadPool } from "poolifier";
import { workerConfig } from "../../config.js";

export const workerPool = new FixedThreadPool(
	workerConfig.poolSize,
	new URL("./worker.js", import.meta.url).toString(),
);
