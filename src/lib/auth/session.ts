import { kv } from "../../database/kv.ts";
import { sessionConfig } from "../../config.ts";
import { generate as v7 } from "@std/uuid/unstable-v7";

export type Session = {
	user_id: string;
	expires_at: number | string;
};

export async function getSessionUserId(sessionId: string): Promise<string | null> {
	const cacheKey = getSessionCacheKey(sessionId);
	const sessionDataResult = await kv.get(cacheKey);

	if (sessionDataResult.value) {
		try {
			const session = sessionDataResult.value as Session;
			const currentTimeInSeconds = Date.now() / 1000;

			if (Number(session.expires_at) < currentTimeInSeconds) {
				// Clear the expired session from cache
				await kv.delete(cacheKey);
				return null;
			}

			// Bump the TTL
			await kv.set(cacheKey, session, { expireIn: ttlToMilliseconds(sessionConfig.ttl) });

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
	await kv.set(sessionKey, sessionData, { expireIn: ttlToMilliseconds(sessionConfig.ttl) });
	return sessionId;
}

function getSessionCacheKey(sessionId: string): string[] {
	return ["session", sessionId];
}

function ttlToMilliseconds(ttl: number): number {
	return ttl * 1000;
}
