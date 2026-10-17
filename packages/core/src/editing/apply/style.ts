import { failed, isFailure, type EditFailure } from "../../commands";
import type { ElementPath } from "../../dom";
import { find } from "./find";
import type { TreeChange } from "./types";

type Styled = Element & ElementCSSInlineStyle;

const hasStyle = (el: Element): el is Styled => "style" in el;

/** Sets one inline CSS property, or removes it with `null` so the document's own CSS applies again. */
export function setInlineStyle(
  root: HTMLElement,
  command: { path: ElementPath; property: string; value: string | null },
): TreeChange | EditFailure {
  const el = find(root, command.path);
  if (isFailure(el)) return el;
  if (!hasStyle(el)) return failed("invalid", "That element cannot carry a style.");

  if (command.value === null || command.value === "") el.style.removeProperty(command.property);
  else el.style.setProperty(command.property, command.value);
  if (!el.getAttribute("style")?.trim()) el.removeAttribute("style");
  return {};
}

/** Replaces an element's whole inline CSS. */
export function setInlineCss(root: HTMLElement, command: { path: ElementPath; css: string }): TreeChange | EditFailure {
  const el = find(root, command.path);
  if (isFailure(el)) return el;

  if (command.css.trim()) el.setAttribute("style", command.css.trim());
  else el.removeAttribute("style");
  return {};
}

/** Replaces the text of the document's `index`-th style element. */
export function setStylesheet(root: HTMLElement, command: { index: number; css: string }): TreeChange | EditFailure {
  const style = root.querySelectorAll("style")[command.index];
  if (!style) return failed("invalid", "There is no such style sheet.");
  style.textContent = command.css;
  return {};
}
