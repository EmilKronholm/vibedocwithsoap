import { isFailure, type DocumentCommand } from "../../commands";
import { parseHtml, toHtml } from "../../dom";
import type { DocumentState } from "../../model";
import { runStateCommand } from "./state-commands";
import { runTreeCommand } from "./tree-commands";
import type { ApplyOutcome, StateCommand, TreeCommand } from "./types";

const STATE_KINDS = new Set<string>(["replaceAll", "setPage", "setKnob", "addFontImport"]);

/**
 * What a command would turn the state into. Pure: it neither checks rules nor
 * records history; the editing pipeline does that around it.
 */
export function applyDocumentCommand(state: DocumentState, command: DocumentCommand): ApplyOutcome {
  if (STATE_KINDS.has(command.kind)) return runStateCommand(state, command as StateCommand);
  return applyToTree(state, command as TreeCommand);
}

function applyToTree(state: DocumentState, command: TreeCommand): ApplyOutcome {
  const root = parseHtml(state.html);
  const change = runTreeCommand(root, command);
  if (isFailure(change)) return change;
  return { state: { ...state, html: toHtml(root) }, ...(change.focus ? { focus: change.focus } : {}) };
}

export { isFailure } from "../../commands";
export type { ApplyOutcome } from "./types";
