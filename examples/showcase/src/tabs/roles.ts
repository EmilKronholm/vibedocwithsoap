import type { Tab } from "../context";
import { button, group, hint, row } from "../dom";
import { ROLES } from "../rules";

export const rolesTab: Tab = {
  id: "roles",
  title: "Roles",
  intro: "Who may do what is part of the rules. By default a person may do everything except hand in the AI's work, and the AI may only hand in work: it can never edit the document directly.",
  build: ({ editor, run }) => {
    const current = Object.entries(ROLES).find(([, p]) => JSON.stringify(p) === JSON.stringify(editor.rules?.permissions))?.[0] ?? "custom";
    const become = (name: string) => (editor.rules = { ...(editor.rules ?? {}), permissions: ROLES[name] });
    const path = editor.selection ?? [1, 0];

    return [
      group(
        `You are: ${current}`,
        row(...Object.keys(ROLES).map((name) => button(name, () => become(name), { primary: name === current }))),
        hint("Author edits freely. Reviewer can decide on the AI's changes and undo, but cannot edit. Read only can do nothing."),
      ),
      group(
        "Try",
        row(button("Type into the document via a command", () => run({ kind: "setText", path, text: "Typed as a person" }), { primary: true })),
        row(button("Make the AI edit the document directly", () => run({ kind: "setText", path, text: "Typed as the AI" }, "ai"), { primary: true })),
        hint("The second is always refused: the AI's only way in is a proposal that you review."),
      ),
    ];
  },
};
