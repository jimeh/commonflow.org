/**
 * Fetches spec documents and diagrams from the common-flow GitHub repo
 * and writes them to the appropriate locations for Astro to consume.
 *
 * Versions are discovered from git tags and filtered based on config.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as semver from "semver";
import { optimize as optimizeSvg, type Config as SvgoConfig } from "svgo";
import { config } from "../src/config";

const updateConfig = {
  bodyTemplate: `---
title: {{title}}
version: {{version}}
---
{{content}}`,
  outputDir: "src/content/spec",
};

// SVGO config: use removeDimensions to convert width/height to viewBox
// for responsive scaling while preserving aspect ratio
const svgoConfig: SvgoConfig = {
  plugins: ["preset-default", "removeDimensions"],
};

/**
 * Fetch all tags from the GitHub repository.
 */
function fetchTags(repository: string): string[] {
  const repoUrl = `https://github.com/${repository}.git`;
  console.log(`Fetching tags from ${repoUrl}...`);

  try {
    const result = execSync(`git ls-remote --tags ${repoUrl}`, {
      encoding: "utf-8",
    });

    return result
      .split("\n")
      .filter(Boolean)
      .map((line: string) => line.match(/refs\/tags\/(.+)$/)?.[1])
      .filter(
        (tag: string | undefined): tag is string =>
          tag !== undefined && !tag.endsWith("^{}"),
      );
  } catch (error) {
    throw new Error(
      `Failed to fetch tags: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Get the prerelease type of a version (e.g., "rc", "draft", or null for
 * stable).
 */
function getPrereleaseType(version: string): string | null {
  const prerelease = semver.prerelease(version);
  if (!prerelease) return null;
  return String(prerelease[0]);
}

/**
 * Filter tags based on discovery configuration.
 * Stable versions are always included; prereleases only if their type is in
 * the includePrereleaseTypes list.
 */
function filterVersions(tags: string[]): string[] {
  const { includePrereleaseTypes, excludeVersions } = config.update.discovery;

  return tags.filter((tag) => {
    // Must be valid semver
    if (!semver.valid(tag)) return false;

    // Check explicit exclusions
    if (excludeVersions.includes(tag)) return false;

    // Stable versions are always included
    const prereleaseType = getPrereleaseType(tag);
    if (prereleaseType === null) return true;

    // Prereleases only if their type is in the list
    return includePrereleaseTypes.includes(prereleaseType);
  });
}

function buildFileUrl(
  fileType: "document" | "diagram",
  version: string,
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

/**
 * Remove spec files for versions not in the provided list.
 * Files for versions in the list are left alone (they'll be overwritten).
 */
function removeStaleSpecs(versionsToKeep: string[]): void {
  const keepSet = new Set(versionsToKeep);
  let removedAny = false;

  if (!fs.existsSync(updateConfig.outputDir)) return;

  const files = fs.readdirSync(updateConfig.outputDir);
  for (const file of files) {
    // Extract version from filename (e.g., "1.0.0-rc.1.md" -> "1.0.0-rc.1")
    const version = path.basename(file, path.extname(file));
    if (!keepSet.has(version)) {
      if (!removedAny) {
        console.log("\nRemoving stale spec files:");
        removedAny = true;
      }
      const filePath = path.join(updateConfig.outputDir, file);
      fs.unlinkSync(filePath);
      console.log(`   ${filePath}`);
    }
  }

  if (!removedAny) {
    console.log("\nNo stale spec files to remove.");
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

  // Replace {{version}} placeholder with v-prefixed version
  document = document.replaceAll("{{version}}", `v${version}`);

  // Handle setext-style H1 heading (title with === underline)
  const lines = document.split("\n");
  if (lines.length >= 2 && /^=+$/.test(lines[1])) {
    // Adjust the underline length to match the title
    lines[1] = "=".repeat(lines[0].length);
    document = lines.join("\n");
  }

  // Extract title from first line (after version replacement)
  const title = lines[0];

  // Build body with frontmatter
  const body = updateConfig.bodyTemplate
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
  // 1. Discover and filter versions
  const tags = fetchTags(config.update.repository);
  console.log(`Found ${tags.length} tags`);

  const filtered = filterVersions(tags);
  const sorted = semver.rsort([...filtered]);

  console.log(`\nIncluded ${sorted.length} versions after filtering:`);
  console.log(`   ${sorted.join(", ")}`);

  if (sorted.length === 0) {
    console.error("\nNo versions to process. Exiting.");
    process.exit(1);
  }

  // 2. Remove spec files for versions no longer in the list
  removeStaleSpecs(sorted);

  // 3. Fetch specs for all versions
  console.log("\nFetching spec documents:");

  for (const version of sorted) {
    try {
      const spec = await fetchSpec(version);

      // Write markdown file to content collection
      const mdPath = path.join(updateConfig.outputDir, `${version}.md`);
      writeFile(mdPath, spec.body);

      // Write SVG diagram next to markdown (with metadata stripped)
      if (spec.diagram) {
        const svgPath = path.join(updateConfig.outputDir, `${version}.svg`);
        const optimizedSvg = optimizeSvg(spec.diagram, svgoConfig).data;
        writeFile(svgPath, optimizedSvg);
      }
    } catch (error) {
      console.error(`Error processing version ${version}:`, error);
    }
  }

  console.log("\nDone! Run `npm run build` to rebuild the site.");
}

main();
