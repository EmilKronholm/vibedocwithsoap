import type { ElementPath } from "../dom";

/** Something a document rule took out or refused. */
export interface RuleViolation {
  rule: "content" | "fonts" | "freeform";
  /** What was removed: a tag name, or a CSS declaration. */
  detail: string;
  count: number;
}

export type EditErrorCode =
  | "not-allowed"
  | "locked"
  | "invalid"
  | "rule-violation"
  | "nothing-to-do"
  | "no-review";

export interface EditError {
  code: EditErrorCode;
  message: string;
  violations?: RuleViolation[];
}

/** Something worth telling the person that is not an error. */
export interface Notice {
  code: "rules-removed" | "unchanged";
  message: string;
  violations?: RuleViolation[];
}

/** Where the caret belongs after a change: inside the element at `path`, `offset` characters in. */
export interface Caret {
  path: ElementPath;
  offset: number;
}

export interface EditSuccess {
  ok: true;
  /** False when the command was valid but left the document as it was. */
  changed: boolean;
  focus?: Caret;
  notices: Notice[];
}

export interface EditFailure {
  ok: false;
  error: EditError;
}

export type EditResult = EditSuccess | EditFailure;

export const succeeded = (init: Partial<Omit<EditSuccess, "ok">> = {}): EditSuccess => ({
  ok: true,
  changed: init.changed ?? true,
  notices: init.notices ?? [],
  ...(init.focus ? { focus: init.focus } : {}),
});

export const failed = (code: EditErrorCode, message: string, violations?: RuleViolation[]): EditFailure => ({
  ok: false,
  error: { code, message, ...(violations ? { violations } : {}) },
});
