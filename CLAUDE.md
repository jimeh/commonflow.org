# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is the source for commonflow.org, an Astro-based static site that documents
the Git Common-Flow specification. Common-Flow is a git workflow specification
that combines GitHub Flow with versioned releases.

## Build Commands

```bash
# Install tooling (node) via mise
mise install

# Install dependencies
npm install

# Development server
npm run dev

# Build site (outputs to dist/ directory)
npm run build

# Preview built site
npm run preview

# Type checking
npm run check

# Linting
npm run lint

# Formatting
npm run format
npm run format:check

# Update specs from upstream (fetches from github.com/jimeh/common-flow)
npm run update-specs
```

The site is built to `dist/` and deployed to Cloudflare Workers.

## Architecture

- **Astro 5.x** static site generator
- **Tailwind CSS 4.x** for styling with dark mode support
- **astro-icon** with Heroicons and Simple Icons for icons
- **Content Collections** for spec markdown files
- **TypeScript** throughout
- **Node.js** as JavaScript runtime (managed via mise)

### Key Files

- `src/config.ts` - Site configuration (metadata, update settings)
- `src/content.config.ts` - Astro content collection definition
- `src/styles/global.css` - Global Tailwind styles
- `src/layouts/BaseLayout.astro` - Base layout with head, meta tags, theme scripts
- `src/layouts/SpecLayout.astro` - Spec page layout composing all sections
- `src/components/` - UI components:
  - `Header.astro` - Site header with navigation
  - `Footer.astro` - Site footer
  - `Hero.astro` - Landing page hero section
  - `AboutSection.astro` - About Common-Flow section
  - `FAQSection.astro` - FAQ section
  - `SectionHeader.astro` - Reusable section header (title + subtitle)
  - `SpecSection.astro` - Spec section with terminology and specification
  - `SpecSidebar.astro` - Spec page table of contents sidebar
  - `TocLink.astro` - Reusable TOC link component
  - `ThemeToggle.astro` - Dark/light mode toggle
  - `VersionSelector.astro` - Spec version dropdown
- `src/scripts/` - Client-side TypeScript:
  - `activeSectionTracker.ts` - Scroll-based active section tracking
  - `clauseHighlight.ts` - Clause highlight on anchor navigation
- `src/pages/index.astro` - Landing page
- `src/pages/404.astro` - 404 error page
- `src/pages/spec/[version].astro` - Dynamic route for spec versions
- `src/pages/spec/[version]/raw.astro` - Raw markdown spec page
- `src/utils/` - Utility functions:
  - `parseSpecContent.ts` - Markdown parsing utilities
  - `versions.ts` - Version info helper (derives current version from specs)
- `src/content/spec/*.md` - Versioned spec documents
- `public/spec/*.svg` - SVG diagrams for each version
- `scripts/update-specs.ts` - Fetches specs from GitHub
- `wrangler.jsonc` - Cloudflare Workers deployment config

### Updating Spec Versions

1. Run `npm run update-specs` to fetch specs from GitHub
2. Run `npm run build` to rebuild the site
