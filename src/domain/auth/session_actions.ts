import { db } from "../../services/database/db.ts";
import { sessions } from "../../services/database/schema.ts";
import { sessionConfig } from "../../config.ts";
import { and, eq } from "drizzle-orm";
import { generate as v7 } from "@std/uuid/unstable-v7";

export async function getSessionUserId(sessionId: string): Promise<string | null> {
	const cache = await db.query.sessions.findFirst({
		where: and(eq(sessions.id, sessionId)),
		columns: {
			user_id: true,
		},
	});
	return cache ? cache.user_id : null;
}

export async function startSession(userId: string): Promise<string> {
	const sessionId = v7();

	await db.insert(sessions).values({
		id: sessionId,
		user_id: userId,
		expires_at: new Date(Date.now() + (sessionConfig.ttl * 1000)),
		created_at: new Date(),
	});

	return sessionId;
}
