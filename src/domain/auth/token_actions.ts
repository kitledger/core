import { db } from "../../services/database/db.ts";
import { api_tokens } from "../../services/database/schema.ts";
import { and, eq, isNull } from "drizzle-orm";
import { generate as v7 } from "@std/uuid/unstable-v7";

export async function getTokenUserId(tokenId: string): Promise<string | null> {
	const token = await db.query.api_tokens.findFirst({
		where: and(eq(api_tokens.id, tokenId), isNull(api_tokens.revoked_at)),
		columns: {
			user_id: true,
		},
	});

	if (token) {
		return token.user_id;
	} else {
		return null;
	}
}

export async function createToken(userId: string, name?: string | null): Promise<string> {
	const tokenId = v7();

	await db.insert(api_tokens).values({
		id: tokenId,
		user_id: userId,
		name: name ?? "API Token",
		revoked_at: null,
	});

	return tokenId;
}
