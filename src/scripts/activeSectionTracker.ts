export interface ActiveSectionTrackerOptions {
  linkSelector: string;
  sectionIdAttr?: string;
  headerOffset?: number;
  defaultToFirst?: boolean;
}

export function initActiveSectionTracker(
  options: ActiveSectionTrackerOptions,
): void {
  const {
    linkSelector,
    sectionIdAttr = "data-section-id",
    headerOffset = 100,
    defaultToFirst = true,
  } = options;

  const links = document.querySelectorAll(linkSelector);
  const sections: { id: string; element: Element }[] = [];

  // Collect unique section IDs
  const seenIds = new Set<string>();
  links.forEach((link) => {
    const id = link.getAttribute(sectionIdAttr);
    if (id && !seenIds.has(id)) {
      seenIds.add(id);
      const section = document.getElementById(id);
      if (section) {
        sections.push({ id, element: section });
      }
    }
  });

  function updateActiveSection(): void {
    let activeId: string | null = defaultToFirst ? sections[0]?.id : null;

    for (const { id, element } of sections) {
      const rect = element.getBoundingClientRect();
      if (rect.top <= headerOffset) {
        activeId = id;
      }
    }

    links.forEach((link) => {
      const linkId = link.getAttribute(sectionIdAttr);
      link.classList.toggle("active", linkId === activeId);
    });
  }

  // Update on scroll with throttling
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveSection();
        ticking = false;
      });
      ticking = true;
    }
  });

  // Initial update
  updateActiveSection();
}
