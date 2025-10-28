import { ApiTokenFactory, SessionFactory, UserFactory } from "../../server/domain/factories/auth_factories.js";
import { system_permissions, users } from "../../server/services/database/schema.js";
import assert from "node:assert";
import { test, after, describe } from "node:test";
import { createSuperUser, type NewSuperUser } from "../../server/domain/actions/user_actions.js";
import { db } from "../../server/services/database/db.js";
import { SYSTEM_ADMIN_PERMISSION } from "../../server/domain/actions/permission_actions.js";
import {
	assembleApiTokenJwtPayload,
	assembleSessionJwtPayload,
	signToken,
	verifyToken,
} from "../../server/domain/actions/jwt_actions.js";
import { startSession } from "../../server/domain/actions/session_actions.js";
import { v7 as generate } from "uuid";
import { createToken } from "../../server/domain/actions/token_actions.js";
import { getSessionUserId, getTokenUserId } from "../../server/domain/repositories/user_repository.js";
import { hashPassword } from "../../server/domain/utils/crypto.js";
import { eq } from "drizzle-orm";

describe("Auth Domain Tests", () => {
	after(async () => {
		// Close up Drizzle DB Connection
		await db.$client.end();
	});

	test("User factory creates valid User objects", () => {
		const factory = new UserFactory();
		const users = factory.make(5);
		assert(users.length === 5);
		users.forEach((user) => {
			assert(typeof user.id === "string");
			assert(typeof user.email === "string");
			assert(user.email.includes("@"));
			assert(typeof user.password_hash === "string");
		});
	});

	test("Session factory creates valid Session objects", () => {
		const factory = new SessionFactory();
		const sessions = factory.make(3);
		assert(sessions.length === 3);
		sessions.forEach((session) => {
			assert(typeof session === "string");
			assert(session.length === 36); // UUID length
		});
	});

	test("ApiToken factory creates valid ApiToken objects", () => {
		const factory = new ApiTokenFactory();
		const tokens = factory.make(4);
		assert(tokens.length === 4);
		tokens.forEach((token) => {
			assert(typeof token.id === "string");
			assert(typeof token.user_id === "string");
			assert(typeof token.name === "string");
			assert(token.revoked_at === null || token.revoked_at instanceof Date);
		});
	});

	test("createSuperUser returns a valid NewSuperUser object", async () => {
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
		const systemPermissionFromDb = systemPermissionFromDbRes.map((permission) => permission.permission);
		assert(systemPermissionFromDb?.includes(SYSTEM_ADMIN_PERMISSION));
	});

	test("assembleSessionJwtPayload creates a valid JWT payload", () => {
		const sessionId = "test-session-id";
		const payload = assembleSessionJwtPayload(sessionId);
		assert(payload.jti === sessionId);
		assert(payload.token_type === "SESSION");

		const apiTokenPayload = assembleApiTokenJwtPayload("test-api-token-id");
		assert(apiTokenPayload.jti === "test-api-token-id");
		assert(apiTokenPayload.token_type === "API");
	});

	test("verifyToken and signToken work correctly", async () => {
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
		}
		catch (error) {
			assert(error instanceof Error);
			assert(error.message === "Invalid or expired token.");
		}
	});

	test("startSession creates a valid session and retrieves user ID", async () => {
		const factory = new UserFactory();
		const fakeUser = factory.make(1)[0];
		// TODO: Refactor to use a regular user creation function once available
		const newSuperUser: NewSuperUser | null = await createSuperUser(
			fakeUser.first_name,
			fakeUser.last_name,
			fakeUser.email,
		);
		if (newSuperUser === null) {
			throw new Error("Failed to create super user for session test");
		}
		const sessionId = await startSession(newSuperUser.id);
		assert(typeof sessionId === "string" && sessionId.length > 0);

		const retrievedUserId = await getSessionUserId(sessionId);
		assert(retrievedUserId === newSuperUser.id);
	});

	test("createToken and getTokenUserId work correctly", async () => {
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

	test("hashPassword generates a valid hash", async () => {
		const password = "securePassword123";
		const hashedPassword = await hashPassword(password);
		assert(typeof hashedPassword === "string" && hashedPassword.length > 0);
		// Check if the hash is a valid argon2 hash (basic check)
		assert(hashedPassword.startsWith("$argon2id$"));
	});
});
