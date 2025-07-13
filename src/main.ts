import { runMigrations } from "./database/db.ts";
import server from "./http/server.ts";
import { appConfig } from "./config.ts";

/**
 * Run database migrations
 */
await runMigrations();

/**
 * Start the App
 */
Deno.serve(
	{ port: appConfig.server.port },
	server.fetch,
);
