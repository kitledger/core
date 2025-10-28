import assert from "node:assert";
import test from "node:test";
import { auth } from "../../src/server/services/http/middleware/auth_middleware.js";
import { Context } from "hono";
import { serverConfig } from "../../src/server/config.js";

test("Hono Auth middleware returns 401 for missing token", async () => {
	const c = {
		req: {
			header: () => null,
			raw: {
				headers: new Headers(),
			},
		},
		json: (body: Record<string, string>, status: number) => {
			assert(status === 401, "Expected status code to be 401");
			console.log("Body Error:", body.error);
			assert(body.error === "Unauthorized", "Expected error message to be 'Unauthorized'");
		},
		env: {},
		finalized: false,
		get: () => undefined,
		set: () => {},
	} as unknown as Context;

	await auth(c, async () => {});
});

test("CORS Server Configuration is set correctly", () => {
	assert(typeof serverConfig.cors === "object" || serverConfig.cors === "*");
	assert(serverConfig.cors.allowMethods?.includes("GET"), "Expected CORS to allow GET method");
	assert(serverConfig.cors.allowHeaders?.includes("Authorization"), "Expected CORS to allow Authorization header");
	assert(serverConfig.cors.maxAge && serverConfig.cors.maxAge >= 3600, "Expected CORS max age to be 3600 seconds");
	assert(serverConfig.cors.credentials === false, "Expected CORS credentials to be false");
});
