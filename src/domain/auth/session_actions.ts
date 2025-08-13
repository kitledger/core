import { cache } from "../../services/cache/cache.ts";
import { sessionConfig } from "../../config.ts";
import { generate as v7 } from "@std/uuid/unstable-v7";
import { SessionCacheKeyPrefix } from "./types.ts";

export async function getSessionUserId(sessionId: string): Promise<string | null> {
	const cacheKey = getSessionCacheKey(sessionId);
	return await cache.getString(cacheKey, sessionConfig.ttl);
}

export async function startSession(userId: string): Promise<string> {
	const sessionId = v7();
	const sessionKey = getSessionCacheKey(sessionId);

	const result = await cache.setString(sessionKey, userId, sessionConfig.ttl);

	if (!result) {
		throw new Error("Failed to store session");
	}

	return sessionId;
}

function getSessionCacheKey(sessionId: string): string {
	return `${SessionCacheKeyPrefix}${sessionId}`;
}
