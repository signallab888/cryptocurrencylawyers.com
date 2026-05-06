import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://www.cryptocurrencylawyers.com",
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { "@": "/src" },
    },
    server: {
      allowedHosts: true,
    },
  },
  build: {
    outDir: "./dist/public",
  },
});
