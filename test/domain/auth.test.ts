import { ApiTokenFactory, SessionFactory, UserFactory } from "../../src/domain/auth/factories.ts";
import { system_permissions, users } from "../../src/services/database/schema.ts";
import { assert } from "@std/assert";
import { type NewSuperUser, createSuperUser } from "../../src/domain/auth/user_actions.ts";
import { db } from "../../src/services/database/db.ts";
import { SYSTEM_ADMIN_PERMISSION } from "../../src/domain/auth/permission_actions.ts";
import { assembleSessionJwtPayload, assembleApiTokenJwtPayload, verifyToken, signToken } from "../../src/domain/auth/jwt_actions.ts";
import { startSession, getSessionUserId } from "../../src/domain/auth/session_actions.ts";
import { generate } from "@std/uuid/unstable-v7";
import { createToken, getTokenUserId } from "../../src/domain/auth/token_actions.ts";
import { hashPassword } from "../../src/domain/auth/utils.ts";
import { eq } from "drizzle-orm";
import { describe, it, afterAll } from "@std/testing/bdd";

describe("Auth Domain Tests", () => {
	afterAll(async () => {
		// Close up Drizzle DB Connection
		await db.$client.end();
	});

	it("User factory creates valid User objects", () => {
		const factory = new UserFactory();
		const users = factory.make(5);
		assert(users.length === 5);
		users.forEach(user => {
			assert(typeof user.id === "string");
			assert(typeof user.email === "string");
			assert(user.email.includes("@"));
			assert(typeof user.password_hash === "string");
		});
	});

	it("Session factory creates valid Session objects", () => {
		const factory = new SessionFactory();
		const sessions = factory.make(3);
		assert(sessions.length === 3);
		sessions.forEach(session => {
			assert(typeof session === "string");
			assert(session.length === 36); // UUID length
		});
	});

	it("ApiToken factory creates valid ApiToken objects", () => {
		const factory = new ApiTokenFactory();
		const tokens = factory.make(4);
		assert(tokens.length === 4);
		tokens.forEach(token => {
			assert(typeof token.id === "string");
			assert(typeof token.user_id === "string");
			assert(typeof token.name === "string");
			assert(token.revoked_at === null || token.revoked_at instanceof Date);
		});
	});

	it("createSuperUser returns a valid NewSuperUser object", async () => {
		const factory = new UserFactory();
		const fakeUser = factory.make(1)[0];
		const newSuperUser: NewSuperUser | null = await createSuperUser(
			fakeUser.first_name,
			fakeUser.last_name,
			fakeUser.email,
		);

		assert(newSuperUser !== null);
		assert(typeof newSuperUser.id === "string");
		assert(newSuperUser.first_name === fakeUser.first_name);
		assert(newSuperUser.last_name === fakeUser.last_name);
		assert(newSuperUser.email === fakeUser.email);
		assert(typeof newSuperUser.password === "string");
		assert(typeof newSuperUser.api_token === "string");
		assert(newSuperUser.api_token.length > 0);
		assert(newSuperUser.password.length > 0);

		// Retrieve the user from the database to verify it was created.
		const userFromDb = await db.query.users.findFirst({
			where: eq(users.id, newSuperUser.id),
		});
		assert(userFromDb !== null);
		assert(userFromDb?.first_name === newSuperUser.first_name);
		assert(userFromDb?.last_name === newSuperUser.last_name);

		const userEmailFromDb = await db.query.users.findFirst({
			where: eq(users.email, newSuperUser.email),
		});
		assert(userEmailFromDb?.id === newSuperUser.id);

		const systemPermissionFromDbRes = await db.query.system_permissions.findMany({
			where: eq(system_permissions.user_id, newSuperUser.id),
		});
		const systemPermissionFromDb = systemPermissionFromDbRes.map(permission => permission.permission);
		assert(systemPermissionFromDb?.includes(SYSTEM_ADMIN_PERMISSION));
	});

	it("assembleSessionJwtPayload creates a valid JWT payload", () => {
		const sessionId = "test-session-id";
		const payload = assembleSessionJwtPayload(sessionId);
		assert(payload.jti === sessionId);
		assert(payload.token_type === "SESSION");

		const apiTokenPayload = assembleApiTokenJwtPayload("test-api-token-id");
		assert(apiTokenPayload.jti === "test-api-token-id");
		assert(apiTokenPayload.token_type === "API");
	});

	it("verifyToken and signToken work correctly", async () => {
		const sampleJTI = generate();
		const payload = { jti: sampleJTI, token_type: "TEST" };
		const token = await signToken(payload);
		assert(typeof token === "string" && token.length > 0);

		const verifiedPayload = await verifyToken(token);
		assert(verifiedPayload.jti === payload.jti);
		assert(verifiedPayload.token_type === payload.token_type);

		// Test with an invalid token
		try {
			const invalidToken = generate();
			await verifyToken(invalidToken);
			assert(false, "Expected verifyToken to throw an error for invalid token");
		} catch (error) {
			assert(error instanceof Error);
			assert(error.message === "Invalid or expired token.");
		}
	});

	it("startSession creates a valid session and retrieves user ID", async () => {
		const userId = generate();
		const sessionId = await startSession(userId);
		assert(typeof sessionId === "string" && sessionId.length > 0);

		const retrievedUserId = await getSessionUserId(sessionId);
		assert(retrievedUserId === userId);
	});

	it("createToken and getTokenUserId work correctly", async () => {
		const user = new UserFactory().make(1)[0];
		await db.insert(users).values(user);
		const tokenId = await createToken(user.id, "Test Token");
		assert(typeof tokenId === "string" && tokenId.length > 0);
		const retrievedUserId = await getTokenUserId(tokenId);
		assert(retrievedUserId === user.id);
		// Test with a non-existent token
		const nonExistentTokenId = generate();
		const nonExistentUserId = await getTokenUserId(nonExistentTokenId);
		assert(nonExistentUserId === null);
	});

	it("hashPassword generates a valid hash", async () => {
		const password = "securePassword123";
		const hashedPassword = await hashPassword(password);
		assert(typeof hashedPassword === "string" && hashedPassword.length > 0);
		// Check if the hash is a valid argon2 hash (basic check)
		assert(hashedPassword.startsWith("$argon2id$"));
	});

});