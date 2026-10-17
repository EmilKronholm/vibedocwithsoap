import type { ElementPath } from "../dom";
import type { PageSetup } from "../model";

/** What the AI says it changed. The diff is checked against it. */
export type ChangeScope = "text" | "section" | "layout" | "whole";

export const CHANGE_SCOPES: readonly ChangeScope[] = ["text", "section", "layout", "whole"];

/** A new element to put in the document. */
export interface NewElement {
  tag: string;
  text?: string;
  className?: string;
  /** Inline CSS, e.g. to place a text box. */
  style?: string;
}

/** A whole document written by the AI. */
export interface AiDocument {
  html: string;
  summary: string;
  scope: ChangeScope;
  /** `data-block` ids the AI meant to change. */
  targets?: string[];
}

/** Changes to the document itself. */
export type DocumentCommand =
  | { kind: "replaceAll"; html: string }
  | { kind: "setText"; path: ElementPath; text: string }
  | { kind: "splitUnit"; path: ElementPath; offset: number }
  | { kind: "mergeUnits"; path: ElementPath; direction: "previous" | "next" }
  | { kind: "moveElement"; path: ElementPath; direction: "up" | "down" }
  | { kind: "duplicateElement"; path: ElementPath }
  | { kind: "removeElement"; path: ElementPath }
  | { kind: "insertElement"; after: ElementPath | "end"; element: NewElement }
  | { kind: "setInlineStyle"; path: ElementPath; property: string; value: string | null }
  | { kind: "setInlineCss"; path: ElementPath; css: string }
  | { kind: "setStylesheet"; index: number; css: string }
  | { kind: "setKnob"; name: string; value: string | number }
  | { kind: "addFontImport"; url: string }
  | { kind: "setPage"; page: PageSetup };

export type HistoryCommand = { kind: "undo" } | { kind: "redo" } | { kind: "restoreVersion"; id: string };

/** Decisions while reviewing an AI proposal. */
export type ReviewCommand =
  | { kind: "decideChange"; id: string; accepted: boolean }
  | { kind: "decideCss"; accepted: boolean }
  | { kind: "decideAll"; accepted: boolean }
  | { kind: "finishReview" }
  | { kind: "discardReview" };

export type AiCommand =
  /** A revision of the current document, to be reviewed. */
  | ({ kind: "proposeAi" } & AiDocument)
  /** A new document replacing the current one, committed without review. */
  | ({ kind: "applyAiDocument" } & AiDocument);

export type Command = DocumentCommand | HistoryCommand | ReviewCommand | AiCommand;

export type CommandKind = Command["kind"];
