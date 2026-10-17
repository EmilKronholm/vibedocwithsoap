/** The class on every element that holds a document: on the page, while measuring, and in print. */
export const DOC_CLASS = "folio-doc";

/**
 * What the browser would otherwise decide for a document: its default margins
 * and sizes, pinned so the screen and the print agree. Wrapped in `:where` so
 * it has no weight: whatever the document's own CSS says wins.
 */
export const BASELINE_CSS = `
:where(.${DOC_CLASS}) {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #111;
  font-weight: 400;
  font-style: normal;
  letter-spacing: normal;
  word-spacing: normal;
  text-align: start;
  text-indent: 0;
  text-transform: none;
  tab-size: 4;
  overflow-wrap: anywhere;
}
:where(.${DOC_CLASS}) :where(*, *::before, *::after) {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  border: 0 solid;
}
:where(.${DOC_CLASS}) :where(h1, h2, h3, h4, h5, h6) { font-size: inherit; font-weight: inherit; }
:where(.${DOC_CLASS}) :where(a) { color: inherit; text-decoration: inherit; }
:where(.${DOC_CLASS}) :where(b, strong) { font-weight: bolder; }
:where(.${DOC_CLASS}) :where(small) { font-size: 80%; }
:where(.${DOC_CLASS}) :where(code, kbd, samp, pre) { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 1em; }
:where(.${DOC_CLASS}) :where(hr) { height: 0; border-top-width: 1px; }
:where(.${DOC_CLASS}) :where(table) { border-collapse: collapse; }
:where(.${DOC_CLASS}) :where(img, svg) { display: block; max-width: 100%; height: auto; }
:where(.${DOC_CLASS}) :where(ul) { list-style: disc outside; padding-left: 1.4em; }
:where(.${DOC_CLASS}) :where(ol) { list-style: decimal outside; padding-left: 1.4em; }
`;
