import { failed, type EditFailure, type NewElement } from "../../commands";
import { elementAt, elementPath, setUnitText, type ElementPath } from "../../dom";
import { contentSibling, find } from "./find";
import { isFailure, type TreeChange } from "./types";

export function moveElement(root: HTMLElement, command: { path: ElementPath; direction: "up" | "down" }): TreeChange | EditFailure {
  const el = find(root, command.path);
  if (isFailure(el)) return el;

  const sibling = contentSibling(el, command.direction);
  if (!sibling) return failed("nothing-to-do", "It is already at the edge.");
  if (command.direction === "up") sibling.before(el);
  else sibling.after(el);
  return { focus: { path: elementPath(el, root), offset: 0 } };
}

export function duplicateElement(root: HTMLElement, command: { path: ElementPath }): TreeChange | EditFailure {
  const el = find(root, command.path);
  if (isFailure(el)) return el;

  const copy = el.cloneNode(true) as Element;
  makeIdsUnique(copy);
  el.after(copy);
  return { focus: { path: elementPath(copy, root), offset: 0 } };
}

// Block ids are unique within a document; element ids must be too.
function makeIdsUnique(copy: Element): void {
  for (const node of [copy, ...Array.from(copy.querySelectorAll("[data-block]"))]) {
    const id = node.getAttribute("data-block");
    if (id) node.setAttribute("data-block", `${id}-copy`);
  }
  for (const node of [copy, ...Array.from(copy.querySelectorAll("[id]"))]) node.removeAttribute("id");
}

export function removeElement(root: HTMLElement, command: { path: ElementPath }): TreeChange | EditFailure {
  const el = find(root, command.path);
  if (isFailure(el)) return el;
  el.remove();
  return {};
}

export function insertElement(
  root: HTMLElement,
  command: { after: ElementPath | "end"; element: NewElement },
): TreeChange | EditFailure {
  const created = createElement(root.ownerDocument, command.element);
  if (isFailure(created)) return created;

  if (command.after === "end") {
    root.append(created);
  } else {
    const anchor = command.after.length === 0 ? null : elementAt(root, command.after);
    if (!anchor) return failed("invalid", "There is nothing at that place in the document.");
    anchor.after(created);
  }
  return { focus: { path: elementPath(created, root), offset: command.element.text?.length ?? 0 } };
}

function createElement(doc: Document, spec: NewElement): Element | EditFailure {
  if (!/^[a-z][a-z0-9]*$/i.test(spec.tag)) return failed("invalid", `"${spec.tag}" is not a tag name.`);
  const el = doc.createElement(spec.tag);
  if (spec.className) el.className = spec.className;
  if (spec.style) el.setAttribute("style", spec.style);
  if (spec.text) setUnitText(el, spec.text);
  return el;
}
