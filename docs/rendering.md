# Rendering

## Pages

The document is cut into one DOM tree per page. The browser only measures; where pages break is decided in plain code (`rendering/breaks.ts`) that takes a `BoxReader`, so it can be tested with a fake measurer.

1. **Measure.** `browserPaginator` puts the document in a hidden element as wide as the paper's content area, waits for fonts and images (up to 4 seconds), and reads each element's position.
2. **Find the breaks.** Walking the document in order: what fits stays. What does not fit moves whole to the next page, or, if it can be cut, is cut between its children.
3. **Split.** `splitIntoPages` makes one copy of the tree per page and removes what belongs to other pages. Containers are copied across pages (a list cut in two is two lists), style elements are on every page, and every element keeps its `data-folio-path`.

The same document measured the same way always gives the same pages.

## What is kept together

- Text elements, images and rows laid out side by side (table rows, flex and grid containers) are never cut.
- A block marked `data-block` that holds no other block is moved whole if it fits on one page, and cut only if it is taller than a page.
- Elements positioned out of the flow (`absolute`, `fixed`) take no room and never cause a break.
- Content that cannot be moved or cut (one element taller than a page) overflows. It does not leave empty pages.

## Showing pages

`PagedRenderer` draws one sheet of paper per page: the paper's size, colour and margins, with the page's content inside. The document's own CSS applies in the page itself, so the page's CSS can reach it and the document's CSS can reach the page. (See `known-issues.md`.)

`FlowRenderer` is the alternative: one continuous flow, no pages.

The baseline CSS (`rendering/baseline-css.ts`) pins what the browser would otherwise decide for a document: default margins, sizes, list styles. It is wrapped in `:where(...)` so it has no weight and the document's own CSS always wins.

## Exporting

`editor.printableHtml()` builds a standalone HTML document from the **state**, not from the editing page: it measures and paginates again in a hidden element and lays the pages out one after another, each exactly one sheet (`@page` size, margin 0). Nothing is left for a printer to decide.

- `editor.print()` opens the browser's print dialog on it. "Save as PDF" there makes the file. No server.
- For a real PDF file, post `printableHtml()` to a renderer you run (headless Chrome). Folio does not ship one.

The print document carries a Content Security Policy that allows inline data and Google Fonts only, so no CSS trick makes a document call anywhere else.

## Fonts

Where a line wraps decides where a page ends, so the screen and a PDF made on a server agree only if they use the same fonts. System fonts differ between machines. Bundle web fonts for anything that has to match exactly.
