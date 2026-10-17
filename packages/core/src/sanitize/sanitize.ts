import type { RuleViolation } from "../commands";
import { SVG_NS, normalizeTextElements, parseHtml, toHtml } from "../dom";
import { allowedHtmlTags, filterCss, resolveRules, type DocumentRules, type ResolvedRules } from "../rules";
import { DROPPED_TAGS, HTML_TAGS, SVG_TAGS } from "./allowlists";
import { keepsAttribute } from "./attributes";
import { Violations, violationName } from "./violations";

interface Context {
  rules: ResolvedRules;
  tags: ReadonlySet<string>;
  violations: Violations;
}

export interface SanitizeResult {
  html: string;
  violations: RuleViolation[];
}

/**
 * The one door model-written HTML comes through. Removes everything unsafe
 * and everything the rules forbid, then enforces one style per text element.
 * Reports what the rules (not safety) removed.
 */
export function sanitizeHtml(html: string, rules?: DocumentRules | null, doc: Document = document): SanitizeResult {
  const root = parseHtml(html, doc);
  const violations = sanitizeFragment(root, rules);
  normalizeTextElements(root);
  return { html: toHtml(root), violations };
}

/** Sanitises a parsed document in place. Returns what the rules removed. */
export function sanitizeFragment(root: Element, rules?: DocumentRules | null): RuleViolation[] {
  const resolved = resolveRules(rules);
  const context: Context = { rules: resolved, tags: allowedHtmlTags(resolved, HTML_TAGS), violations: new Violations() };
  // Deepest first, so unwrapping an element never skips its children.
  for (const el of Array.from(root.querySelectorAll("*")).reverse()) processElement(el, context);
  return context.violations.list();
}

function processElement(el: Element, context: Context): void {
  const tag = el.tagName.toUpperCase();
  if (DROPPED_TAGS.has(tag)) {
    el.remove();
    return;
  }

  const svg = el.namespaceURI === SVG_NS;
  if (!isKnown(el, tag, svg)) {
    unwrap(el);
    return;
  }
  if (svg ? !context.rules.allow.svg : !context.tags.has(tag)) {
    removeAgainstRules(el, tag, svg, context);
    return;
  }

  cleanAttributes(el, context);
  if (tag === "STYLE" && !svg) el.textContent = filterText(el.textContent ?? "", context);
}

const isKnown = (el: Element, tag: string, svg: boolean) => (svg ? SVG_TAGS.has(el.tagName.toLowerCase()) : HTML_TAGS.has(tag));

const unwrap = (el: Element) => el.replaceWith(...Array.from(el.childNodes));

function removeAgainstRules(el: Element, tag: string, svg: boolean, context: Context): void {
  const name = svg ? (el.tagName.toLowerCase() === "svg" ? "svg" : null) : violationName(tag);
  if (name) context.violations.add("content", name);
  // SVG goes whole, its children are shapes. An HTML tag is unwrapped so its text stays.
  if (svg) el.remove();
  else unwrap(el);
}

function cleanAttributes(el: Element, context: Context): void {
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase();
    if (!keepsAttribute(el, name, attr.value)) el.removeAttribute(attr.name);
    else if (name === "style") el.setAttribute("style", filterText(attr.value, context));
  }
}

function filterText(css: string, context: Context): string {
  const { css: filtered, removed } = filterCss(css, context.rules);
  for (const r of removed) context.violations.add(r.reason === "freeform" ? "freeform" : "fonts", `${r.property}: ${r.value}`);
  return filtered;
}
