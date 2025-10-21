import { join } from "@std/path/join";


/**
 * 1. Copy static assets
 */
const STATIC_DIR = join(String(import.meta.dirname), "./src/client/assets");
const DIST_DIR = join(String(import.meta.dirname), "./dist/client/assets");

/**
 * Clear out existing dist/client
 */
const CLIENT_DIR = join(String(import.meta.dirname), "./dist/client");
try {
	await Deno.remove(CLIENT_DIR, { recursive: true });
} catch (error) {
	if (error instanceof Deno.errors.NotFound) {
		// Directory doesn't exist, no action needed
	} else {
		console.error("Error removing existing client directory:", error);
		Deno.exit(1);
	}
}

/**
 * Recursively copy a directory and its contents
 */
async function copyDir(fromDir: string, toDir: string) {
	await Deno.mkdir(toDir, { recursive: true });

	for await (const entry of Deno.readDir(fromDir)) {
		const fromPath = join(fromDir, entry.name);
		const toPath = join(toDir, entry.name);

		if (entry.isFile) {
			await Deno.copyFile(fromPath, toPath);
		} else if (entry.isDirectory) {
			await copyDir(fromPath, toPath);
		}
	}
}

/**
 * Copy static assets from the shared static directory to the dist directory.
 */
async function copyStatic() {
	try {
		await copyDir(STATIC_DIR, DIST_DIR);
		console.log("✓ Static assets copied successfully");
	} catch (error) {
		console.error("Error copying static files:", error);
		Deno.exit(1);
	}
}

await copyStatic();