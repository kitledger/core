import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		tailwindcss(),
	],
	root: "src/client",
	base: "/app",
	server: {
		proxy: {
			"/api": "http://localhost:8888",
		},
	},
	build: {
		assetsDir: "assets",
		outDir: "../../dist/client",
		emptyOutDir: true,
	},
});
