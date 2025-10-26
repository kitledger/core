import { Hono } from "@hono/hono";
import { setCookie } from "@hono/hono/cookie";
import { authConfig } from "../../../../config.ts";
import { assembleSessionJwtPayload, signToken } from "../../../../domain/actions/jwt_actions.ts";
import { validateUserCredentials } from "../../../../domain/repositories/user_repository.ts";
import { startSession } from "../../../../domain/actions/session_actions.ts";

const router = new Hono();

router.post("/login", async (c) => {
	try {
		const { email, password } = await c.req.json();

		const user = await validateUserCredentials(email, password);
		if (!user) {
			return c.json({ error: "Invalid credentials" }, 401);
		}

		const sessionId = await startSession(user.id);
		const sessionJwtPayload = assembleSessionJwtPayload(sessionId);
		const sessionToken = await signToken(sessionJwtPayload);

		// Set the HttpOnly cookie
		setCookie(c, authConfig.sessionCookieName, sessionToken, {
			path: "/",
			secure: true, // Only send over HTTPS (set to false for localhost dev)
			httpOnly: true, // Cannot be accessed by client-side JS
			sameSite: "Strict", // Strongest CSRF protection
			maxAge: 60 * 60 * 24 * 7, // 7 days
		});

		return c.json({
			id: user.id,
			email: user.email,
			first_name: user.first_name,
			last_name: user.last_name,
		});
	}
	catch (error) {
		console.error("Login failed:", error);
		return c.json({ error: "Login failed" }, 500);
	}
});

export const authRouter = router;
export const authPrefix = "/api/auth";
