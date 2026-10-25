import { unitText, type ElementPath } from "../dom";

/** The style properties a style panel usually works with. */
export const STYLE_PROPS = [
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "color",
  "background-color",
  "text-align",
  "line-height",
  "letter-spacing",
  "margin-top",
  "margin-bottom",
  "padding-top",
  "padding-bottom",
  "width",
] as const;

export type StyleProp = (typeof STYLE_PROPS)[number];

/** A description of one element of the document, for building a style panel. */
export interface ElementInfo {
  path: ElementPath;
  tag: string;
  /** The text, if the element holds only text. */
  text?: string;
  /** The element's `style` attribute: what was set by hand. */
  inlineCss: string;
  /** What the element is actually drawn with. */
  computed: Record<StyleProp, string>;
}

export function describeElement(el: HTMLElement, path: ElementPath): ElementInfo {
  const view = el.ownerDocument.defaultView;
  const style = view ? view.getComputedStyle(el) : null;
  const computed = Object.fromEntries(STYLE_PROPS.map((prop) => [prop, style?.getPropertyValue(prop) ?? ""])) as Record<StyleProp, string>;
  const holdsText = el.hasAttribute("data-vibedoc-unit");

  return {
    path,
    tag: el.tagName.toLowerCase(),
    ...(holdsText ? { text: unitText(el) } : {}),
    inlineCss: el.getAttribute("style") ?? "",
    computed,
  };
}
