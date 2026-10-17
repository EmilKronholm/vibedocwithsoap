import { parseHtml, stampPaths } from "../dom";
import { pageGeometry, type PageSetup } from "../model";
import { DOC_CLASS } from "./baseline-css";
import { domBoxReader } from "./box-reader";
import { paginate } from "./paginate";

/** Turns a document into pages for a page setup. */
export type Paginator = (html: string, page: PageSetup) => Promise<HTMLElement[]>;

// Fonts and images change heights once they load, so measuring waits for them, but not for long.
const SETTLE_MS = 4000;

/**
 * A paginator that lays the document out in a hidden element on the page and
 * measures it. This is where the browser's layout engine comes in: where a
 * line wraps decides where a page ends.
 */
export function browserPaginator(doc: Document = document): Paginator {
  return async (html, page) => {
    const geometry = pageGeometry(page);
    const probe = createProbe(doc, geometry.contentWidth, html);
    doc.body.append(probe);
    try {
      await settle(doc, probe);
      return paginate(probe, geometry.contentHeight, domBoxReader(probe));
    } finally {
      probe.remove();
    }
  };
}

function createProbe(doc: Document, width: number, html: string): HTMLElement {
  const probe = doc.createElement("div");
  probe.className = DOC_CLASS;
  // Out of sight but laid out: it has to be rendered to be measured.
  probe.style.cssText = `position:fixed;left:-100000px;top:0;width:${width}px;visibility:hidden;pointer-events:none;`;

  const parsed = parseHtml(html, doc);
  stampPaths(parsed);
  probe.append(...Array.from(parsed.childNodes));
  return probe;
}

async function settle(doc: Document, probe: HTMLElement): Promise<void> {
  const waits: Array<Promise<unknown>> = [doc.fonts?.ready ?? Promise.resolve()];
  for (const img of Array.from(probe.querySelectorAll("img")).filter((i) => !i.complete)) {
    waits.push(new Promise((resolve) => (img.addEventListener("load", resolve, { once: true }), img.addEventListener("error", resolve, { once: true }))));
  }
  await Promise.race([Promise.all(waits), new Promise((resolve) => setTimeout(resolve, SETTLE_MS))]);
}
