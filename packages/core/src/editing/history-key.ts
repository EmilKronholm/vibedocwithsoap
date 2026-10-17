import { pathKey } from "../dom";
import type { DocumentCommand } from "../commands";

/**
 * Edits with the same key in quick succession share one undo step: typing in
 * one element, dragging one slider. Empty means every edit is its own step.
 */
export function historyKey(command: DocumentCommand): string {
  switch (command.kind) {
    case "setText":
      return `text:${pathKey(command.path)}`;
    case "setInlineStyle":
      return `style:${pathKey(command.path)}:${command.property}`;
    case "setKnob":
      return `knob:${command.name}`;
    default:
      return "";
  }
}
