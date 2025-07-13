import { createMiddleware } from "@hono/hono/factory";
import { authConfig } from "../../config.ts";

export const auth = createMiddleware(async (c, next) => {
	const authMode = authConfig.authMode;

	switch (authMode) {
		case 'token': {

			const raw_token = c.req.header("Authorization")?.replace("Bearer ", "");
			
			// Return early if no token is provided.
			if (!raw_token) {
				return c.json({ error: "Unauthorized" }, 401);
			}

			// TEMP: HANDLE ANY TOKEN
			// TODO: Implement proper token validation logic for both user and m2m.
			const token = raw_token.trim();
			console.log(`Received token: ${token}`);
			await next();

			break;
		}
		default: {
			return c.json({ error: "Unsupported authentication mode" }, 500);
		}
	}
});

