/**
 * Parses rendered spec HTML into structured sections for the single-page
 * layout.
 */

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface SpecSection {
  id: string;
  title: string;
  content: string;
}

export interface ParsedSpec {
  svgPath: string;
  introduction: string;
  summary: string;
  terminology: string;
  specification: string;
  specSections: SpecSection[];
  faq: FAQItem[];
  about: string;
  license: string;
  tocItems: TocItem[];
}

/**
 * Convert a heading text to a URL-friendly ID
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

/**
 * Extract content between two headings or to the end of the document
 */
function extractSection(
  html: string,
  startHeading: string,
  endHeadings: string[] = []
): string {
  // Find the heading (h2) - use partial match to handle additional text
  // e.g., "Git Common-Flow Specification (Common-Flow)"
  const headingPattern = new RegExp(
    `<h2[^>]*>[^<]*${escapeRegex(startHeading)}[^<]*</h2>`,
    "i"
  );
  const match = html.match(headingPattern);
  if (!match || match.index === undefined) return "";

  const startIdx = match.index + match[0].length;

  // Find the next section heading
  let endIdx = html.length;
  for (const endHeading of endHeadings) {
    const endPattern = new RegExp(
      `<h2[^>]*>\\s*${escapeRegex(endHeading)}\\s*</h2>`,
      "i"
    );
    const endMatch = html.slice(startIdx).match(endPattern);
    if (endMatch && endMatch.index !== undefined) {
      const possibleEnd = startIdx + endMatch.index;
      if (possibleEnd < endIdx) {
        endIdx = possibleEnd;
      }
    }
  }

  // Also check for any h2 as a fallback
  const anyH2 = html.slice(startIdx).match(/<h2[^>]*>/i);
  if (anyH2 && anyH2.index !== undefined) {
    const possibleEnd = startIdx + anyH2.index;
    if (possibleEnd < endIdx) {
      endIdx = possibleEnd;
    }
  }

  return html.slice(startIdx, endIdx).trim();
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Extract the numbered spec sections (1. TL;DR, 2. The Master Branch, etc.)
 */
function extractSpecSections(specContent: string): SpecSection[] {
  const sections: SpecSection[] = [];

  // The spec uses an ordered list with nested items
  // Each top-level li starts a new section
  const olMatch = specContent.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
  if (!olMatch) return sections;

  // Split by top-level list items
  // We need to handle nested lists carefully
  const sectionTitles = [
    "TL;DR",
    "The Master Branch",
    "Change Branches",
    "Pull Requests",
    "Versioning",
    "Releases",
    "Short-Term Release Branches",
    "Long-term Release Branches",
    "Bug Fixes & Rollback",
    "Git Best Practices",
  ];

  // Find each section by looking for the title pattern
  for (let i = 0; i < sectionTitles.length; i++) {
    const title = sectionTitles[i];
    const id = slugify(title);

    // For the content, we'll just use the title for navigation
    // The actual content stays in the main specification block
    sections.push({
      id: `spec-${id}`,
      title,
      content: "", // Content handled inline
    });
  }

  return sections;
}

/**
 * Extract FAQ items from the FAQ section HTML
 */
function extractFAQItems(faqContent: string): FAQItem[] {
  const items: FAQItem[] = [];

  // Split by h3 headings
  const h3Pattern = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  let lastIndex = 0;
  let lastQuestion = "";
  let lastId = "";

  const matches = [...faqContent.matchAll(h3Pattern)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const question = match[1].replace(/<[^>]+>/g, "").trim();
    const id = slugify(question).slice(0, 50);

    if (i > 0 && match.index !== undefined) {
      // Get content between previous h3 and this one
      const answer = faqContent.slice(lastIndex, match.index).trim();
      items.push({
        id: `faq-${lastId}`,
        question: lastQuestion,
        answer,
      });
    }

    lastQuestion = question;
    lastId = id;
    lastIndex = match.index! + match[0].length;
  }

  // Don't forget the last FAQ item
  if (lastQuestion) {
    const answer = faqContent.slice(lastIndex).trim();
    items.push({
      id: `faq-${lastId}`,
      question: lastQuestion,
      answer,
    });
  }

  return items;
}

/**
 * Build table of contents from parsed sections
 */
function buildTocItems(parsed: Partial<ParsedSpec>): TocItem[] {
  const items: TocItem[] = [];

  // Main sections
  if (parsed.introduction) {
    items.push({ id: "introduction", title: "Introduction", level: 2 });
  }
  if (parsed.summary) {
    items.push({ id: "summary", title: "Summary", level: 2 });
  }
  if (parsed.terminology) {
    items.push({ id: "terminology", title: "Terminology", level: 2 });
  }
  if (parsed.specification) {
    items.push({ id: "specification", title: "Specification", level: 2 });

    // Add spec subsections
    if (parsed.specSections) {
      for (const section of parsed.specSections) {
        items.push({ id: section.id, title: section.title, level: 3 });
      }
    }
  }

  return items;
}

/**
 * Main parsing function - takes rendered HTML and returns structured content
 */
export function parseSpecContent(html: string, version: string): ParsedSpec {
  const svgPath = `/spec/${version}.svg`;

  // Remove the title (h1) and SVG from the content for parsing
  let content = html;

  // Remove the h1 title
  content = content.replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "");

  // Remove the SVG img tag
  content = content.replace(/<img[^>]*\.svg[^>]*>/i, "");

  // Extract each section
  const introduction = extractSection(content, "Introduction", [
    "Summary",
    "Terminology",
    "Git Common-Flow",
    "FAQ",
    "About",
    "License",
  ]);

  const summary = extractSection(content, "Summary", [
    "Terminology",
    "Git Common-Flow",
    "FAQ",
    "About",
    "License",
  ]);

  const terminology = extractSection(content, "Terminology", [
    "Git Common-Flow",
    "FAQ",
    "About",
    "License",
  ]);

  const specification = extractSection(
    content,
    "Git Common-Flow Specification",
    ["FAQ", "About", "License"]
  );

  const faqContent = extractSection(content, "FAQ", ["About", "License"]);

  const about = extractSection(content, "About", ["License"]);

  const license = extractSection(content, "License", []);

  // Parse subsections
  const specSections = extractSpecSections(specification);
  const faq = extractFAQItems(faqContent);

  const parsed: ParsedSpec = {
    svgPath,
    introduction,
    summary,
    terminology,
    specification,
    specSections,
    faq,
    about,
    license,
    tocItems: [],
  };

  // Build TOC
  parsed.tocItems = buildTocItems(parsed);

  return parsed;
}
