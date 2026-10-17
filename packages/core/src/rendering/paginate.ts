import type { BoxReader } from "./box-reader";
import { findBreaks } from "./breaks";
import { splitIntoPages } from "./split";

/**
 * Splits a laid-out document into pages: one detached tree each, always at
 * least one. The same document measured the same way always gives the same
 * pages. `contentHeight` is the room for content on one page, in pixels.
 */
export function paginate(source: Element, contentHeight: number, reader: BoxReader): HTMLElement[] {
  return splitIntoPages(source, findBreaks(source, contentHeight, reader));
}
