import { Hono } from "@hono/hono";

const server = new Hono();

server.get("/", (c) => {
	return c.text("Hello, Hono!");
});

export default server;
