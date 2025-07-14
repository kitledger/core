import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { appConfig } from "../config.ts";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const db = drizzle({
	connection: appConfig.database,
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsPath = join(__dirname, "./migrations");

export async function runMigrations() {
	await migrate(db, {
		migrationsFolder: migrationsPath,
		migrationsTable: "migrations",
		migrationsSchema: "public",
	});
}
