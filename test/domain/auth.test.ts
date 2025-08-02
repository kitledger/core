import { factory, makeApiToken, makeSession, makeUser } from "../../src/services/database/factory.ts";
import { type User } from "../../src/services/database/schema.ts";
import { assert } from "@std/assert";
import { type NewSuperUser, createSuperUser, getUserKey, getUserEmailKey } from "../../src/domain/auth/users.ts";
import { kv } from "../../src/services/database/kv.ts";
import { SYSTEM_ADMIN_PERMISSION, getSystemPermissionKey } from "../../src/domain/auth/permission.ts";

Deno.test("User factory creates valid User objects", () => {
	const users = factory(makeUser, 5);
	assert(users.length === 5);
	users.forEach(user => {
		assert(typeof user.id === "string");
		assert(typeof user.email === "string");
		assert(user.email.includes("@"));
		assert(typeof user.password_hash === "string");
	});
});

Deno.test("Session factory creates valid Session objects", () => {
	const sessions = factory(makeSession, 3);
	assert(sessions.length === 3);
	sessions.forEach(session => {
		assert(typeof session.user_id === "string");
		assert(typeof session.expires_at === "number" || typeof session.expires_at === "string");
	});
});

Deno.test("ApiToken factory creates valid ApiToken objects", () => {
	const tokens = factory(makeApiToken, 4);
	assert(tokens.length === 4);
	tokens.forEach(token => {
		assert(typeof token.id === "string");
		assert(typeof token.user_id === "string");
		assert(typeof token.name === "string");
		assert(token.revoked_at === null || token.revoked_at instanceof Date);
	});
});

Deno.test("createSuperUser returns a valid NewSuperUser object", async () => {
	const fakeUser = factory(makeUser, 1)[0];
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
	const userFromDbRes = await kv.get(getUserKey(newSuperUser.id));
	const userFromDb = userFromDbRes.value as User | null;
	assert(userFromDb !== null);
	assert(userFromDb.first_name === newSuperUser.first_name);
	assert(userFromDb.last_name === newSuperUser.last_name);

	const userEmailFromDbRes = await kv.get(getUserEmailKey(newSuperUser.email));
	const userEmailFromDb = userEmailFromDbRes.value as string | null;
	assert(userEmailFromDb === newSuperUser.id);

	const systemPermissionFromDbRes = await kv.get(getSystemPermissionKey(newSuperUser.id));
	const systemPermissionFromDb = systemPermissionFromDbRes.value as string[] | null;
	assert(systemPermissionFromDb?.includes(SYSTEM_ADMIN_PERMISSION));
});