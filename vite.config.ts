import { defineConfig } from 'vite'
import deno from '@deno/vite-plugin'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [deno(), react()],
  root: 'src/client',
  build: {
	assetsDir: "assets",
	outDir: '../../dist/client',
	emptyOutDir: true,
  }
});