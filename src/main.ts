import { runMigrations } from "./database/db.ts";
import server from "./server.ts";
import config from "./config.ts";

/**
 * Run database migrations
 */
await runMigrations();

/**
 * Start the App
 */
Deno.serve(
	{ port: config.server.port },
	server.fetch,
);
