/**
 * Highlights clause elements when navigating to them via anchor links.
 * Works on both initial page load with hash and when clicking anchor links.
 */

const HIGHLIGHT_DURATION = 2000;
const HIGHLIGHT_CLASS = "clause-highlight";

/**
 * Highlight a clause element briefly
 */
function highlightClause(element: Element): void {
  // Remove any existing highlight
  element.classList.remove(HIGHLIGHT_CLASS);

  // Force reflow to restart animation if needed
  void (element as HTMLElement).offsetWidth;

  // Add highlight class
  element.classList.add(HIGHLIGHT_CLASS);

  // Remove after animation completes
  setTimeout(() => {
    element.classList.remove(HIGHLIGHT_CLASS);
  }, HIGHLIGHT_DURATION);
}

/**
 * Handle hash change and highlight target clause
 */
function handleHashChange(): void {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith("#clause-")) return;

  const targetId = hash.slice(1);
  const element = document.getElementById(targetId);
  if (element) {
    // Small delay to let scroll complete
    setTimeout(() => highlightClause(element), 100);
  }
}

/**
 * Initialize clause highlight behavior
 */
export function initClauseHighlight(): void {
  // Handle clicks on clause links
  document.addEventListener("click", (e) => {
    const link = (e.target as Element).closest('a[href^="#clause-"]');
    if (!link) return;

    const href = link.getAttribute("href");
    if (!href) return;

    const targetId = href.slice(1);
    const element = document.getElementById(targetId);
    if (element) {
      // Small delay to let scroll complete
      setTimeout(() => highlightClause(element), 100);
    }
  });

  // Handle hash changes (back/forward navigation)
  window.addEventListener("hashchange", handleHashChange);

  // Handle initial page load with hash
  if (window.location.hash?.startsWith("#clause-")) {
    // Wait for page to be fully ready
    if (document.readyState === "complete") {
      handleHashChange();
    } else {
      window.addEventListener("load", handleHashChange);
    }
  }
}
