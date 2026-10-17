import { button, h, row } from "../dom";
import { section, type PanelContext } from "./section";

export function historySection({ editor, run }: PanelContext) {
  return section("History", () => [
    row(button("Undo", () => run({ kind: "undo" }), !editor.canUndo), button("Redo", () => run({ kind: "redo" }), !editor.canRedo)),
    ...[...editor.versions].reverse().map((v, i) =>
      row(
        h("small", {}, `${v.author} · ${new Date(v.createdAt).toLocaleTimeString()} · ${v.summary ?? "edit"}`),
        i === 0 ? h("small", {}, "current") : button("Restore", () => run({ kind: "restoreVersion", id: v.id })),
      ),
    ),
  ]);
}
