import { kvConfig } from "../config.ts";

let kv_store: Deno.Kv | null = null;

/**
 * Initialize the key-value store.
 * This can be a local file path or a remote URL.
 * If the path is a local file, it will create the directory if it does not exist, otherwise it will warn the directory already exists.
 * If the path is a remote URL, it will connect to the remote key-value store.
 */
try {
	/**
	 * Handle local file path for the key-value store.
	 */
	if (!kvConfig.path.startsWith("http")) {
		await Deno.mkdir(kvConfig.path, { recursive: true });
		kv_store = await Deno.openKv(`${kvConfig.path}/${kvConfig.local_db_name}`);
	}

	/**
	 * Handle remote URL for the key-value store.
	 */
	else {
		kv_store = await Deno.openKv(kvConfig.path);
	}
}

catch {
	console.error("Unable to create KV directory");
	throw new Error("Failed to initialize key-value store. Please check the configuration.");
}

/**
 * Export the key-value store instance.
 * This can be used to perform operations on the key-value store.
 */
export const kv = kv_store;