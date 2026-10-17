/**
 * What pagination needs to know about the laid-out document. The browser
 * supplies it; tests supply a fake. Positions are in pixels from the top of
 * the document.
 */
export interface BoxReader {
  top(el: Element): number;
  bottom(el: Element): number;
  /** Positioned out of the flow (absolute or fixed): it does not push anything down, so it never causes a break. */
  outOfFlow(el: Element): boolean;
  /** Laid out side by side (a table row, a flex or grid container): splitting it across pages would tear it apart. */
  isRow(el: Element): boolean;
}

/** Reads positions from a document that is attached to the page and laid out by the browser. */
export function domBoxReader(root: Element): BoxReader {
  const origin = () => root.getBoundingClientRect().top;
  const display = (el: Element) => el.ownerDocument.defaultView?.getComputedStyle(el).display ?? "";

  return {
    top: (el) => el.getBoundingClientRect().top - origin(),
    bottom: (el) => el.getBoundingClientRect().bottom - origin(),
    outOfFlow: (el) => /^(absolute|fixed)$/.test(el.ownerDocument.defaultView?.getComputedStyle(el).position ?? ""),
    isRow: (el) => /flex|grid|table-row/.test(display(el)),
  };
}
