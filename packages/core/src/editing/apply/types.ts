import type { Caret, DocumentCommand, EditFailure } from "../../commands";
import type { DocumentState } from "../../model";

/** Commands that work on the whole state, not on a parsed tree. */
export type StateCommandKind = "replaceAll" | "setPage" | "setKnob" | "addFontImport";

/** Commands that change the parsed document tree. */
export type TreeCommand = Exclude<DocumentCommand, { kind: StateCommandKind }>;

export type StateCommand = Extract<DocumentCommand, { kind: StateCommandKind }>;

/** What a command did to a parsed tree, beyond the change itself. */
export interface TreeChange {
  focus?: Caret;
}

export interface Applied {
  state: DocumentState;
  focus?: Caret;
}

export type ApplyOutcome = Applied | EditFailure;

export const isFailure = (value: object): value is EditFailure => "ok" in value;
