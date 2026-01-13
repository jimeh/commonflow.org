import { getCollection } from "astro:content";
import * as semver from "semver";
import { config } from "../config";

export interface VersionInfo {
  versions: string[];
  currentVersion: string;
}

/**
 * Get version information derived from available spec files.
 * Returns all versions sorted newest-first and determines the current version.
 */
export async function getVersionInfo(): Promise<VersionInfo> {
  const specs = await getCollection("spec");
  const versions = specs
    .map((s) => s.data.version)
    .filter((v): v is string => semver.valid(v) !== null)
    .sort((a, b) => semver.rcompare(a, b)); // newest first

  const currentVersion =
    config.currentVersionOverride ?? determineCurrentVersion(versions);

  return { versions, currentVersion };
}

/**
 * Determine the current version based on priority:
 * 1. Latest stable version
 * 2. Latest RC version
 * 3. Newest available version
 */
function determineCurrentVersion(versions: string[]): string {
  // Priority order: stable (null prerelease) first, then rc
  const priority: (string | null)[] = [null, "rc"];

  for (const type of priority) {
    const match = versions.find((v) => {
      const pre = semver.prerelease(v);
      if (type === null) return pre === null;
      return pre?.[0] === type;
    });
    if (match) return match;
  }

  // Fallback to newest overall
  return versions[0] ?? "";
}
