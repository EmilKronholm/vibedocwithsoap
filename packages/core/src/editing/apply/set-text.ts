import { failed, isFailure, type EditFailure } from "../../commands";
import { holdsOnlyText, setUnitText, type ElementPath } from "../../dom";
import { find } from "./find";
import type { TreeChange } from "./types";

export function setText(root: HTMLElement, command: { path: ElementPath; text: string }): TreeChange | EditFailure {
  const el = find(root, command.path);
  if (isFailure(el)) return el;
  if (!holdsOnlyText(el)) return failed("invalid", "That element does not hold only text.");
  setUnitText(el, command.text);
  return {};
}
