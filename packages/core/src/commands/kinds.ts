import type { CommandKind } from "./commands";

export const DOCUMENT_KINDS = [
  "replaceAll",
  "setText",
  "splitUnit",
  "mergeUnits",
  "moveElement",
  "duplicateElement",
  "removeElement",
  "insertElement",
  "setInlineStyle",
  "setInlineCss",
  "setStylesheet",
  "setKnob",
  "addFontImport",
  "setPage",
] as const satisfies readonly CommandKind[];

export const HISTORY_KINDS = ["undo", "redo", "restoreVersion"] as const satisfies readonly CommandKind[];

export const REVIEW_KINDS = [
  "decideChange",
  "decideCss",
  "decideAll",
  "finishReview",
  "discardReview",
] as const satisfies readonly CommandKind[];

export const AI_KINDS = ["proposeAi", "applyAiDocument"] as const satisfies readonly CommandKind[];

const group = (kinds: readonly CommandKind[]) => (kind: CommandKind) => kinds.includes(kind);

export const isDocumentKind = group(DOCUMENT_KINDS);
export const isHistoryKind = group(HISTORY_KINDS);
export const isReviewKind = group(REVIEW_KINDS);
export const isAiKind = group(AI_KINDS);

/** Who may do what, unless the rules say otherwise. The AI can only hand in work; people do everything else. */
export const DEFAULT_PERMISSIONS: Record<"human" | "ai", readonly CommandKind[]> = {
  human: [...DOCUMENT_KINDS, ...HISTORY_KINDS, ...REVIEW_KINDS],
  ai: AI_KINDS,
};
