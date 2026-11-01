import { pathOfStamped, type ElementPath } from "../dom";

/** A word that is wider than the space it has: its column or box is too narrow for it. */
export interface WordOverflow {
  /** The element holding the word. */
  path: ElementPath;
  word: string;
}

/** What overflow detection needs to know about the laid-out document. The browser supplies it; tests supply a fake. */
export interface OverflowReader {
  /** The right edge of the space the text of `el` may fill, in pixels. */
  limit(el: Element): number;
  /** The right edge of the characters `start` to `end` of `node`, in pixels. */
  right(node: Text, start: number, end: number): number;
  /** Whether the characters `start` to `end` of `node` sit on more than one line: a word the browser had to break. */
  broken(node: Text, start: number, end: number): boolean;
}

// Sub-pixel layout rounds, so a word that exactly fits must not count as too wide.
const TOLERANCE = 1;
const MAX_FOUND = 20;
const WORD = /\S+/g;

/**
 * The words that do not fit their box: reaching past its edge, or broken
 * across lines because the browser had no other way. A column that is too
 * narrow shows up as one of these; this finds them, so the host can tell the
 * person.
 */
export function findOverflows(root: Element, reader: OverflowReader): WordOverflow[] {
  const found: WordOverflow[] = [];
  const seen = new Set<string>();
  const walker = root.ownerDocument.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);

  for (let node = walker.nextNode() as Text | null; node && found.length < MAX_FOUND; node = walker.nextNode() as Text | null) {
    const el = node.parentElement;
    if (!el || el.closest("style, script")) continue;
    const path = nearestPath(el);
    if (!path) continue;
    const limit = reader.limit(el);

    for (const match of node.data.matchAll(WORD)) {
      const end = match.index + match[0].length;
      if (reader.right(node, match.index, end) <= limit + TOLERANCE && !reader.broken(node, match.index, end)) continue;
      const key = `${path.join(".")}|${match[0]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({ path, word: match[0] });
      if (found.length >= MAX_FOUND) break;
    }
  }
  return found;
}

function nearestPath(el: Element): ElementPath | null {
  for (let current: Element | null = el; current; current = current.parentElement) {
    const path = pathOfStamped(current);
    if (path) return path;
  }
  return null;
}

/** Reads positions from a document that is attached to the page and laid out by the browser. */
export function domOverflowReader(): OverflowReader {
  const style = (el: Element) => el.ownerDocument.defaultView!.getComputedStyle(el);
  const blockOf = (el: Element): Element => {
    let current = el;
    while (current.parentElement && style(current).display.startsWith("inline")) current = current.parentElement;
    return current;
  };

  return {
    broken(node, start, end) {
      const range = node.ownerDocument.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);
      const tops = new Set(Array.from(range.getClientRects()).filter((r) => r.width > 0).map((r) => Math.round(r.top)));
      return tops.size > 1;
    },
    limit(el) {
      const block = blockOf(el);
      const s = style(block);
      return block.getBoundingClientRect().right - (parseFloat(s.paddingRight) || 0) - (parseFloat(s.borderRightWidth) || 0);
    },
    right(node, start, end) {
      const range = node.ownerDocument.createRange();
      range.setStart(node, start);
      range.setEnd(node, end);
      return range.getBoundingClientRect().right;
    },
  };
}
