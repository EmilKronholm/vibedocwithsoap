import type { ReviewChange } from "@vibedocwithsoap/core";
import type { Tab } from "../context";
import { button, group, h, hint, row, warn } from "../dom";

const FLAG_TEXT: Record<string, string> = {
  "outside-targets": "Outside the blocks the AI said it would change",
  "touched-human-edit": "Changes text you wrote yourself",
};

function toggle(label: string, checked: boolean, onChange: (on: boolean) => void): HTMLLabelElement {
  return h("label", { style: "display: flex; gap: 6px; align-items: center" }, h("input", { type: "checkbox", checked, onChange: (e: Event) => onChange((e.target as HTMLInputElement).checked) }), label);
}

function words(change: ReviewChange): string {
  const before = (change.before ?? "").slice(0, 60);
  const after = (change.after ?? "").slice(0, 60);
  return before && after ? `${before} → ${after}` : before || after;
}

export const reviewTab: Tab = {
  id: "review",
  title: "Review",
  intro: "Nothing the AI does is written to the document. Its revision is diffed, checked against what it said it did, and held until you decide each change.",
  build: ({ editor, run }) => {
    const review = editor.review;
    if (!review) return [hint("Nothing to review. Use the AI tab: revise the document with the Misbehaving mock to see every check fire.")];
    const { report } = review;

    return [
      h("p", {}, h("b", {}, review.summary || "The AI revised the document.")),
      group(
        "Said against did",
        row(h("span", {}, "The AI said: ", h("b", {}, report.declared)), h("span", {}, "The diff shows: ", h("b", {}, report.actual))),
        ...report.warnings.map((w) => warn(`⚠ ${w}`)),
        ...review.violations.map((v) => warn(`Rules removed ${v.count} × ${v.detail}`)),
      ),
      row(
        button("Keep all", () => run({ kind: "decideAll", accepted: true })),
        button("Undo all", () => run({ kind: "decideAll", accepted: false })),
        button("Finish", () => run({ kind: "finishReview" }), { primary: true }),
        button("Discard", () => run({ kind: "discardReview" })),
      ),
      review.css.changed ? toggle(`Styles: ${review.css.added.length + review.css.removed.length} rule(s) changed (decided as one group)`, review.css.accepted, (on) => run({ kind: "decideCss", accepted: on })) : null,
      ...review.changes.map((change) =>
        h(
          "div",
          { class: "card" },
          toggle(`${change.kind}${change.blockId ? ` · ${change.blockId}` : ""}`, change.accepted, (on) => run({ kind: "decideChange", id: change.id, accepted: on })),
          h("small", {}, words(change)),
          ...change.flags.map((flag) => warn(`⚑ ${FLAG_TEXT[flag] ?? flag}`)),
        ),
      ),
      hint("The page shows the same changes: green for new, struck through for removed, words marked inside edited text."),
    ];
  },
};
