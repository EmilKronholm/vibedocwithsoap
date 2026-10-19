import type { Tab } from "../context";
import { button, group, hint, row } from "../dom";

export const exportTab: Tab = {
  id: "export",
  title: "Export",
  intro: "The pages on screen are the pages that print. Export reads the document's state, never the page you are editing: it measures and paginates a clean copy again.",
  build: ({ editor, say }) => [
    group(
      "Print or save as PDF",
      row(button("Open the print dialog", () => void editor.print(), { primary: true })),
      hint("\"Save as PDF\" in that dialog makes the file. No server is involved."),
    ),
    group(
      "The printable document",
      row(
        button("Open it in a new tab", async () => {
          const html = await editor.printableHtml();
          window.open(URL.createObjectURL(new Blob([html], { type: "text/html" })), "_blank");
        }),
        button("Count its pages", async () => {
          const html = await editor.printableHtml();
          say(`${(html.match(/folio-print-page folio-doc/g) ?? []).length} page(s), ${(html.length / 1024).toFixed(0)} KB of HTML`, true);
        }),
      ),
      hint("This is the same HTML you would post to a headless Chrome for a real PDF file: one sheet per page, exact paper size, and a Content Security Policy that stops it loading anything unexpected."),
    ),
  ],
};
