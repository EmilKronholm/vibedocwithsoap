import { heading, paragraph, textBox } from "@folio/core";
import { button, hint, row } from "../dom";
import { section, type PanelContext } from "./section";

export function insertSection({ editor, run }: PanelContext) {
  // After the selected element, or at the end when nothing is selected.
  const after = () => editor.selection ?? "end";

  return section("Insert after the selection", () => [
    row(
      button("Paragraph", () => run({ kind: "insertElement", after: after(), element: paragraph("New paragraph") })),
      button("Heading", () => run({ kind: "insertElement", after: after(), element: heading(2, "New heading") })),
      button("Text box", () => run({ kind: "insertElement", after: after(), element: textBox({ left: 380, top: 40, width: 180, text: "A text box" }) })),
    ),
    hint("A text box is a positioned element, so rules that do not allow free-form content refuse it."),
  ]);
}
