import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./helpers.ts";

export const users = pgTable("users", {
	id: uuid("id").primaryKey(),
	first_name: text("first_name").notNull(),
	last_name: text("last_name").notNull(),
	email: text("email").notNull().unique(),
	password: text("password").notNull(),
	...timestamps,
});