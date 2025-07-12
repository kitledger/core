import { Hono } from "@hono/hono";
import { runMigrations } from "./database/db.ts";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello, Hono!");
});

await runMigrations();

Deno.serve({ port: 8888 }, app.fetch);
