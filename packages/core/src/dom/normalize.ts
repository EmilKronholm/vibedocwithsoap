import { SVG_NS } from "./tags";
import { isSkipped } from "./units";

const hasOnlyBreakChildren = (el: Element) => Array.from(el.children).every((c) => c.tagName.toUpperCase() === "BR");

/**
 * Enforces one style per text element. Where text sits next to elements
 * (`<p>Hi <b>there</b></p>`), each run of loose text gets its own `<span>`, so
 * every piece of text is alone in an element and can be edited as plain text.
 * The look does not change.
 */
export function normalizeTextElements(root: Element): void {
  Array.from(root.children).forEach(visit);
}

function visit(el: Element): void {
  if (isSkipped(el) || el.namespaceURI === SVG_NS) return;
  if (el.children.length > 0 && !hasOnlyBreakChildren(el)) wrapLooseText(el);
  Array.from(el.children).forEach(visit);
}

function wrapLooseText(el: Element): void {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType !== Node.TEXT_NODE) continue;
    const text = (node as Text).data;
    if (!text.trim()) continue;
    (node as Text).replaceWith(...wrapped(el.ownerDocument, text));
  }
}

function wrapped(doc: Document, text: string): Node[] {
  const lead = text.slice(0, text.length - text.trimStart().length);
  const trail = text.slice(text.trimEnd().length);
  const span = doc.createElement("span");
  span.textContent = text.trim();

  // Whitespace stays outside the span so neighbouring words do not run together.
  const parts: Node[] = [];
  if (lead) parts.push(doc.createTextNode(lead));
  parts.push(span);
  if (trail) parts.push(doc.createTextNode(trail));
  return parts;
}
