import { dbConfig } from "./src/config.ts";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/database/schema.ts",
	out: "./src/database/migrations",
	migrations: {
		table: "migrations",
		schema: "public",
	},
	dbCredentials: {
		url: dbConfig.url,
		ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
	}
});