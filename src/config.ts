type DbConfig = {
	url: string;
	ssl: boolean;
	max: number;
};

type CacheConfig = {
	url: string;
}

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
		url: Deno.env.get("KL_VALKEY_URL") || "redis://localhost:6379",
	},
	database: {
		url: Deno.env.get("KL_POSTGRES_URL") || "postgres://localhost:5432/kitledger",
		ssl: Deno.env.get("KL_POSTGRES_SSL") === "true",
		max: parseInt(Deno.env.get("KL_POSTGRES_MAX_CONNECTIONS") || "10"),
	},
	server: {
		port: parseInt(Deno.env.get("KL_SERVER_PORT") || "8888"),
	},
};


// __ SECURITY CONFIG __
const authModes = ['token'] as const;
type AuthConfig = {
	secret: string;
	pastSecrets: string[];
	authMode: typeof authModes[number];
}

const authSecret = Deno.env.get("KL_AUTH_SECRET");

if (!authSecret) {
	throw new Error("KL_AUTH_SECRET environment variable is not set.");
}

const pastSecretsString = Deno.env.get("KL_AUTH_PAST_SECRETS");
const pastSecrets =pastSecretsString ?pastSecretsString.split(",") : [];

const authMode = Deno.env.get("KL_AUTH_MODE") ?? 'token';

if (authMode && !authModes.includes(authMode as typeof authModes[number])) {
	throw new Error(`KL_AUTH_MODE must be one of ${authModes.join(", ")}.`);
}

export const authConfig: AuthConfig = {
	secret: authSecret,
	pastSecrets: pastSecrets,
	authMode: authMode as typeof authModes[number],
}