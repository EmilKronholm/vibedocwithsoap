import { REPLACED_TAGS, isSkipped, isTextUnit } from "../dom";
import type { BoxReader } from "./box-reader";

/** The children that take part in the flow: not style elements, not positioned out of it. */
export function flowChildren(parent: Element, reader: BoxReader): Element[] {
  return Array.from(parent.children).filter((child) => !isSkipped(child) && !reader.outOfFlow(child));
}

/** A block marked `data-block` that holds no other block: the smallest piece the document says belongs together. */
const isInnermostBlock = (el: Element) => el.hasAttribute("data-block") && !el.querySelector("[data-block]");

/**
 * Whether an element may be cut between its children to fit pages. Text,
 * images, rows laid out side by side, and blocks that fit on one page are
 * kept whole. A block taller than a page has to be cut or it would overflow.
 */
export function isSplittable(el: Element, reader: BoxReader, contentHeight: number): boolean {
  if (REPLACED_TAGS.has(el.tagName.toUpperCase()) || isTextUnit(el) || reader.isRow(el)) return false;
  if (flowChildren(el, reader).length === 0) return false;
  const keepTogether = isInnermostBlock(el) && reader.bottom(el) - reader.top(el) <= contentHeight;
  return !keepTogether;
}
