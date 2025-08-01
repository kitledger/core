import { AlgorithmTypes } from "@hono/hono/utils/jwt/jwa";

/*
 * 1) Define the types
 */

type AuthConfig = {
	secret: string;
	pastSecrets: string[];
	jwtAlgorithm: AlgorithmTypes;
};

type CorsConfig = {
	origin: string | string[];
	allowMethods?: string[];
	allowHeaders?: string[];
	maxAge?: number;
	credentials?: boolean;
	exposeHeaders?: string[];
};

type KvConfig = {
	path: string;
	local_db_name: string;
}

type ServerConfig = {
	port: number;
	cors: CorsConfig;
};

type SessionConfig = {
	ttl: number;
	maxLifetime: number;
};

type WorkerConfig = {
	poolSize: number;
	taskTimeout: number;
	maxQueueSize: number;
};

/*
 * 2) Define the logic for complex values.
 */

/**
 * Authentication secrets configuration values and defaults.
 */
const jwtAlgorithm = "HS256" as AlgorithmTypes;

const authSecret = Deno.env.get("KL_AUTH_SECRET");
if (!authSecret) {
	throw new Error("KL_AUTH_SECRET environment variable is not set.");
}
const pastSecretsString = Deno.env.get("KL_AUTH_PAST_SECRETS");
const pastSecrets = pastSecretsString ? pastSecretsString.split(",") : [];

/**
 * CORS configuration values and defaults.
 */
const corsDefaultHeaders = ["Content-Type", "Authorization", "X-Requested-With"];
const corsAllowedHeaders = [
	...new Set([...corsDefaultHeaders, ...(Deno.env.get("KL_CORS_ALLOWED_HEADERS")?.split(",") || [])]),
];
const corsAllowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
const corsAllowedOrigins = Deno.env.get("KL_CORS_ALLOWED_ORIGINS")
	? String(Deno.env.get("KL_CORS_ALLOWED_ORIGINS")).split(",")
	: "*";
const corsCredentials = false;
const corsExposeHeaders: string[] = [];
const corsMaxAge = parseInt(Deno.env.get("KL_CORS_MAX_AGE") || "86400");

/**
 * Session configuration values and defaults.
 * This is used to manage session lifetimes and time-to-live (TTL).
 */
const sessionTtl = parseInt(Deno.env.get("KL_SESSION_TTL") || "3600"); // 1 hour default
const sessionMaxLifetime = parseInt(Deno.env.get("KL_SESSION_MAX_LIFETIME") || "604800"); // Default to 1 week.

// Error out if session TTL is greater than max lifetime or if either is not set.
if (sessionTtl > sessionMaxLifetime || sessionTtl <= 0 || sessionMaxLifetime <= 0) {
	throw new Error(
		"KL_SESSION_MAX_LIFETIME value in seconds must be greater than KL_SESSION_TTL value in seconds, and both must be positive integers.",
	);
}

/**
 * Worker pool configuration values and defaults.
 */
const workerPoolSize = parseInt(Deno.env.get("KL_WORKER_POOL_SIZE") || String(navigator.hardwareConcurrency - 1)) || 1;
const workerTaskTimeout = parseInt(Deno.env.get("KL_WORKER_TASK_TIMEOUT") || "5000"); // Default to 5 seconds
const workerMaxQueueSize = Deno.env.get("KL_WORKER_MAX_QUEUE_SIZE") ? parseInt(String(Deno.env.get("KL_WORKER_MAX_QUEUE_SIZE"))) : Infinity;

/*
 * 3) Export the configuration objects.
 */

/**
 * Export pre-assembled configuration values for authentication.
 * Values are a mix of environment variables and defaults.
 */
export const authConfig: AuthConfig = {
	secret: authSecret,
	pastSecrets: pastSecrets,
	jwtAlgorithm: jwtAlgorithm,
};

/**
 * Export pre-assembled configuration values for the key-value store.
 * Values are a mix of environment variables and defaults.
 * Value can be a local path or a remote URL.
 */
export const kvConfig: KvConfig = {
	path: Deno.env.get("KL_KV_PATH") || "./data/kitledger.db",
	local_db_name: Deno.env.get("KL_KV_LOCAL_DB_NAME") || "kitledger.db",
}

/**
 * Export pre-assembled configuration values for the HTTP server.
 * Values are a mix of environment variables and defaults.
 */
export const serverConfig: ServerConfig = {
	port: Deno.env.get("KL_SERVER_PORT") ? parseInt(String(Deno.env.get("KL_SERVER_PORT"))) : 8888,
	cors: {
		origin: corsAllowedOrigins,
		allowMethods: corsAllowedMethods,
		allowHeaders: corsAllowedHeaders,
		exposeHeaders: corsExposeHeaders,
		credentials: corsCredentials,
		maxAge: corsMaxAge,
	},
};

/**
 * Export pre-assembled configuration values for session management.
 * Values are a mix of environment variables and defaults.
 */
export const sessionConfig: SessionConfig = {
	ttl: sessionTtl,
	maxLifetime: sessionMaxLifetime,
};

/**
 * Export pre-assembled configuration values for the worker pool.
 * Values are a mix of environment variables and defaults.
 */
export const workerConfig: WorkerConfig = {
	poolSize: workerPoolSize,
	taskTimeout: workerTaskTimeout,
	maxQueueSize: workerMaxQueueSize,
};
