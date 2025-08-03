import { faker } from "@faker-js/faker";
import {
	ApiToken,
	EntityModel,
	Permission,
	PermissionAssignment,
	Role,
	Session,
	SystemPermission,
	TransactionModel,
	UnitModel,
	User,
	UserRole,
} from "./schema.ts";

/**
 * A generic factory function to create an array of items.
 * @param factory A function that creates a single item.
 * @param count The number of items to create.
 * @returns An array of created items.
 */
export const factory = <T>(factory: () => T, count: number): T[] => {
	return Array.from({ length: count }, factory);
};

// --- Individual Item Factories ---

export const makeApiToken = (): ApiToken => ({
	id: faker.string.uuid(),
	user_id: faker.string.uuid(),
	name: faker.lorem.word(),
	revoked_at: faker.datatype.boolean() ? faker.date.recent() : null,
});

export const makeEntityModel = (): EntityModel => ({
	id: faker.string.uuid(),
	ref_id: faker.string.alphanumeric(10),
	name: faker.company.name(),
	alt_id: faker.datatype.boolean() ? faker.string.alphanumeric(8) : null,
	active: faker.datatype.boolean(),
	created_at: faker.date.past(),
	updated_at: faker.date.recent(),
});

export const makePermissionAssignment = (): PermissionAssignment => ({
	id: faker.string.uuid(),
	permission_id: faker.string.uuid(),
	user_id: faker.datatype.boolean() ? faker.string.uuid() : null,
	created_at: faker.date.past(),
	updated_at: faker.date.recent(),
	role_id: faker.datatype.boolean() ? faker.string.uuid() : null,
});

export const makePermission = (): Permission => ({
	id: faker.string.uuid(),
	name: `can_${faker.word.verb()}_${faker.word.noun()}`,
	created_at: faker.date.past(),
	updated_at: faker.date.recent(),
	description: faker.lorem.sentence(),
});

export const makeRole = (): Role => ({
	id: faker.string.uuid(),
	name: faker.person.jobTitle(),
	description: faker.lorem.sentence(),
	created_at: faker.date.past(),
	updated_at: faker.date.recent(),
});

export const makeSession = (): Session => ({
	user_id: faker.string.uuid(),
	expires_at: faker.date.future().getTime(),
});

export const makeSystemPermission = (): SystemPermission => ({
	id: faker.string.uuid(),
	permission: `system:${faker.word.noun()}:${faker.word.verb()}`,
	user_id: faker.string.uuid(),
	created_at: faker.date.past(),
	updated_at: faker.date.recent(),
});

export const makeTransactionModel = (): TransactionModel => ({
	id: faker.string.uuid(),
	ref_id: `txn_${faker.string.alphanumeric(12)}`,
	name: faker.finance.transactionType(),
	alt_id: faker.datatype.boolean() ? faker.string.alphanumeric(8) : null,
	active: faker.datatype.boolean(),
	created_at: faker.date.past(),
	updated_at: faker.date.recent(),
});

export const makeUnitModel = (): UnitModel => ({
	id: faker.string.uuid(),
	ref_id: faker.string.alphanumeric(6),
	name: faker.science.unit().name,
	alt_id: faker.datatype.boolean() ? faker.string.alphanumeric(8) : null,
	active: faker.datatype.boolean(),
	base_unit_id: faker.datatype.boolean() ? faker.string.uuid() : null,
	created_at: faker.date.past(),
	updated_at: faker.date.recent(),
});

export const makeUser = (): User => {
	const firstName = faker.person.firstName();
	const lastName = faker.person.lastName();
	return {
		id: faker.string.uuid(),
		first_name: firstName,
		last_name: lastName,
		email: faker.internet.email({ firstName, lastName }),
		password_hash: faker.internet.password({ length: 60 }),
		created_at: faker.date.past(),
		updated_at: faker.date.recent(),
	};
};

export const makeUserRole = (): UserRole => ({
	id: faker.string.uuid(),
	user_id: faker.string.uuid(),
	role_id: faker.string.uuid(),
	created_at: faker.date.past(),
	updated_at: faker.date.recent(),
});
