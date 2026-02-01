import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

export default defineConfig({
  site: "https://commonflow.org",
  outDir: "./dist",
  integrations: [sitemap(), icon()],
  vite: {
    plugins: [tailwindcss()],
  },
  experimental: {
    fonts: [
      {
        provider: fontProviders.fontsource(),
        name: "Bricolage Grotesque",
        cssVariable: "--font-bricolage",
        weights: ["200 800"],
        fallbacks: ["system-ui", "sans-serif"],
      },
      {
        provider: fontProviders.fontsource(),
        name: "DM Sans",
        cssVariable: "--font-dm-sans",
        weights: ["100 1000"],
        fallbacks: ["system-ui", "sans-serif"],
      },
      {
        provider: fontProviders.fontsource(),
        name: "JetBrains Mono",
        cssVariable: "--font-jetbrains",
        weights: ["100 800"],
        fallbacks: ["SF Mono", "Consolas", "monospace"],
      },
    ],
  },
});
