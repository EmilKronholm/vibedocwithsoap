import type { Tab } from "../context";
import { button, group, h, hint, row } from "../dom";
import { SAMPLE } from "../sample";

export const historyTab: Tab = {
  id: "history",
  title: "History",
  intro: "Two histories. Undo is for this session and holds whole earlier states; a burst of typing is one step. Versions are named, saved with the document, and made by a person or the AI.",
  build: ({ editor, run }) => [
    group(
      "Undo",
      row(
        button("Undo", () => run({ kind: "undo" }), { disabled: !editor.canUndo }),
        button("Redo", () => run({ kind: "redo" }), { disabled: !editor.canRedo }),
        button("Reset to the sample document", () => run({ kind: "replaceAll", html: SAMPLE })),
      ),
      hint("Type a few words in one paragraph, then press Undo once: the whole burst goes."),
    ),
    group(
      `Versions (${editor.versions.length})`,
      ...[...editor.versions].reverse().map((v, i) =>
        row(
          h("small", { style: "flex: 1" }, `${v.author === "ai" ? "AI" : "You"} · ${new Date(v.createdAt).toLocaleTimeString()} · ${v.summary ?? "edits"}`),
          i === 0 ? h("small", {}, "current") : button("Restore", () => run({ kind: "restoreVersion", id: v.id })),
        ),
      ),
      hint("Restoring adds a new version; nothing is ever rewritten."),
    ),
  ],
};
