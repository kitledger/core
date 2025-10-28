import { Hono } from "hono";
import { serve } from '@hono/node-server';
import { serveStatic } from "@hono/node-server/serve-static";
import { apiV1Prefix, apiV1Router } from "./services/http/api/v1/router.js";
import { authPrefix, authRouter } from "./services/http/api/auth/router.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { runMigrations } from "./services/database/db.js";
import { serverConfig } from "./config.js";
import { execute } from "./setup.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await runMigrations();

// --- Server and CLI Startup Logic ---
const args = process.argv.slice(2);

console.log("Arguments:", args);

if (args.length === 0 || args[0] === "serve") {
    console.log(`Server is running on port ${serverConfig.port}`);

    const server = new Hono();

    /**
     * Authentication routes
     * /api/auth/*
     */
    server.route(authPrefix, authRouter);

    /**
     * API v1 routes
     * /api/v1/*
     */
    server.route(apiV1Prefix, apiV1Router);

    /**
     * Serve the client SPA and assets.
     */
    const clientDistPath = join(__dirname, "../client");

    /**
     * Server the assets.
     */
    server.get(
        "/assets/*",
        serveStatic({
            root: clientDistPath,
        }),
    );

    /**
     * Serve the client's index.html file.
     */
    server.get("/app/*", async (c) => {
        const html = await readFile(join(clientDistPath, "index.html"), "utf-8");
        return c.html(html);
    });

    /**
     * Redirect root to /app
     */
    server.get("/", (c) => {
        return c.redirect("/app");
    });

    /**
     * Start the server.
     */
    serve({
        fetch: server.fetch,
        port: serverConfig.port,
    })
}
else {
    await execute(args);
}