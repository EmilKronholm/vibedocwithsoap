export type { Change, ChangeKind, CssDiff, DocDiff, Unit, WordOp } from "./types";
export { diffDocuments, countChanges, isEmptyDiff } from "./document-diff";
export { diffCss, splitCssRules } from "./css-diff";
export { diffWords, similarity } from "./word-diff";
export { readUnits, type ReadDocument } from "./read-units";
export { actualScope, checkScope, humanEditsBetween, type ScopeReport } from "./scope";
