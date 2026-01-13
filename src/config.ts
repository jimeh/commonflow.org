export const config = {
  title: "Git Common Flow",
  description:
    "An attempt to gather a sensible selection of the most common usage " +
    "patterns of git into a single and concise specification.",
  author: "Jim Myhrberg",
  hostname: "commonflow.org",
  url: "https://commonflow.org",
  repoUrl: "https://github.com/jimeh/common-flow",

  currentVersion: "1.0.0-rc.5",
  versions: [
    "1.0.0-rc.5",
    "1.0.0-rc.4",
    "1.0.0-rc.3",
    "1.0.0-rc.2",
    "1.0.0-rc.1",
  ],

  // Used by update script
  update: {
    urlTemplate:
      "https://github.com/jimeh/common-flow/raw/{{version}}/{{file}}",
    files: {
      document: "common-flow.md",
      diagram: "common-flow.svg",
    },
  },
} as const;

export type Config = typeof config;
