/**
 * Fetches spec documents and diagrams from the common-flow GitHub repo
 * and writes them to the appropriate locations for Astro to consume.
 *
 * Equivalent to the Jekyll Rakefile's `rake update` task.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const config = {
  currentVersion: "1.0.0-rc.5",
  versions: [
    "1.0.0-rc.5",
    "1.0.0-rc.4",
    "1.0.0-rc.3",
    "1.0.0-rc.2",
    "1.0.0-rc.1",
  ],
  update: {
    urlTemplate:
      "https://github.com/jimeh/common-flow/raw/{{version}}/{{file}}",
    bodyTemplate: `---
title: {{title}}
version: {{version}}
---
{{content}}`,
    imgTemplate:
      '<img src="/spec/{{file}}" alt="{{title}} diagram" width="100%" />',
    outputDir: "src/content/spec",
    publicDir: "public/spec",
    files: {
      document: "common-flow.md",
      diagram: "common-flow.svg",
    },
  },
};

function buildFileUrl(
  fileType: "document" | "diagram",
  version: string
): string {
  const file = config.update.files[fileType];
  return config.update.urlTemplate
    .replace("{{version}}", version)
    .replace("{{file}}", file);
}

async function fetchFile(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }
    return await response.text();
  } catch {
    return null;
  }
}

function writeFile(filePath: string, content: string, comment = ""): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
  console.log(` - ${filePath}${comment}`);
}

function removeAllSpecs(): void {
  console.log("\nRemoving existing spec files:");

  for (const dir of [config.update.outputDir, config.update.publicDir]) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        fs.unlinkSync(filePath);
        console.log(`   ${filePath}`);
      }
    }
  }
}

interface Spec {
  version: string;
  title: string;
  body: string;
  diagram: string | null;
}

async function fetchSpec(version: string): Promise<Spec> {
  const documentUrl = buildFileUrl("document", version);
  const diagramUrl = buildFileUrl("diagram", version);

  let document = await fetchFile(documentUrl);
  const diagram = await fetchFile(diagramUrl);

  if (!document) {
    throw new Error(`Failed to fetch document for version ${version}`);
  }

  // Replace {{version}} placeholder throughout the document
  document = document.replaceAll("{{version}}", version);

  // Extract title from first line (after version replacement)
  const title = document.split("\n", 1)[0];

  // If diagram exists, inject image tag after the title
  if (diagram) {
    const imgTag = config.update.imgTemplate
      .replace("{{file}}", `${version}.svg`)
      .replace("{{title}}", title);
    document = document.replace(/^(.*\n=+\n)/, `$1\n${imgTag}\n`);
  }

  // Build body with frontmatter
  const body = config.update.bodyTemplate
    .replace("{{content}}", document)
    .replace("{{title}}", title)
    .replace("{{version}}", version);

  return {
    version,
    title,
    body,
    diagram,
  };
}

async function main(): Promise<void> {
  removeAllSpecs();

  console.log("\nFetching configured spec versions:");

  for (const version of config.versions) {
    try {
      const spec = await fetchSpec(version);

      // Write markdown file to content collection
      const mdPath = path.join(config.update.outputDir, `${version}.md`);
      writeFile(mdPath, spec.body);

      // Write SVG diagram to public directory
      if (spec.diagram) {
        const svgPath = path.join(config.update.publicDir, `${version}.svg`);
        writeFile(svgPath, spec.diagram);
      }
    } catch (error) {
      console.error(`Error processing version ${version}:`, error);
    }
  }

  console.log("\nDone! Run `npm run build` to rebuild the site.");
}

main();
