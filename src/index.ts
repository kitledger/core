import { runMigrations } from "./database/db.js";
import { serve } from "@hono/node-server";
import server from "./http/server.js";
import { serverConfig } from "./config.js";

/**
 * Run database migrations
 */
await runMigrations();

/**
 * Start the App
 */
serve({
	fetch: server.fetch,
	port: serverConfig.port,
});
