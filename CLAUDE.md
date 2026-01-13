# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is the source for commonflow.org, an Astro-based static site that documents
the Git Common-Flow specification. Common-Flow is a git workflow specification
that combines GitHub Flow with versioned releases.

## Build Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build site (outputs to docs/ directory)
npm run build

# Preview built site
npm run preview

# Update specs from upstream (fetches from github.com/jimeh/common-flow)
npm run update
```

The site is built to `docs/` for GitHub Pages hosting.

## Architecture

- **Astro 5.x** static site generator
- **Tailwind CSS 4.x** for styling with dark mode support
- **Content Collections** for spec markdown files
- **TypeScript** throughout

### Key Files

- `src/config.ts` - Site configuration with version list
- `src/content.config.ts` - Astro content collection definition
- `src/layouts/Default.astro` - Main layout with sidebar
- `src/components/` - Sidebar, MenuToggle, ThemeToggle components
- `src/pages/spec/[version].astro` - Dynamic route for spec versions
- `src/content/spec/*.md` - Versioned spec documents
- `public/spec/*.svg` - SVG diagrams for each version
- `scripts/update-specs.ts` - Fetches specs from GitHub

### Updating Spec Versions

1. Add new version to `versions` array in `src/config.ts`
2. Update `currentVersion` if this is the new default
3. Run `npm run update` to fetch specs from GitHub
4. Run `npm run build` to rebuild the site
