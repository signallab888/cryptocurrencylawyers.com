import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://www.cryptocurrencylawyers.com",
  output: "static",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: { "@": "/src" },
    },
  },
  build: {
    outDir: "./dist/public",
  },
});
