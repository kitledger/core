import { kv } from "../../services/database/kv.ts";
import { generate as v7 } from "@std/uuid/unstable-v7";
import { type ApiToken } from "../../services/database/schema.ts";

export async function getTokenUserId(tokenId: string): Promise<string | null> {
	const result = await kv.get(["api_token", tokenId]);
	const token = result.value as ApiToken | null;

	if (token) {
		return token.user_id;
	} else {
		return null;
	}
}

export async function createToken(userId: string, name?: string | null): Promise<string> {
	const tokenId = v7();

	await kv.set(["api_token", tokenId], {
		user_id: userId,
		name: name ?? "API Token",
		revoked_at: null,
	});

	return tokenId;
}
