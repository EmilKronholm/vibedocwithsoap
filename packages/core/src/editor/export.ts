import { parseHtml } from "../dom";
import type { DocumentState } from "../model";
import { browserPaginator, buildPrintableHtml, printHtml } from "../rendering";

/** A title for the document: its first heading, or a plain default. */
export function documentTitle(html: string): string {
  const heading = parseHtml(html).querySelector("h1, h2, h3");
  return heading?.textContent?.trim() || "Document";
}

/**
 * The document laid out on exact pages as a standalone HTML document. The
 * same pages as on screen, built from the state, never from the editing page.
 * Post it to a renderer (headless Chrome) for a real PDF file.
 */
export async function printableHtml(state: DocumentState, doc: Document = document): Promise<string> {
  const pages = await browserPaginator(doc)(state.html, state.page);
  return buildPrintableHtml(pages, state.page, { title: documentTitle(state.html) });
}

/** Opens the print dialog on the paged document, where "Save as PDF" makes the file. Needs no server. */
export async function printDocument(state: DocumentState, doc: Document = document): Promise<void> {
  await printHtml(await printableHtml(state, doc), doc);
}
