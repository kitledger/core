import { runMigrations } from "./database/db.js";
import { serve } from "@hono/node-server";
import server from "./http/server.js";
import { serverConfig } from "./config.js";
import { execute } from "./cli.js";

await runMigrations();

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "serve") {
	console.log(`Server is running on port ${serverConfig.port}`);
	serve({
		fetch: server.fetch,
		port: serverConfig.port,
	});
} else {
	await execute(args);
}
