import type { Tab } from "../context";
import { button, group, hint, row, warn } from "../dom";

export const editTab: Tab = {
  id: "edit",
  title: "Edit",
  intro: "Typing is native: the browser edits the text, VibeDocWithSoap only notices. A few keys are taken over where the browser would change the structure behind the model's back.",
  build: ({ editor }) => [
    editor.plaintextOnlySupported ? null : warn("This browser cannot edit as plain text, so the page is read-only."),
    group(
      "Try these on the page",
      hint("Click any text and type. The change is sent after a short pause, or when you leave the element."),
      hint("Enter in a paragraph or list item starts a new one. Shift+Enter breaks the line instead."),
      hint("Backspace at the very start joins with the paragraph above (only the same kind; a heading never swallows a paragraph)."),
      hint("Paste text from anywhere: only plain text arrives, so no formatting or markup can sneak in."),
      hint("Ctrl+Z and Ctrl+Y use VibeDocWithSoap's history, not the browser's."),
    ),
    group(
      "What the editor knows",
      hint(`Status: ${editor.status}`),
      hint(`Selected element: ${editor.selection ? editor.selection.join(".") : "nothing yet (click the page)"}`),
      hint(`Versions kept: ${editor.versions.length}`),
    ),
    row(button("Put the caret in the first paragraph", () => {
      const first = editor.presentation.root.querySelector("p[data-vibedoc-unit]");
      const key = first?.getAttribute("data-vibedoc-path");
      if (key) editor.focus(key.split(".").map(Number));
    })),
  ],
};
