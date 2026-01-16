import type { APIRoute } from "astro";
import { getVersionInfo } from "../utils/versions";

export const GET: APIRoute = async () => {
  const { currentVersion } = await getVersionInfo();

  const content = `# Common-Flow

> A Git workflow specification combining GitHub Flow with versioned releases.

Common-Flow is a sensible git workflow based on GitHub Flow, with the addition
of versioned releases, optional release branches, and without the requirement
to deploy to production all the time.

## Docs

- [Git Common-Flow Specification](/spec/git-common-flow-v${currentVersion}.md): The complete Git Common-Flow v${currentVersion} specification in Markdown format
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
