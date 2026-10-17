import { REPLACED_TAGS } from "./tags";

const isBreak = (node: Node) => node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName.toUpperCase() === "BR";

/** The text of a text element as typed: a line break is `\n`, nothing else is touched. */
export function unitText(el: Element): string {
  let text = "";
  for (const node of Array.from(el.childNodes)) text += isBreak(node) ? "\n" : (node.textContent ?? "");
  return text;
}

/** Replaces a text element's content with `text`, turning `\n` into `<br>`. */
export function setUnitText(el: Element, text: string): void {
  const doc = el.ownerDocument;
  const nodes: Node[] = [];
  text.split("\n").forEach((line, index) => {
    if (index > 0) nodes.push(doc.createElement("br"));
    if (line) nodes.push(doc.createTextNode(line));
  });
  el.replaceChildren(...nodes);
}

/** Text as a reader sees it, whitespace collapsed. Used to compare versions. */
export function normalizedText(el: Element): string {
  const tag = el.tagName.toUpperCase();
  if (REPLACED_TAGS.has(tag)) return describeReplaced(el, tag);

  let text = "";
  for (const node of Array.from(el.childNodes)) text += isBreak(node) ? " " : (node.textContent ?? "");
  return text.replace(/\s+/g, " ").trim();
}

function describeReplaced(el: Element, tag: string): string {
  const alt = el.getAttribute("alt") ?? el.getAttribute("aria-label") ?? "";
  const src = el.getAttribute("src") ?? "";
  return `[${tag.toLowerCase()}${alt ? `: ${alt}` : ""}${src ? ` ${src.slice(0, 80)}` : ""}]`;
}
