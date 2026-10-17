const STYLE_ID = "folio-ui-styles";

/** How a revision under review looks on the page. */
const REVIEW_CSS = `
[data-folio-change] { cursor: default; }
ins[data-folio-change] { text-decoration: none; background: rgba(34, 197, 94, 0.22); border-radius: 2px; }
del[data-folio-change] { text-decoration: line-through; text-decoration-color: rgba(185, 28, 28, 0.7); background: rgba(239, 68, 68, 0.14); color: inherit; border-radius: 2px; }
ins[data-folio-rejected] { display: none; }
del[data-folio-rejected] { text-decoration: none; background: none; }

[data-folio-kind="added"] { background: rgba(34, 197, 94, 0.09); box-shadow: -8px 0 0 -5px #16a34a; }
[data-folio-kind="added"][data-folio-rejected] { opacity: 0.35; text-decoration: line-through; box-shadow: -8px 0 0 -5px #94a3b8; }
[data-folio-kind="removed"] { background: rgba(239, 68, 68, 0.06); box-shadow: -8px 0 0 -5px #dc2626; text-decoration: line-through; text-decoration-color: rgba(185, 28, 28, 0.7); opacity: 0.6; }
[data-folio-kind="removed"][data-folio-rejected] { text-decoration: none; opacity: 1; box-shadow: -8px 0 0 -5px #64748b; }
[data-folio-kind="moved"] { box-shadow: -8px 0 0 -5px #2563eb; }
[data-folio-kind="moved"][data-folio-rejected] { opacity: 0.35; }
[data-folio-kind="restyled"] { box-shadow: -8px 0 0 -5px #9333ea; }
[data-folio-kind="restyled"][data-folio-rejected] { box-shadow: -8px 0 0 -5px #94a3b8; }
`;

/** Puts the library's own CSS in the page once. The document's text is styled by the document; this is only the markers. */
export function installUiStyles(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = REVIEW_CSS;
  doc.head.append(style);
}
