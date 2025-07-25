import { createMiddleware } from "hono/factory";
import { verifyToken, TokenType } from "../../auth/jwt.js";

export const auth = createMiddleware(async (c, next) => {
	const raw_token = c.req.header("Authorization")?.replace("Bearer ", "");

	// Return early if no token is provided.
	if (!raw_token) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	try {
		const token = await verifyToken(raw_token);

		if(!token || !token.token_type)
		{
			throw new Error("Token type is missing or invalid.");
		}

		switch(String(token.token_type).toUpperCase() as TokenType) {
			case TokenType.SESSION:
				// Handle session token logic here
				break;
			case TokenType.INTEGRATION:
				// Handle integration token logic here
				break;
			default:
				throw new Error("Invalid token type.");
		}

		console.table(token);

		// TODO: Figure out what to do with the token after verification.
		//c.set("user", token);
		
	} catch (error) {
		console.error("Token verification failed:", error);
		
		// Try to get the error message from the error object, otherwise use a generic message.
		const errorMessage = error instanceof Error ? error.message : "Unauthorized";

		return c.json({ error: errorMessage }, 401);
	}

	await next();
});
