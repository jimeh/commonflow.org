/**
 * Parses spec content using markdown AST for robust section extraction.
 */

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { getIconData, iconToSVG, iconToHTML } from "@iconify/utils";
import heroicons from "@iconify-json/heroicons/icons.json";
import type { Root, RootContent, Heading, List, ListItem, Html } from "mdast";
import type { Root as HastRoot } from "hast";

export interface TocItem {
  id: string;
  title: string;
  level: number;
  clause?: string;
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
  clause: string;
}

export interface ParsedSpec {
  introduction: string;
  summary: string;
  terminology: string;
  terminologyTitle: string;
  specification: string;
  specificationTitle: string;
  specSections: SpecSection[];
  faq: FAQItem[];
  license: string;
  tocItems: TocItem[];
}

/**
 * Convert text to a URL-friendly ID
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

/**
 * Generate link icon SVG from heroicons icon set
 */
function generateLinkIconSvg(): string {
  const iconData = getIconData(heroicons, "link");
  if (!iconData) {
    return "";
  }
  const result = iconToSVG(iconData);
  return iconToHTML(result.body, {
    ...result.attributes,
    class: "clause-link-icon",
    stroke: "currentColor",
    "stroke-width": "2",
  });
}

type MdastNode = Root | RootContent;

/**
 * Extract plain text from an mdast node tree
 */
function extractText(node: MdastNode): string {
  if ("value" in node && typeof node.value === "string") {
    return node.value;
  }
  if ("children" in node && Array.isArray(node.children)) {
    return node.children.map((child) => extractText(child)).join("");
  }
  return "";
}

/**
 * Find index of heading containing specific text
 */
function findHeadingIndex(
  nodes: RootContent[],
  text: string,
  depth: number = 2,
): number {
  return nodes.findIndex(
    (node) =>
      node.type === "heading" &&
      (node as Heading).depth === depth &&
      extractText(node).toLowerCase().includes(text.toLowerCase()),
  );
}

/**
 * Extract nodes between two headings
 */
function extractSectionNodes(
  nodes: RootContent[],
  startText: string,
  depth: number = 2,
): RootContent[] {
  const startIdx = findHeadingIndex(nodes, startText, depth);
  if (startIdx === -1) return [];

  // Find the next heading of same or higher level
  let endIdx = nodes.length;
  for (let i = startIdx + 1; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.type === "heading" && (node as Heading).depth <= depth) {
      endIdx = i;
      break;
    }
  }

  // Return nodes after the heading (not including the heading itself)
  return nodes.slice(startIdx + 1, endIdx);
}

/**
 * Get the full heading text
 */
function getHeadingText(
  nodes: RootContent[],
  text: string,
  depth: number = 2,
): string {
  const idx = findHeadingIndex(nodes, text, depth);
  if (idx === -1) return text;
  return extractText(nodes[idx]);
}

/**
 * Convert mdast nodes to HTML string
 */
async function nodesToHtml(nodes: RootContent[]): Promise<string> {
  if (nodes.length === 0) return "";

  // Create a root node with these children
  const root: Root = { type: "root", children: nodes };

  const result = await unified()
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .run(root);

  const html = unified()
    .use(rehypeStringify, { allowDangerousHtml: true })
    .stringify(result as HastRoot);

  return html;
}

/**
 * Extract top-level list item titles from an ordered list
 */
function extractListItemTitles(list: List): string[] {
  const titles: string[] = [];

  for (const item of list.children) {
    if (item.type !== "listItem") continue;

    // Get the first paragraph or text content of the list item
    // The title is the text before any nested list
    let title = "";
    for (const child of item.children) {
      if (child.type === "list") break; // Stop at nested list
      if (child.type === "paragraph") {
        title = extractText(child);
        break;
      }
      // Handle inline text directly in list item
      title += extractText(child);
    }

    title = title.split("\n")[0].trim();
    if (title) {
      titles.push(title);
    }
  }

  return titles;
}

/**
 * Find the first ordered list in nodes and extract its structure
 */
function findSpecSections(nodes: RootContent[]): SpecSection[] {
  const sections: SpecSection[] = [];

  for (const node of nodes) {
    if (node.type === "list" && (node as List).ordered) {
      const titles = extractListItemTitles(node as List);
      for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        const clauseNum = i + 1;
        sections.push({
          id: `clause-${clauseNum}`,
          title,
          content: "",
          clause: `${clauseNum}.`,
        });
      }
      break; // Only process first ordered list
    }
  }

  return sections;
}

/**
 * Add anchor IDs and links to ordered list items recursively.
 * Injects an invisible anchor link before content for hover-to-reveal behavior.
 */
function addClauseAnchors(list: List, prefix: string = ""): void {
  for (let i = 0; i < list.children.length; i++) {
    const item = list.children[i];
    if (item.type !== "listItem") continue;

    // Calculate clause number and ID
    const clauseNum = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
    const clauseId = `clause-${clauseNum.replace(/\./g, "-")}`;

    // Add ID to the list item via hProperties
    (item as ListItem & { data?: { hProperties?: { id?: string } } }).data = {
      hProperties: { id: clauseId },
    };

    // Find the first paragraph in the item and prepend an anchor link
    for (const child of item.children) {
      if (child.type === "paragraph") {
        // Create anchor link HTML with clause number text and link icon
        const linkIcon = generateLinkIconSvg();
        const anchorHtml: Html = {
          type: "html",
          value: `<a href="#${clauseId}" class="clause-link" aria-hidden="true">${linkIcon}${clauseNum}.</a>`,
        };
        // Prepend anchor to paragraph children
        (child as { children: RootContent[] }).children.unshift(
          anchorHtml as unknown as RootContent,
        );
        break;
      }
    }

    // Recursively process nested ordered lists
    for (const child of item.children) {
      if (child.type === "list" && (child as List).ordered) {
        addClauseAnchors(child as List, clauseNum);
      }
    }
  }
}

/**
 * Extract FAQ items from FAQ section nodes
 */
function extractFAQFromNodes(nodes: RootContent[]): FAQItem[] {
  const items: FAQItem[] = [];
  let currentQuestion = "";
  let currentId = "";

  for (const node of nodes) {
    if (node.type === "heading" && (node as Heading).depth === 3) {
      // Save previous FAQ item if we had one
      if (currentQuestion) {
        items.push({
          id: currentId,
          question: currentQuestion,
          answer: "", // Placeholder, will be filled later
        });
      }

      currentQuestion = extractText(node);
      currentId = `faq-${slugify(currentQuestion).slice(0, 50)}`;
    }
  }

  // Don't forget the last item
  if (currentQuestion) {
    items.push({
      id: currentId,
      question: currentQuestion,
      answer: "",
    });
  }

  return items;
}

/**
 * Build table of contents from parsed sections
 */
function buildTocItems(parsed: Partial<ParsedSpec>): TocItem[] {
  const items: TocItem[] = [];

  if (parsed.terminology) {
    items.push({
      id: "terminology",
      title: parsed.terminologyTitle || "Terminology",
      level: 2,
    });
  }
  if (parsed.specification) {
    items.push({
      id: "specification",
      title: "Specification",
      level: 2,
    });

    if (parsed.specSections) {
      for (const section of parsed.specSections) {
        items.push({
          id: section.id,
          title: section.title,
          level: 3,
          clause: section.clause,
        });
      }
    }
  }

  return items;
}

/**
 * Main parsing function - takes markdown content and returns structured content
 */
export async function parseSpecContent(
  markdown: string,
): Promise<ParsedSpec> {
  // Parse markdown to AST
  const tree = unified().use(remarkParse).parse(markdown) as Root;

  // Remove title (h1) from the tree - it's displayed separately in the Hero
  const nodes = tree.children.filter((node) => {
    if (node.type === "heading" && (node as Heading).depth === 1) return false;
    return true;
  });

  // Get heading titles
  const terminologyTitle = getHeadingText(nodes, "Terminology");
  const specificationTitle = getHeadingText(
    nodes,
    "Git Common-Flow Specification",
  );

  // Extract section nodes
  const introNodes = extractSectionNodes(nodes, "Introduction");
  const summaryNodes = extractSectionNodes(nodes, "Summary");
  const terminologyNodes = extractSectionNodes(nodes, "Terminology");
  const specNodes = extractSectionNodes(nodes, "Git Common-Flow Specification");
  const faqNodes = extractSectionNodes(nodes, "FAQ");
  const licenseNodes = extractSectionNodes(nodes, "License");

  // Extract spec sections from the first ordered list
  const specSections = findSpecSections(specNodes);

  // Add anchor IDs and links to spec list items
  for (const node of specNodes) {
    if (node.type === "list" && (node as List).ordered) {
      addClauseAnchors(node as List);
      break;
    }
  }

  // Extract FAQ items structure
  const faqItems = extractFAQFromNodes(faqNodes);

  // Collect FAQ answer nodes for each item
  const faqAnswerNodes: RootContent[][] = [];
  let currentAnswerNodes: RootContent[] = [];

  for (const node of faqNodes) {
    if (node.type === "heading" && (node as Heading).depth === 3) {
      if (currentAnswerNodes.length > 0) {
        faqAnswerNodes.push(currentAnswerNodes);
      }
      currentAnswerNodes = [];
    } else {
      currentAnswerNodes.push(node);
    }
  }
  // Don't forget the last answer
  if (currentAnswerNodes.length > 0) {
    faqAnswerNodes.push(currentAnswerNodes);
  }

  // Convert sections to HTML
  const [introduction, summary, terminology, specification, license] =
    await Promise.all([
      nodesToHtml(introNodes),
      nodesToHtml(summaryNodes),
      nodesToHtml(terminologyNodes),
      nodesToHtml(specNodes),
      nodesToHtml(licenseNodes),
    ]);

  // Convert FAQ answers to HTML
  const faqAnswers = await Promise.all(
    faqAnswerNodes.map((nodes) => nodesToHtml(nodes)),
  );

  // Assign FAQ answers
  const faq = faqItems.map((item, i) => ({
    ...item,
    answer: faqAnswers[i] || "",
  }));

  const parsed: ParsedSpec = {
    introduction,
    summary,
    terminology,
    terminologyTitle,
    specification,
    specificationTitle,
    specSections,
    faq,
    license,
    tocItems: [],
  };

  parsed.tocItems = buildTocItems(parsed);

  return parsed;
}
