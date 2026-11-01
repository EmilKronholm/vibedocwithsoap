import { BASELINE_CSS } from "../../rendering/baseline-css";

const STYLE_ID = "vibedoc-ui-styles";

/** Paper on the page: the sheet, and the room between sheets (`--vibedoc-page-gap`). */
const SHEET_CSS = `
.vibedoc-sheet { position: relative; box-sizing: border-box; margin: 0 auto var(--vibedoc-page-gap, 24px); box-shadow: var(--vibedoc-sheet-shadow, 0 1px 4px rgba(0, 0, 0, 0.15)); }
.vibedoc-sheet-content { position: relative; height: 100%; }
[data-vibedoc-unit]:empty { min-height: 1lh; }
`;

/** How a revision under review looks on the page. */
const REVIEW_CSS = `
[data-vibedoc-change] { cursor: default; }
ins[data-vibedoc-change] { text-decoration: none; background: rgba(34, 197, 94, 0.22); border-radius: 2px; }
del[data-vibedoc-change] { text-decoration: line-through; text-decoration-color: rgba(185, 28, 28, 0.7); background: rgba(239, 68, 68, 0.14); color: inherit; border-radius: 2px; }
ins[data-vibedoc-rejected] { display: none; }
del[data-vibedoc-rejected] { text-decoration: none; background: none; }

[data-vibedoc-kind="added"] { background: rgba(34, 197, 94, 0.09); box-shadow: -8px 0 0 -5px #16a34a; }
[data-vibedoc-kind="added"][data-vibedoc-rejected] { opacity: 0.35; text-decoration: line-through; box-shadow: -8px 0 0 -5px #94a3b8; }
[data-vibedoc-kind="removed"] { background: rgba(239, 68, 68, 0.06); box-shadow: -8px 0 0 -5px #dc2626; text-decoration: line-through; text-decoration-color: rgba(185, 28, 28, 0.7); opacity: 0.6; }
[data-vibedoc-kind="removed"][data-vibedoc-rejected] { text-decoration: none; opacity: 1; box-shadow: -8px 0 0 -5px #64748b; }
[data-vibedoc-kind="moved"] { box-shadow: -8px 0 0 -5px #2563eb; }
[data-vibedoc-kind="moved"][data-vibedoc-rejected] { opacity: 0.35; }
[data-vibedoc-kind="restyled"] { box-shadow: -8px 0 0 -5px #9333ea; }
[data-vibedoc-kind="restyled"][data-vibedoc-rejected] { box-shadow: -8px 0 0 -5px #94a3b8; }
`;

/**
 * Puts the library's own CSS in the page once: the baseline a document starts
 * from, the sheets, and the review markers. The document's text is styled by
 * the document itself.
 */
export function installUiStyles(doc: Document): void {
  const css = BASELINE_CSS + SHEET_CSS + REVIEW_CSS;
  const existing = doc.getElementById(STYLE_ID);
  // A page that outlives a reload of this module (hot reload, a newer library) must not keep the old CSS.
  if (existing) {
    if (existing.textContent !== css) existing.textContent = css;
    return;
  }
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = css;
  doc.head.append(style);
}
