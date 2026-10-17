import type { ResolvedRules } from "./resolve";

const GENERIC_FAMILIES = new Set([
  "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif",
  "ui-monospace", "ui-rounded", "emoji", "math", "fangsong", "inherit", "initial", "unset", "revert",
]);

export function normalizeFamily(name: string): string {
  return name.trim().replace(/^["']|["']$/g, "").trim().toLowerCase();
}

/** The families named in a `font-family` value, in order. */
export function fontFamilies(value: string): string[] {
  return value.replace(/!important/i, "").split(",").map(normalizeFamily).filter(Boolean);
}

/** Whether every named, non-generic family in the value is allowed. A value using `var()` cannot be checked here. */
export function fontsAllowed(rules: ResolvedRules, value: string): boolean {
  if (!rules.fonts) return true;
  if (/var\(/i.test(value)) return true;
  return fontFamilies(value).every((family) => GENERIC_FAMILIES.has(family) || rules.fonts!.has(family));
}

/** The family a Google Fonts style sheet URL asks for, e.g. `Playfair Display`. */
export function familyOfFontUrl(url: string): string | null {
  const match = /[?&]family=([^:&;]+)/.exec(url);
  return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : null;
}

// A custom property holding a family list rather than a size: --font, --heading-font, --font-family.
export const FONT_PROPERTY = /^--(?:[\w-]*-)?(?:font|font-family|family|typeface)$/i;

const SIZE_TOKEN =
  /(?:^|\s)(?:[\d.]+(?:px|pt|em|rem|%|vh|vw|ch|ex|cm|mm|in|pc)|(?:xx?-)?(?:small|large)|xxx-large|medium|smaller|larger)(?:\/\S+)?\s+(.+)$/i;

/** The family list at the end of a `font` shorthand (`italic 12px/1.4 Georgia, serif`), or null if there is none. */
export function shorthandFamilies(value: string): string | null {
  const match = SIZE_TOKEN.exec(value.replace(/\s+/g, " ").trim());
  return match ? match[1] : null;
}
