import { kv, getKeyPart, PrimaryKeyType } from "../../services/database/kv.ts";
import { randomBytes } from "node:crypto";
import { generate as v7 } from "@std/uuid/unstable-v7";
import { SYSTEM_ADMIN_PERMISSION, getSystemPermissionKey } from "./permission.ts";
import { createToken } from "./token.ts";
import { assembleApiTokenJwtPayload, signToken } from "./jwt.ts";
import { workerPool } from "../../services/workers/pool.ts";
import { availableWorkerTasks } from "../../services/workers/worker.ts";
import { type User } from "../../services/database/schema.ts";

export type NewSuperUser = Pick<User, "id" | "first_name" | "last_name" | "email"> & {
	password: string;
	api_token: string;
};

export function getUserKey(userId: string): [string, string] {
	return [PrimaryKeyType.USER, userId];
}

export function getUserEmailKey(email: string): [string, string, string] {
	return [PrimaryKeyType.USER, getKeyPart<User>('email'), email];
}

export async function createSuperUser(
	firstName: string,
	lastName: string,
	email: string,
): Promise<NewSuperUser | null> {
	const userId = v7();
	let passwordHash = null;

	try {
		const password = randomBytes(20).toString("hex");

		passwordHash = await workerPool.runTask(
			availableWorkerTasks.HASH_PASSWORD,
			password,
		);
		if (!passwordHash) {
			throw new Error("Failed to hash password");
		}

		const tokenName = `${firstName} ${lastName} Super User Token`.slice(0, 64);
		const apiToken = await createToken(userId, tokenName);

		if (!apiToken) {
			console.error("Failed to create API token for super user");
		}

		const newUser: User = {
			id: userId,
			first_name: firstName,
			last_name: lastName,
			email: email,
			password_hash: passwordHash as string,
		};

		/**
		 * Assemble SuperUser object that is returned to the caller.
		 * It includes the password and API token, which are not stored in the database.
		 * The password is used for the initial login, and the API token is used for API.
		 * These credentials are only meant to be shown once.
		 */
		const newSuperUser: NewSuperUser = {
			id: newUser.id,
			first_name: newUser.first_name,
			last_name: newUser.last_name,
			email: newUser.email,
			password: password,
			api_token: await signToken(assembleApiTokenJwtPayload(apiToken)),
		};

		const res = await kv.atomic()
			.set(getUserKey(newUser.id), newUser)
			.set(getUserEmailKey(email), userId)
			.set(getSystemPermissionKey(newUser.id), [SYSTEM_ADMIN_PERMISSION])
			.commit();

		if (!res.ok) {
			console.error("Failed to create super user in database");
			return null;
		}

		return newSuperUser;
	} catch (error) {
		console.error("Error creating super user:", error);
		return null;
	}
}
