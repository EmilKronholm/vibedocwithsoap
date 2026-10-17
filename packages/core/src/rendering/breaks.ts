import type { BoxReader } from "./box-reader";
import { flowChildren, isSplittable } from "./flow";

// Layout rounds to fractions of a pixel; this keeps content that fits exactly from being pushed to the next page.
const TOLERANCE = 0.5;

/**
 * The elements that start a new page, in document order. Content that does
 * not fit is moved whole to the next page, or, when it can be cut, cut
 * between its children. What cannot be moved or cut simply overflows.
 */
export function findBreaks(root: Element, contentHeight: number, reader: BoxReader): Element[] {
  return new BreakFinder(contentHeight, reader).run(root);
}

class BreakFinder {
  readonly #breaks: Element[] = [];
  #pageStart = 0;

  constructor(
    private readonly contentHeight: number,
    private readonly reader: BoxReader,
  ) {}

  run(root: Element): Element[] {
    this.#visit(root);
    return this.#breaks;
  }

  #visit(parent: Element): void {
    for (const child of flowChildren(parent, this.reader)) this.#place(child);
  }

  #place(el: Element): void {
    if (this.#fits(el)) return;
    const cuttable = isSplittable(el, this.reader, this.contentHeight);

    // Starts on this page but runs over it: cut it between its children.
    if (cuttable && this.#startsOnPage(el)) {
      this.#visit(el);
      return;
    }
    this.#breakBefore(el);
    // Taller than a whole page: cut it too, so it does not overflow as one piece.
    if (cuttable && !this.#fits(el)) this.#visit(el);
  }

  #fits(el: Element): boolean {
    return this.reader.bottom(el) - this.#pageStart <= this.contentHeight + TOLERANCE;
  }

  #startsOnPage(el: Element): boolean {
    return this.reader.top(el) - this.#pageStart < this.contentHeight;
  }

  #breakBefore(el: Element): void {
    // Already at the top of a page: breaking here would leave an empty page, so let it overflow.
    if (this.reader.top(el) - this.#pageStart <= TOLERANCE) return;
    this.#breaks.push(el);
    this.#pageStart = this.reader.top(el);
  }
}
