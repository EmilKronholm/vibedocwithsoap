import { describeRules, heading, textBox, type DocumentRules } from "@folio/core";
import type { Ctx, Tab } from "../context";
import { button, field, group, hint, row, select } from "../dom";
import { RULE_SETS } from "../rules";

const sameRules = (a: DocumentRules | undefined, b: DocumentRules | undefined) =>
  JSON.stringify({ ...a, permissions: undefined }) === JSON.stringify({ ...b, permissions: undefined });

export const rulesTab: Tab = {
  id: "rules",
  title: "Rules",
  intro: "One plain object says what a document may contain, which fonts and paper it may use. A person's change that breaks it is refused. The AI's output that breaks it is cleaned, and reported in the review.",
  build: (ctx) => {
    const { editor } = ctx;
    const current = Object.entries(RULE_SETS).find(([, rules]) => sameRules(rules, editor.rules))?.[0] ?? "custom";

    return [
      group(
        "Rule set",
        field("Active", select(Object.keys(RULE_SETS), current, (name) => choose(ctx, name))),
        hint("Rules apply to what changes from now on. Switching to a stricter set does not rewrite what is already in the document."),
        hint(describeRules(editor.rules)),
      ),
      group(
        "Try to break the rules",
        hint("Pick \"Text only\" above, then press these. Each is one command, and each is refused or allowed depending on the rules."),
        ...attempts(ctx),
      ),
    ];
  },
};

function choose({ editor, refresh }: Ctx, name: string): void {
  const next = { ...(RULE_SETS[name] ?? {}), ...(editor.rules?.permissions ? { permissions: editor.rules.permissions } : {}) };
  editor.rules = Object.keys(next).length > 0 ? next : undefined;
  refresh();
}

function attempts({ editor, run, targetPath }: Ctx) {
  const path = targetPath();
  const page = editor.state.page;

  return [
    row(button("Use the font Papyrus", () => path && run({ kind: "setInlineStyle", path, property: "font-family", value: "Papyrus" }), { primary: true }), hint("A font that is not on the list.")),
    row(button("Add a free-floating text box", () => run({ kind: "insertElement", after: "end", element: textBox({ left: 40, top: 40 }) }), { primary: true }), hint("A positioned element.")),
    row(button("Replace the document with one that has an image", () => run({ kind: "replaceAll", html: `${editor.state.html}<img alt="x" src="https://example.com/a.png">` }), { primary: true }), hint("Images are not in \"Text only\".")),
    row(button("Switch to Letter paper", () => run({ kind: "setPage", page: { ...page, size: "Letter" } }), { primary: true }), hint("Locked to A4 in two of the sets.")),
    row(button("Add a heading", () => run({ kind: "insertElement", after: "end", element: heading(2, "Allowed everywhere") }))),
  ];
}
