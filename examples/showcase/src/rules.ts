import type { DocumentRules } from "@folio/core";

/** Rule sets to try. A real product usually has one, fixed by what it is for. */
export const RULE_SETS: Record<string, DocumentRules | undefined> = {
  "No rules": undefined,
  "Business document": { content: "rich", fonts: ["Georgia", "Inter"], page: { sizes: ["A4", "Letter"], backgrounds: ["#ffffff", "#faf6ee"] } },
  "Text only": { content: "text", fonts: ["Georgia"], page: { sizes: ["A4"], backgrounds: ["#ffffff"] } },
  "Paper locked": { page: { sizes: ["A4"], backgrounds: ["#ffffff"], margin: { min: 15, max: 25 } } },
};

/** Who may do what. "Author" is the default; the other two restrict the person. */
export const ROLES: Record<string, DocumentRules["permissions"]> = {
  Author: undefined,
  Reviewer: { human: ["decideChange", "decideCss", "decideAll", "finishReview", "discardReview", "undo", "redo"] },
  "Read only": { human: [] },
};
