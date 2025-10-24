import { createMiddleware } from "@hono/hono/factory";
import { getCookie } from "@hono/hono/cookie";
import { TokenType, verifyToken } from "../../../domain/auth/jwt_actions.ts";
import { getSessionUserId, getTokenUserId } from "../../../domain/auth/user_repository.ts";
import { authConfig } from "../../../config.ts";

export const auth = createMiddleware(async (c, next) => {
    const headerToken = c.req.header("Authorization")?.replace("Bearer ", "");

    try {
        if (headerToken) {
            const token = await verifyToken(headerToken);

            if (!token || !token.token_type) {
                throw new Error("Token type is missing or invalid.");
            }

            // The existing switch logic handles Header tokens (API or SESSION)
            switch (String(token.token_type).toUpperCase() as TokenType) {
                case TokenType.SESSION: {
                    if (!token.jti) {
                        throw new Error("Invalid session ID.");
                    }
                    const sessionUserId = await getSessionUserId(String(token.jti));
                    if (!sessionUserId) {
                        throw new Error("Invalid session ID.");
                    }
                    c.set("user", sessionUserId);
                    break;
                }
                case TokenType.API: {
                    if (!token.jti) {
                        throw new Error("Invalid token ID.");
                    }
                    const tokenUserId = await getTokenUserId(String(token.jti));
                    if (!tokenUserId) {
                        throw new Error("Invalid token ID.");
                    }
                    c.set("user", tokenUserId);
                    break;
                }
                default: {
                    throw new Error("Invalid token type.");
                }
            }
        } 
        // --- Priority 2: Session Cookie ---
        else {
            const cookieToken = getCookie(c, authConfig.sessionCookieName);

            if (!cookieToken) {
				throw new Error("Invalid or missing session cookie.");
            }

            // A cookie MUST be a session token
            const token = await verifyToken(cookieToken);

            if (!token || String(token.token_type).toUpperCase() !== TokenType.SESSION) {
                throw new Error("Invalid session cookie.");
            }
            if (!token.jti) {
                throw new Error("Invalid session ID in cookie.");
            }
            
            const sessionUserId = await getSessionUserId(String(token.jti));
            if (!sessionUserId) {
                throw new Error("Invalid session.");
            }
            
            c.set("user", sessionUserId);
        }

    } catch (error) {
        console.error("Token verification failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Unauthorized";
        return c.json({ error: errorMessage }, 401);
    }

    await next();
});