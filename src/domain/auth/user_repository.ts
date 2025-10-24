import { db } from "../../services/database/db.ts";
import { api_tokens, sessions, users } from "../../services/database/schema.ts";
import { and, eq, isNull, gt } from "drizzle-orm";
import { verifyPassword } from "./utils.ts";

export async function getSessionUserId(sessionId: string): Promise<string | null> {
	const session = await db.query.sessions.findFirst({
		where: and(
			eq(sessions.id, sessionId),
			gt(sessions.expires_at, new Date()),
		),
		columns: {
			user_id: true,
		},
	});
	return session ? session.user_id : null;
}

export async function getTokenUserId(tokenId: string): Promise<string | null> {
	const token = await db.query.api_tokens.findFirst({
		where: and(eq(api_tokens.id, tokenId), isNull(api_tokens.revoked_at)),
		columns: {
			user_id: true,
		},
	});

	if (token) {
		return token.user_id;
	}
	else {
		return null;
	}
}

export async function validateUserCredentials(
	email: string,
	password: string,
): Promise<{id: string, first_name: string, last_name: string, email: string} | null> {
	const user = await db.query.users.findFirst({
		where: eq(users.email, email),
		columns: {
			id: true,
			first_name: true,
			last_name: true,
			email: true,
			password_hash: true,
		},
	});

	if (!user || !user.password_hash) {
		return null;
	}

	const validPassword = await verifyPassword(user.password_hash, password);

	if (validPassword) {
		return {
			id: user.id,
			first_name: user.first_name,
			last_name: user.last_name,
			email: user.email,
		};
	}
	else {
		return null;
	}
}
