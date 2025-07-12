type DbConfig = {
	url: string;
	ssl: boolean;
	max: number;
};

type ServerConfig = {
	port: number;
};

type AppConfig = {
	database: DbConfig;
	server: ServerConfig;
};

const config: AppConfig = {
	database: {
		url: Deno.env.get("KL_POSTGRES_URL") || "postgres://localhost:5432/kitledger",
		ssl: Deno.env.get("KL_POSTGRES_SSL") === "true",
		max: parseInt(Deno.env.get("KL_POSTGRES_MAX_CONNECTIONS") || "10"),
	},
	server: {
		port: parseInt(Deno.env.get("KL_SERVER_PORT") || "8888"),
	},
};

export default config;
