import { heading, paragraph, textBox } from "@folio/core";
import type { Tab } from "../context";
import { button, field, group, h, hint, row } from "../dom";

export const structureTab: Tab = {
  id: "structure",
  title: "Structure",
  intro: "Move, copy and remove elements, and add new ones. Anything the person can do by hand, the AI can also do by asking; the person is the safety net.",
  build: ({ editor, run }) => {
    const at = editor.selection;
    const after = at ?? "end";
    const number = (id: string, value: number) => h("input", { type: "number", id, value, step: 10 });
    const read = (id: string) => Number((document.getElementById(id) as HTMLInputElement | null)?.value ?? 0);

    return [
      group(
        at ? `Selected: ${at.join(".")}` : "Selected: nothing (click the page)",
        row(
          button("Move up", () => at && run({ kind: "moveElement", path: at, direction: "up" }), { disabled: !at }),
          button("Move down", () => at && run({ kind: "moveElement", path: at, direction: "down" }), { disabled: !at }),
          button("Duplicate", () => at && run({ kind: "duplicateElement", path: at }), { disabled: !at }),
          button("Delete", () => at && run({ kind: "removeElement", path: at }), { disabled: !at }),
        ),
        hint("Duplicating keeps block ids unique. Moving skips style elements."),
      ),
      group(
        at ? "Insert after the selected element" : "Insert at the end",
        row(
          button("Paragraph", () => run({ kind: "insertElement", after, element: paragraph("A new paragraph.") })),
          button("Heading", () => run({ kind: "insertElement", after, element: heading(2, "A new heading") })),
        ),
      ),
      group(
        "A free-floating text box",
        hint("Positioned at a fixed place on the page, like a sticker. It is a positioned element, so rule sets that do not allow free-form content refuse it."),
        row(field("Left (px)", number("box-left", 380)), field("Top (px)", number("box-top", 40)), field("Width (px)", number("box-width", 180))),
        row(button("Add the text box", () => run({ kind: "insertElement", after, element: textBox({ text: "A text box", left: read("box-left"), top: read("box-top"), width: read("box-width") }) }), { primary: true })),
      ),
    ];
  },
};
