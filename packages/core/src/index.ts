// The editor: create one, give it commands, listen to what it tells you.
export { createEditor, Editor, STYLE_PROPS } from "./editor";
export type { EditorEventName, EditorEvents, EditorOptions, ElementInfo, RenderRequest, Renderer, StyleProp } from "./editor";
export type { EditorStatus } from "./editing";

// The AI: one function from a request to a result. The editor turns the result into a revision to review.
export { describePage, httpProvider, readAiResult } from "./ai";
export type { AiEvent, AiProvider, AiRequest, AiResult } from "./ai";
export type { ReviewChange, ReviewChangeKind, ReviewFlag, ReviewSnapshot } from "./review";
export type { ScopeReport } from "./diff";

// Commands: everything that can be done to a document.
export { heading, isFailure, paragraph, textBox } from "./commands";
export type {
  AiDocument,
  Caret,
  ChangeScope,
  Command,
  CommandKind,
  DocumentCommand,
  EditError,
  EditErrorCode,
  EditResult,
  HistoryCommand,
  NewElement,
  Notice,
  ReviewCommand,
  RuleViolation,
  TextBoxInit,
} from "./commands";
export type { ElementPath } from "./dom";

// The document and its history.
export { DEFAULT_PAGE, PAPER_SIZES, createSnapshot, createState, parseSnapshot } from "./model";
export type { Actor, DocumentSnapshot, DocumentState, Margins, PageSetup, PaperSize, Version } from "./model";

// Rules: what a document may contain, which fonts and paper it may use, who may do what.
export { checkPage, describeRules, fitPage } from "./rules";
export type { ContentAllow, ContentLevel, DocumentRules, PageRules, PageViolation, PermissionRules } from "./rules";

// Settings a document declares for the host to show as controls, and fonts.
export { readKnobs } from "./knobs";
export type { Knob } from "./knobs";
export { googleFontUrl } from "./fonts";
