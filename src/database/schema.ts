import { pgTable, text, uuid, varchar, boolean, index, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "./helpers.js";

export enum BalanceType {
	DEBIT = "debit",
	CREDIT = "credit",
}

export const users = pgTable(
	"users",
	{
		id: uuid("id").primaryKey(),
		first_name: text("first_name").notNull(),
		last_name: text("last_name").notNull(),
		email: text("email").notNull().unique(),
		password_hash: text("password_hash").notNull(),
		...timestamps,
	},
	(table) => [index("user_email_idx").on(table.email)],
);

export const userRelations = relations(users, ({ many }) => ({
	roles: many(user_roles),
	apiTokens: many(api_tokens),
}));

// TODO: Add Admin property
// TODO: Add an array for permissions
export const roles = pgTable("roles", {
	id: uuid("id").primaryKey(),
	name: varchar("name", { length: 64 }).notNull().unique(),
	description: varchar("description", { length: 255 }),
	...timestamps,
});

export const roleRelations = relations(roles, ({ many }) => ({
	users: many(user_roles),
}));

export const user_roles = pgTable("user_roles", {
	id: uuid("id").primaryKey(),
	user_id: uuid("user_id")
		.notNull()
		.references(() => users.id),
	role_id: uuid("role_id")
		.notNull()
		.references(() => roles.id),
	...timestamps,
});

export const userRoleRelations = relations(user_roles, ({ one }) => ({
	user: one(users, {
		fields: [user_roles.user_id],
		references: [users.id],
	}),
	role: one(roles, {
		fields: [user_roles.role_id],
		references: [roles.id],
	}),
}));

export const api_tokens = pgTable(
	"api_tokens",
	{
		id: uuid("id").primaryKey(),
		user_id: uuid("user_id")
			.notNull()
			.references(() => users.id),
		name: varchar("name", { length: 64 }).notNull(),
		hash: text("hash").notNull().unique(),
		expires_at: timestamp("expires_at").notNull(),
		revoked_at: timestamp("revoked_at"),
		...timestamps,
	},
	(table) => [index("api_token_user_idx").on(table.user_id)],
);

export const apiTokenRelations = relations(api_tokens, ({ one }) => ({
	user: one(users, {
		fields: [api_tokens.user_id],
		references: [users.id],
	}),
}));

// TODO: Add a table for permissions

// Add indexes
// Add constraints
// Add composite indexes for entities after adding entities table
export const entity_models = pgTable("entity_models", {
	id: uuid("id").primaryKey(),
	ref_id: varchar("ref_id", { length: 64 }).notNull().unique(),
	alt_id: varchar("alt_id", { length: 64 }).unique(),
	name: varchar("name", { length: 255 }).notNull(),
	active: boolean("active").default(true).notNull(),
	...timestamps,
});

// Add indexes
// Add constraints
// Add composite indexes for transactions after adding transactions table
export const transaction_models = pgTable("transaction_models", {
	id: uuid("id").primaryKey(),
	ref_id: varchar("ref_id", { length: 64 }).notNull().unique(),
	alt_id: varchar("alt_id", { length: 64 }).unique(),
	name: varchar("name", { length: 255 }).notNull(),
	active: boolean("active").default(true).notNull(),
	...timestamps,
});

// Add indexes
// Add constraints
// Add composite indexes for units after adding units table
export const unit_models = pgTable("unit_models", {
	id: uuid("id").primaryKey(),
	ref_id: varchar("ref_id", { length: 64 }).notNull().unique(),
	alt_id: varchar("alt_id", { length: 64 }).unique(),
	name: varchar("name", { length: 255 }).notNull(),
	active: boolean("active").default(true).notNull(),
	base_unit_id: uuid("base_unit_id").unique(),
	...timestamps,
});
