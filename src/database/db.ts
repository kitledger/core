import { drizzle } from 'drizzle-orm/postgres-js';
import config from "../config.ts";
import { defineConfig } from "drizzle-kit";

const db = drizzle({
	connection: config.database,
});