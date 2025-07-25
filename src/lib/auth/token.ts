import { db } from "../../database/db.js";
import { api_tokens } from "../../database/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { v7 } from "uuid";

export async function getTokenUserId(tokenId: string): Promise<string | null> {
	
	const token = await db.query.api_tokens.findFirst({
		where: and(
			eq(api_tokens.id, tokenId),
			isNull(api_tokens.revoked_at)
		),
		columns: {
			user_id: true
		}
	});

	if (token) {
		return token.user_id;
	} else {
		return null;
	}
}

export async function createToken(userId: string, name?: string|null): Promise<string> {
	const tokenId = v7();

	await db.insert(api_tokens).values({
		id: tokenId,
		user_id: userId,
		name: name ?? 'API Token',
		revoked_at: null,
	});

	return tokenId;
}