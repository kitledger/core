import { runMigrations } from "./database/db.ts";
import server from "./http/server.ts";
import { serverConfig } from "./config.ts";
import { execute } from "./cli.ts";

await runMigrations();

const args = Deno.args;

if (args.length === 0 || args[0] === "serve") {
	console.log(`Server is running on port ${serverConfig.port}`);
	Deno.serve(
		{ port: serverConfig.port },
		server.fetch,
	);
} else {
	await execute(args);
}
