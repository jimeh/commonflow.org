import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://commonflow.org",
  outDir: "./docs",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
