import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		deno(),
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
			routesDirectory: "./client/routes",
			generatedRouteTree: "routeTree.gen.ts",
			addExtensions: true,
		}),
		react(),
	],
	root: "client",
	base: "/app",
	server: {
		proxy: {
			"/api": "http://localhost:8888",
		},
	},
	build: {
		assetsDir: "assets",
		outDir: "../dist/client",
		emptyOutDir: true,
	},
});
