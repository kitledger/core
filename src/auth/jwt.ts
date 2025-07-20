import { verify } from "hono/jwt";
import { type JWTPayload } from "hono/utils/jwt/types";
import { authConfig } from "../config.js";

export async function verifyToken(token: string): Promise<JWTPayload> {
	const currentSecret = authConfig.secret;

	try {
		const decoded = await verify(token, currentSecret, authConfig.algorithm);
		return decoded;
	} catch (currentSecretError) {
		const pastSecrets = authConfig.pastSecrets || [];

		if (pastSecrets.length > 0) {
			try {
				const decodedFromPast = await Promise.any(
					pastSecrets.map(async (pastSecret) => {
						try {
							const decoded = await verify(token, pastSecret, authConfig.algorithm);
							return decoded;
						} catch (err) {
							console.warn(
								`Failed to verify token with past secrets (${err instanceof Error ? err.message : String(err)}`,
							);
							throw err;
						}
					}),
				);
				return decodedFromPast;
			} catch (aggregateError) {
				console.warn("All past secret verifications failed:", (aggregateError as AggregateError).errors);
			}
		}

		console.error("Token verification ultimately failed:", currentSecretError);
		throw new Error("Invalid or expired token.");
	}
}
