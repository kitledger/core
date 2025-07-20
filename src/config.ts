import { config } from "dotenv";
import { AlgorithmTypes } from "hono/utils/jwt/jwa";

config();

/*******
 * 1) Define the types
 */

type AuthConfig = {
	secret: string;
	pastSecrets: string[];
	algorithm: AlgorithmTypes;
};

type CacheConfig = {
	url: string;
};

type CorsConfig = {
	origin: string;
	methods: string[];
	allowedHeaders: string[];
	exposedHeaders: string[];
	credentials: boolean;
	maxAge: number;
};

type DbConfig = {
	url: string;
	ssl: boolean;
	max: number;
};

type ServerConfig = {
	port: number;
	cors: CorsConfig;
};

/*******
 * 2) Define the logic for complex values.
 */

const authAlgorithm = "HS256" as AlgorithmTypes;

const authSecret = process.env.KL_AUTH_SECRET;
if (!authSecret) {
	throw new Error("KL_AUTH_SECRET environment variable is not set.");
}
const pastSecretsString = process.env.KL_AUTH_PAST_SECRETS;
const pastSecrets = pastSecretsString ? pastSecretsString.split(",") : [];

/*******
 * 3) Export the configuration objects.
 */

export const authConfig: AuthConfig = {
	secret: authSecret,
	pastSecrets: pastSecrets,
	algorithm: authAlgorithm,
};

export const cacheConfig: CacheConfig = {
	url: process.env.KL_VALKEY_URL || "redis://localhost:6379",
};

export const dbConfig: DbConfig = {
	url: process.env.KL_POSTGRES_URL || "postgres://localhost:5432/kitledger",
	ssl: process.env.KL_POSTGRES_SSL === "true",
	max: parseInt(process.env.KL_POSTGRES_MAX_CONNECTIONS || "10"),
};

export const serverConfig: ServerConfig = {
	port: process.env.KL_SERVER_PORT ? parseInt(process.env.KL_SERVER_PORT) : 8888,
	// __ CORS CONFIG __ : TODO - OPTIMIZE
	cors: {
		origin: process.env.KL_CORS_ORIGIN || "*",
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		exposedHeaders: ["Content-Length", "X-Kitledger-RateLimit"],
		credentials: true,
		maxAge: 86400, // 24 hours
	},
};
