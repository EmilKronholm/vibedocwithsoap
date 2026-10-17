import type { RuleViolation } from "../commands";
import type { Change, ScopeReport, WordOp } from "../diff";

export type ReviewChangeKind = Change["kind"] | "restyled";

/** Why a change deserves a second look. */
export type ReviewFlag = "outside-targets" | "touched-human-edit";

export interface ReviewChange {
  id: string;
  kind: ReviewChangeKind;
  blockId?: string;
  /** Text before the change (edits and removals). */
  before?: string;
  /** Text after the change (edits, additions, moves). */
  after?: string;
  /** For edits: the word-level diff from `before` to `after`. */
  words?: WordOp[];
  accepted: boolean;
  flags: ReviewFlag[];
}

/** A revision waiting for review, as a host draws it. */
export interface ReviewSnapshot {
  summary: string;
  /** What the AI said it changed, against what it really changed. */
  report: ScopeReport;
  changes: ReviewChange[];
  css: { changed: boolean; accepted: boolean; added: string[]; removed: string[] };
  /** What the document rules removed from the AI's output before the diff was made. */
  violations: RuleViolation[];
}
