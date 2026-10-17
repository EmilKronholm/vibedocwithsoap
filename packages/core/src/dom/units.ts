import { EMPTY_TEXT_TAGS, REPLACED_TAGS, SKIPPED_TAGS, SVG_NS } from "./tags";

// A line break is not a style, so a text element may contain them.
const onlyBreaks = (el: Element) => Array.from(el.children).every((c) => c.tagName.toUpperCase() === "BR");

export function isSkipped(el: Element): boolean {
  return SKIPPED_TAGS.has(el.tagName.toUpperCase());
}

/** An element whose only content is text and line breaks: one style, nothing nested. */
export function isTextUnit(el: Element): boolean {
  if (isSkipped(el) || el.namespaceURI === SVG_NS) return false;
  const tag = el.tagName.toUpperCase();
  if (REPLACED_TAGS.has(tag) || tag === "BR" || tag === "WBR") return false;
  if (!onlyBreaks(el)) return false;
  return Boolean((el.textContent ?? "").trim()) || EMPTY_TEXT_TAGS.has(tag);
}

/**
 * The units under `root` in document order, outermost first: text elements
 * and standalone images. It stops descending at a unit, so units never nest.
 */
export function collectUnits(root: ParentNode): Element[] {
  const out: Element[] = [];
  const visit = (el: Element) => {
    if (isSkipped(el)) return;
    if (REPLACED_TAGS.has(el.tagName.toUpperCase()) || isTextUnit(el)) {
      out.push(el);
      return;
    }
    Array.from(el.children).forEach(visit);
  };
  Array.from(root.children).forEach(visit);
  return out;
}

/** The `data-block` id of the nearest block containing `el`. */
export function blockIdOf(el: Element): string | undefined {
  return el.closest("[data-block]")?.getAttribute("data-block") ?? undefined;
}
