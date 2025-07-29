import { users, system_permissions } from "../../database/schema.js";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { db } from "../../database/db.js";
import { randomBytes } from "node:crypto";
import { hashPassword } from "./utils.js";
import { v7 } from "uuid";
import { SYSTEM_ADMIN_PERMISSION } from "./permission.js";
import { createToken } from "./token.js";
import { signToken, assembleApiTokenJwtPayload } from "./jwt.js";

export type User = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;

type NewSuperUser = Pick<User, "id" | "first_name" | "last_name" | "email"> & {
	password: string;
	api_token: string;
};

export async function createSuperUser(
	firstName: string,
	lastName: string,
	email: string,
): Promise<NewSuperUser | null> {
	const newSuperUser: NewSuperUser | null = await db.transaction(async (tx) => {
		try {
			/**
			 * generate a random password.
			 */
			const password = randomBytes(20).toString("hex");
			const passwordHash = await hashPassword(password);

			if (!passwordHash) {
				throw new Error("Failed to hash password");
			}

			const userId = v7();
			const newUser = await tx
				.insert(users)
				.values({
					id: userId,
					first_name: firstName,
					last_name: lastName,
					email: email,
					password_hash: passwordHash,
				})
				.returning();

			await tx.insert(system_permissions).values({
				id: v7(),
				user_id: newUser[0].id,
				permission: SYSTEM_ADMIN_PERMISSION,
			});

			return {
				id: newUser[0].id,
				first_name: firstName,
				last_name: lastName,
				email: email,
				password: password,
				api_token: "",
			};
		} catch (error) {
			console.error("Error creating super user:", error);
			tx.rollback();
			return null;
		}
	});

	// Create API token for the new super user, using the encapsulated function.

	if (!newSuperUser) {
		return null;
	}

	const tokenName = `${firstName} ${lastName} Super User Token`.slice(0, 64);
	const apiToken = await createToken(newSuperUser.id, tokenName);

	if (!apiToken) {
		console.error("Failed to create API token for super user");
	}

	newSuperUser.api_token = await signToken(assembleApiTokenJwtPayload(apiToken));

	return newSuperUser;
}
