import type { EditFailure } from "../../commands";
import { mergeUnits } from "./merge";
import { setText } from "./set-text";
import { splitUnit } from "./split";
import { duplicateElement, insertElement, moveElement, removeElement } from "./structure";
import { setInlineCss, setInlineStyle, setStylesheet } from "./style";
import type { TreeChange, TreeCommand } from "./types";

/** Runs a command that changes the parsed document tree. */
export function runTreeCommand(root: HTMLElement, command: TreeCommand): TreeChange | EditFailure {
  switch (command.kind) {
    case "setText":
      return setText(root, command);
    case "splitUnit":
      return splitUnit(root, command);
    case "mergeUnits":
      return mergeUnits(root, command);
    case "moveElement":
      return moveElement(root, command);
    case "duplicateElement":
      return duplicateElement(root, command);
    case "removeElement":
      return removeElement(root, command);
    case "insertElement":
      return insertElement(root, command);
    case "setInlineStyle":
      return setInlineStyle(root, command);
    case "setInlineCss":
      return setInlineCss(root, command);
    case "setStylesheet":
      return setStylesheet(root, command);
  }
}
