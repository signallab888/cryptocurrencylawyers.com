import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import clerk from "@clerk/astro";

// Only wire up Clerk when keys are present (avoids noisy client-side errors in dev)
const clerkEnabled = !!process.env.PUBLIC_CLERK_PUBLISHABLE_KEY;

export default defineConfig({
  site: "https://www.cryptocurrencylawyers.com",
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [...(clerkEnabled ? [clerk()] : []), react(), sitemap()],
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
