import { pageGeometry, safeColor, type PageSetup } from "../../model";
import { DOC_CLASS } from "../../rendering/baseline-css";

export const SHEET_CLASS = "folio-sheet";

/**
 * One sheet of paper per page. The sheet has the paper's size, colour and
 * margins; the document's content sits inside it and may overflow it if it
 * could not be made to fit.
 */
export function buildSheets(doc: Document, pages: readonly HTMLElement[], page: PageSetup): HTMLElement[] {
  const g = pageGeometry(page);
  const { top, right, bottom, left } = g.margin;

  return pages.map((source) => {
    const sheet = doc.createElement("div");
    sheet.className = SHEET_CLASS;
    sheet.style.cssText = `width:${g.width}px;height:${g.height}px;padding:${top}px ${right}px ${bottom}px ${left}px;background:${safeColor(page.background)};`;

    const content = doc.createElement("div");
    content.className = `${DOC_CLASS} folio-sheet-content`;
    content.append(...Array.from(source.childNodes));
    sheet.append(content);
    return sheet;
  });
}
