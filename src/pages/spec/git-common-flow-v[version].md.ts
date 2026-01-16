import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import * as fs from "node:fs";
import * as path from "node:path";

export const getStaticPaths: GetStaticPaths = async () => {
  const specs = await getCollection("spec");
  return specs.map((spec) => ({
    params: { version: spec.data.version },
  }));
};

export const GET: APIRoute = ({ params }) => {
  const version = params.version;
  const filePath = path.join(
    process.cwd(),
    "src/content/spec",
    `${version}.md`
  );
  const content = fs.readFileSync(filePath, "utf-8");
  const markdown = content.replace(/^---[\s\S]*?---\n/, "");
  const filename = `git-common-flow-v${version}.md`;

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  });
};
