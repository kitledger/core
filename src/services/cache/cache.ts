import { cacheConfig } from "../../config.ts";
import { GlideClient, type GlideString, type SetOptions, TimeUnit } from "@valkey/valkey-glide";
import { Buffer } from "node:buffer";

const client = await GlideClient.createClient({
	addresses: cacheConfig.addresses,
	requestTimeout: 500,
});

class CacheClient {
	constructor(client: GlideClient) {
		this.client = client;
	}

	public client: GlideClient;
	public id: string = crypto.randomUUID();

	private parseValue(raw_value: Buffer | GlideString): string | number | null {
		const value = raw_value.toString();

		if (!value || value.length < 1) return null;

		// Try to parse as number
		const num = Number(value);
		if (!isNaN(num)) {
			return num;
		}

		// Return as string if not a number
		return value;
	}

	/**
	 * @param key key to get from the cache
	 */
	async getString(key: string, new_ttl?: number): Promise<string | null> {
		let options: { expiry: "persist" | { type: TimeUnit; duration: number } } = { expiry: "persist" };

		if (new_ttl && new_ttl > 0) {
			options = {
				expiry: {
					type: TimeUnit.Seconds,
					duration: new_ttl,
				},
			};
		}

		const value = await this.client.getex(key, options);

		return value ? value.toString() : null;
	}

	/**
	 * @param key key to set in the cache
	 * @param value string value to set
	 * @param ttl number of seconds to live for the key
	 */
	async setString(key: string, value: string, ttl?: number): Promise<boolean> {
		const options: SetOptions = {};

		if (ttl) {
			options.expiry = {
				type: TimeUnit.Seconds,
				count: ttl,
			};
		}

		const result = await this.client.set(key, value, options);

		return result?.toString() === "OK";
	}

	async getObject<T>(key: string): Promise<T | null> {
		const hashArray = await this.client.hgetall(key);
		if (hashArray.length > 0) {
			const valueObject: Record<string, string | number | null> = {};

			hashArray.map((property) => {
				valueObject[property.field.toString()] = this.parseValue(property.value);
			});

			return valueObject as T;
		}
		else {
			return null;
		}
	}

	async setObject(key: string, value: Record<string, string | number | null>): Promise<void> {
		const hashArray = Object.entries(value).map(([field, val]) => ({
			field: field,
			value: val !== null && val !== undefined ? String(val) : "",
		}));

		if (hashArray.length > 0) {
			await this.client.hset(key, hashArray);
		}
	}
}

export const cache = new CacheClient(client);
