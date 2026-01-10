export const config = {
  title: "Git Common-Flow",
  description:
    "An attempt to gather a sensible selection of the most common usage " +
    "patterns of git into a single and concise specification.",
  author: "Jim Myhrberg",
  authorUrl: "https://jimeh.me/",
  hostname: "commonflow.org",
  url: "https://commonflow.org",
  repoUrl: "https://github.com/jimeh/common-flow",
  license: {
    name: "CC BY 4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
  },

  // Optional override for current version (null = auto-detect from specs)
  currentVersionOverride: null as string | null,

  // Used by update script
  update: {
    repository: "jimeh/common-flow",
    urlTemplate:
      "https://github.com/jimeh/common-flow/raw/{{version}}/{{file}}",
    files: {
      document: "common-flow.md",
      diagram: "common-flow.svg",
    },
    // Version discovery settings
    discovery: {
      // Prerelease types to include (stable versions are always included)
      includePrereleaseTypes: ["rc"] as string[],
      // Explicit versions to exclude
      excludeVersions: [] as string[],
    },
  },
} as const;

export type Config = typeof config;
