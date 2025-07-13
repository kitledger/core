import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { appConfig } from "../config.ts";
import { join } from "@std/path/join";

export const db = drizzle({
	connection: appConfig.database,
});

const migrationsPath = join(String(import.meta.dirname), "./migrations");
console.info(`Migrations path: ${migrationsPath}`);

export async function runMigrations() {
	await migrate(db, {
		migrationsFolder: migrationsPath,
		migrationsTable: "migrations",
		migrationsSchema: "public",
	});
}
