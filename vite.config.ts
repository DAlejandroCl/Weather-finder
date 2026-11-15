import { defineConfig } from "vitest/config";
import { loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from '@tailwindcss/vite'

/**
 * Serves /api/geocode and /api/weather while developing, with the same handlers that
 * Vercel runs in production. The key comes from OPENWEATHER_API_KEY in .env.local.
 */
function apiDevServer(): Plugin {
  return {
    name: "api-dev-server",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "");
      process.env.OPENWEATHER_API_KEY ??= env.OPENWEATHER_API_KEY;

      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path !== "/api/geocode" && path !== "/api/weather") return next();

        const handler = await server.ssrLoadModule(`${path}.ts`);
        await handler.default(req, res);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiDevServer()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
