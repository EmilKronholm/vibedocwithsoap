import type { ReviewChange } from "@folio/core";
import { button, h, hint, row } from "../dom";
import { section, type PanelContext } from "./section";

function toggle(label: string, checked: boolean, onChange: (on: boolean) => void): HTMLLabelElement {
  return h("label", { style: "display: flex; gap: 6px; align-items: center" }, h("input", { type: "checkbox", checked, onChange: (e: Event) => onChange((e.target as HTMLInputElement).checked) }), label);
}

function describe(change: ReviewChange): string {
  const before = (change.before ?? "").slice(0, 50);
  const after = (change.after ?? "").slice(0, 50);
  return before && after ? `${before} → ${after}` : before || after;
}

export function reviewSection({ editor, run }: PanelContext) {
  return section("Review the AI's revision", () => {
    const review = editor.review;
    if (!review) return [hint("Nothing to review. Ask the AI to revise the document and its changes appear here and on the page.")];

    return [
      h("p", {}, review.summary || "The AI revised the document."),
      row(h("span", {}, "Said: ", h("b", {}, review.report.declared)), h("span", {}, "Did: ", h("b", {}, review.report.actual))),
      ...review.report.warnings.map((w) => h("p", { class: "warn" }, `⚠ ${w}`)),
      ...review.violations.map((v) => h("p", { class: "warn" }, `Rules removed ${v.count}× ${v.detail}`)),
      row(
        button("Keep all", () => run({ kind: "decideAll", accepted: true })),
        button("Undo all", () => run({ kind: "decideAll", accepted: false })),
        button("Finish", () => run({ kind: "finishReview" })),
        button("Discard", () => run({ kind: "discardReview" })),
      ),
      review.css.changed ? toggle(`Styles: ${review.css.added.length + review.css.removed.length} rule(s) changed`, review.css.accepted, (on) => run({ kind: "decideCss", accepted: on })) : null,
      ...review.changes.map((change) =>
        h(
          "div",
          { class: "card" },
          toggle(`${change.kind}${change.blockId ? ` · ${change.blockId}` : ""}`, change.accepted, (on) => run({ kind: "decideChange", id: change.id, accepted: on })),
          h("small", {}, describe(change)),
          ...change.flags.map((flag) => h("small", { class: "warn" }, `⚑ ${flag}`)),
        ),
      ),
    ];
  });
}
