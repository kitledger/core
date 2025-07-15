import { config } from "dotenv";
import { AlgorithmTypes } from "hono/utils/jwt/jwa";

config();

type DbConfig = {
	url: string;
	ssl: boolean;
	max: number;
};

type CacheConfig = {
	url: string;
};

type ServerConfig = {
	port: number;
};

type AppConfig = {
	cache: CacheConfig;
	database: DbConfig;
	server: ServerConfig;
};

export const appConfig: AppConfig = {
	cache: {
		url: process.env.KL_VALKEY_URL || "redis://localhost:6379",
	},
	database: {
		url: process.env.KL_POSTGRES_URL || "postgres://localhost:5432/kitledger",
		ssl: process.env.KL_POSTGRES_SSL === "true",
		max: parseInt(process.env.KL_POSTGRES_MAX_CONNECTIONS || "10"),
	},
	server: {
		port: process.env.KL_SERVER_PORT ? parseInt(process.env.KL_SERVER_PORT) : 8888,
	},
};

// FOR NOW, WE'RE USING HS256 AS THE DEFAULT AND ONLY ALGORITHM.
const authAlgorithm = "HS256" as AlgorithmTypes;

// __ SECURITY CONFIG __
type AuthConfig = {
	secret: string;
	pastSecrets: string[];
	algorithm: AlgorithmTypes;
};

const authSecret = process.env.KL_AUTH_SECRET;

if (!authSecret) {
	throw new Error("KL_AUTH_SECRET environment variable is not set.");
}

const pastSecretsString = process.env.KL_AUTH_PAST_SECRETS;
const pastSecrets = pastSecretsString ? pastSecretsString.split(",") : [];

export const authConfig: AuthConfig = {
	secret: authSecret,
	pastSecrets: pastSecrets,
	algorithm: authAlgorithm,
};
