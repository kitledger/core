import { cache } from "../../database/cache.ts";
import { sessionConfig } from "../../config.ts";
import { generate as v7 } from "@std/uuid/unstable-v7";

export type Session = {
	user_id: string;
	expires_at: number | string;
};

export async function getSessionUserId(sessionId: string): Promise<string | null> {
	const cacheKey = getSessionCacheKey(sessionId);
	const sessionData = await cache.get(cacheKey);

	if (sessionData) {
		try {
			const session = JSON.parse(sessionData) as Session;
			const currentTimeInSeconds = Date.now() / 1000;

			if (Number(session.expires_at) < currentTimeInSeconds) {
				// Clear the expired session from cache
				await cache.del(cacheKey);
				return null;
			}

			// Bump the TTL
			await cache.expire(cacheKey, sessionConfig.ttl);

			return session.user_id || null;
		} catch (error) {
			console.error("Failed to parse session data:", error);
			return null;
		}
	} else {
		return null;
	}
}

export async function startSession(userId: string): Promise<string> {
	const sessionId = v7();
	const expiresAt = Date.now() + sessionConfig.maxLifetime * 1000;

	const sessionKey = getSessionCacheKey(sessionId);
	const sessionData: Session = {
		user_id: userId,
		expires_at: expiresAt,
	};
	await cache.set(sessionKey, JSON.stringify(sessionData), "EX", sessionConfig.ttl);
	return sessionId;
}

function getSessionCacheKey(sessionId: string): string {
	return `kl_session:${sessionId}`;
}
