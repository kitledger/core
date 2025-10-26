import { Hono } from "@hono/hono";
import { apiV1Prefix, apiV1Router } from "./api/v1/router.ts";
import { authPrefix, authRouter } from "./api/auth/router.ts";
import { clientRouter } from "./client-router.ts";

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
server.route("/", clientRouter);

export default server;
