import { Hono } from "@hono/hono";

const app = new Hono();

app.get("/", (c) => {
	return c.text("Hello, Hono!");
});

Deno.serve({ port: 8888 }, app.fetch);
