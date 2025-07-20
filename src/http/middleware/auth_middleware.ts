import { createMiddleware } from "hono/factory";
import { verifyToken } from "../../auth/jwt.js";

export const auth = createMiddleware(async (c, next) => {
	const raw_token = c.req.header("Authorization")?.replace("Bearer ", "");

	// Return early if no token is provided.
	if (!raw_token) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const token = await verifyToken(raw_token);
		console.table(token);
		// TODO: Figure out what to do with the token after verification.
		//c.set("user", token);
	} catch (error) {
		console.error("Token verification failed:", error);
		return c.json({ error: "Unauthorized" }, 401);
	}

	await next();
});
