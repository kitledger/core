type DbConfig = {
	url: string,
	ssl: boolean,
	max: number,
}

type AppConfig = {
	database: DbConfig,
};

const config: AppConfig = {
	database: {
		url: Deno.env.get('KL_POSTGRES_URL') || 'postgres://localhost:5432/kitledger',
		ssl: Deno.env.get('KL_POSTGRES_SSL') === 'true',
		max: parseInt(Deno.env.get('KL_POSTGRES_MAX') || '10'),
	},
}

export default config;