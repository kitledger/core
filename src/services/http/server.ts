import { Hono } from "@hono/hono";
import { apiV1Prefix, apiV1Router } from "./api/v1/router.ts";
import { clientRouter } from "./client-router.ts";

const server = new Hono();

server.route(apiV1Prefix, apiV1Router);

/**
 * Serve the client SPA and assets.
 */
server.route("/", clientRouter);

export default server;
