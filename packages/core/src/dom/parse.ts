/** Removes what a model sometimes wraps around HTML: a code fence or a doctype. */
export function cleanModelHtml(html: string): string {
  let out = html.trim();
  const fence = /^```(?:html)?\s*\n([\s\S]*?)\n?```$/i.exec(out);
  if (fence) out = fence[1].trim();
  return out.replace(/^<!doctype[^>]*>/i, "").trim();
}

/**
 * Parses an HTML string into a detached container element.
 * Nothing is sanitised here; see `sanitize/`.
 */
export function parseHtml(html: string, doc: Document = document): HTMLElement {
  // A template parses without a parent, so a top-level <tr> or <li> is kept.
  const template = doc.createElement("template");
  template.innerHTML = cleanModelHtml(html);
  const root = doc.createElement("div");
  root.append(template.content);
  return root;
}

/** The document source held by a container made with `parseHtml`. */
export function toHtml(root: Element): string {
  return root.innerHTML;
}
