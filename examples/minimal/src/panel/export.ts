import { button, hint, row } from "../dom";
import { section, type PanelContext } from "./section";

export function exportSection({ editor, log }: PanelContext) {
  return section("Export", () => [
    hint("The same pages as on screen, laid out from the document and not from the editing page."),
    row(
      button("Print / Save as PDF", () => void editor.print()),
      button("Show printable HTML size", async () => {
        const html = await editor.printableHtml();
        log(`printable HTML: ${html.length.toLocaleString()} characters`);
      }),
    ),
  ], false);
}
