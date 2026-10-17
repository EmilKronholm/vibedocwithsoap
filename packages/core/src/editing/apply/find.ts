import { failed, type EditFailure } from "../../commands";
import { elementAt, isSkipped, type ElementPath } from "../../dom";

/** The element at `path`, or a failure saying nothing is there. The root itself is never a target. */
export function find(root: Element, path: ElementPath): Element | EditFailure {
  const el = elementAt(root, path);
  return el && el !== root ? el : failed("invalid", "There is nothing at that place in the document.");
}

/** The neighbour in reading order, skipping style elements, which are not content. */
export function contentSibling(el: Element, direction: "up" | "down"): Element | null {
  let sibling = direction === "up" ? el.previousElementSibling : el.nextElementSibling;
  while (sibling && isSkipped(sibling)) {
    sibling = direction === "up" ? sibling.previousElementSibling : sibling.nextElementSibling;
  }
  return sibling;
}
