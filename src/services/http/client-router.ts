import { Hono } from "@hono/hono";
import { serveStatic } from "@hono/hono/deno";
import { join } from "@std/path/join";

//const __dirname = Deno.cwd();

/**
 * Create a router for the client
 */
export const clientRouter = new Hono();

/**
 * Server the assets.
 */
clientRouter.get(
	"/assets/*",
	serveStatic({
		root: join(String(import.meta.dirname), "../../../dist/client"),
	}),
);

/**
 * Serve the client's index.html file.
 */
clientRouter.get("/app/*", async (c) => {
	const html = await Deno.readTextFile(join(String(import.meta.dirname), "../../../dist/client/index.html"));
	return c.html(html);
});

/**
 * Redirect root to /app
 */
clientRouter.get("/", (c) => {
	return c.redirect("/app");
});
