import { pgTable, text, uuid, varchar, boolean } from "drizzle-orm/pg-core";
import { timestamps } from "./helpers.ts";

export enum BalanceType {
	DEBIT = "debit",
	CREDIT = "credit",
}

export const users = pgTable("users", {
	id: uuid("id").primaryKey(),
	first_name: text("first_name").notNull(),
	last_name: text("last_name").notNull(),
	email: text("email").notNull().unique(),
	password_hash: text("password_hash").notNull(),
	...timestamps,
});

export const entity_models = pgTable("entity_models", {
	id: uuid("id").primaryKey(),
	ref_id: varchar("ref_id", { length: 64 }).notNull().unique(),
	alt_id: varchar("alt_id", { length: 64 }).unique(),
	name: varchar("name", { length: 255 }).notNull(),
	active: boolean("active").default(true).notNull(),
	...timestamps
});

export const transaction_models = pgTable("transaction_models", {
	id: uuid("id").primaryKey(),
	ref_id: varchar("ref_id", { length: 64 }).notNull().unique(),
	alt_id: varchar("alt_id", { length: 64 }).unique(),
	name: varchar("name", { length: 255 }).notNull(),
	active: boolean("active").default(true).notNull(),
	...timestamps
});

export const unit_models = pgTable("unit_models", {
	id: uuid("id").primaryKey(),
	ref_id: varchar("ref_id", { length: 64 }).notNull().unique(),
	alt_id: varchar("alt_id", { length: 64 }).unique(),
	name: varchar("name", { length: 255 }).notNull(),
	active: boolean("active").default(true).notNull(),
	base_unit_id: uuid("base_unit_id").unique(),
	...timestamps
});