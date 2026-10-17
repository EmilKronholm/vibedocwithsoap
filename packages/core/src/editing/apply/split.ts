import { failed, type EditFailure } from "../../commands";
import { PARAGRAPH_TAGS, elementPath, holdsOnlyText, setUnitText, unitText, type ElementPath } from "../../dom";
import { find } from "./find";
import { isFailure, type TreeChange } from "./types";

/** Enter: the text after `offset` moves into a copy of the element, right below it. */
export function splitUnit(root: HTMLElement, command: { path: ElementPath; offset: number }): TreeChange | EditFailure {
  const el = find(root, command.path);
  if (isFailure(el)) return el;
  if (!holdsOnlyText(el) || !PARAGRAPH_TAGS.has(el.tagName.toUpperCase())) {
    return failed("invalid", "Enter breaks the line here instead of starting a new element.");
  }

  const text = unitText(el);
  const offset = Math.min(Math.max(0, command.offset), text.length);
  const next = copyWithoutIdentity(el);
  setUnitText(el, text.slice(0, offset));
  setUnitText(next, text.slice(offset));
  el.after(next);
  return { focus: { path: elementPath(next, root), offset: 0 } };
}

// A block id or element id must be unique, and the new element is new text, not a copy of the block.
function copyWithoutIdentity(el: Element): Element {
  const copy = el.cloneNode(false) as Element;
  copy.removeAttribute("data-block");
  copy.removeAttribute("id");
  return copy;
}
