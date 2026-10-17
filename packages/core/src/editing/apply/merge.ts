import { failed, type EditFailure } from "../../commands";
import { elementPath, holdsOnlyText, setUnitText, unitText, type ElementPath } from "../../dom";
import { contentSibling, find } from "./find";
import { isFailure, type TreeChange } from "./types";

/**
 * Backspace at the start of an element or Delete at its end: joins it with its
 * neighbour. Only the same kind of element joins. A different kind never
 * swallows another, but an empty one simply goes away.
 */
export function mergeUnits(
  root: HTMLElement,
  command: { path: ElementPath; direction: "previous" | "next" },
): TreeChange | EditFailure {
  const el = find(root, command.path);
  if (isFailure(el)) return el;

  const other = contentSibling(el, command.direction === "previous" ? "up" : "down");
  if (!other || !holdsOnlyText(el) || !holdsOnlyText(other)) return nothingToJoin();

  const [first, second] = command.direction === "previous" ? [other, el] : [el, other];
  if (sameKind(first, second)) return join(root, first, second);
  return dropEmpty(root, first, second) ?? nothingToJoin();
}

const nothingToJoin = () => failed("nothing-to-do", "There is nothing to join with here.");

const sameKind = (a: Element, b: Element) => a.tagName === b.tagName && a.className === b.className;

function join(root: Element, first: Element, second: Element): TreeChange {
  const offset = unitText(first).length;
  setUnitText(first, unitText(first) + unitText(second));
  second.remove();
  return { focus: { path: elementPath(first, root), offset } };
}

function dropEmpty(root: Element, first: Element, second: Element): TreeChange | null {
  if (unitText(second) === "") {
    second.remove();
    return { focus: { path: elementPath(first, root), offset: unitText(first).length } };
  }
  if (unitText(first) === "") {
    first.remove();
    return { focus: { path: elementPath(second, root), offset: 0 } };
  }
  return null;
}
