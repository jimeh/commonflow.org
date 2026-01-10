import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const spec = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/spec",
    // Use filename (without extension) as ID to preserve version strings
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: z.object({
    title: z.string(),
    version: z.string(),
  }),
});

export const collections = { spec };
