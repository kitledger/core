import { dbConfig } from "./server/config.ts";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "postgresql",
	schema: "./server/services/database/schema.ts",
	out: "./migrations",
	migrations: {
		table: "migrations",
		schema: "public",
	},
	dbCredentials: {
		url: dbConfig.url,
		ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
	},
});
