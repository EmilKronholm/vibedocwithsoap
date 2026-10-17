import { blockIdOf, collectUnits, normalizedText, parseHtml } from "../dom";
import type { Unit } from "./types";

export interface ReadDocument {
  /** A detached container holding the parsed document. */
  root: HTMLElement;
  units: Unit[];
  /** The text of every style element, joined. */
  css: string;
}

/** Parses a document and lists its units. The HTML is assumed to be clean already. */
export function readUnits(html: string): ReadDocument {
  const root = parseHtml(html);
  const css = Array.from(root.querySelectorAll("style"), (style) => style.textContent ?? "").join("\n");
  const units = collectUnits(root).map((el, index) => toUnit(el, index));
  return { root, units, css };
}

function toUnit(el: Element, index: number): Unit {
  return {
    index,
    el,
    tag: el.tagName.toLowerCase(),
    text: normalizedText(el),
    markup: el.outerHTML.replace(/\s+/g, " ").trim(),
    blockId: blockIdOf(el),
  };
}
