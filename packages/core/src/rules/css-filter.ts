import { FONT_PROPERTY, familyOfFontUrl, fontsAllowed, normalizeFamily, shorthandFamilies } from "./fonts";
import type { ResolvedRules } from "./resolve";

export interface CssRemoval {
  property: string;
  value: string;
  reason: "font" | "freeform" | "import";
}

const IMPORT = /@import\s+(?:url\(\s*)?["']?([^"')\s;]+)["']?\s*\)?[^;]*;?/gi;
const DECLARATION = /([\w-]+)\s*:\s*([^;{}]+?)(\s*!important)?(?=\s*[;}]|\s*$)(;?)/g;

/**
 * Takes out of CSS text (a style element or an inline style) what the rules
 * forbid: declarations naming a font that is not allowed, `position: absolute`
 * and `fixed` when freeform is off, and `@import`s of fonts that are not allowed.
 *
 * It works on declarations, not on a full parse, so a font chosen through
 * `var()` is checked where the variable is set. The Content Security Policy
 * is what really limits what loads.
 */
export function filterCss(css: string, rules: ResolvedRules): { css: string; removed: CssRemoval[] } {
  const removed: CssRemoval[] = [];
  const withoutImports = rules.fonts ? dropImports(css, rules, removed) : css;
  const out = withoutImports.replace(DECLARATION, (whole, property: string, value: string) => {
    const reason = problemWith(property.toLowerCase(), value, rules);
    if (!reason) return whole;
    removed.push({ property, value: value.trim(), reason });
    return "";
  });
  return { css: out, removed };
}

function dropImports(css: string, rules: ResolvedRules, removed: CssRemoval[]): string {
  return css.replace(IMPORT, (whole, url: string) => {
    const family = familyOfFontUrl(url);
    if (family && rules.fonts!.has(normalizeFamily(family))) return whole;
    removed.push({ property: "@import", value: url, reason: "import" });
    return "";
  });
}

function problemWith(name: string, value: string, rules: ResolvedRules): CssRemoval["reason"] | null {
  if (rules.fonts) {
    const families = familiesIn(name, value);
    if (families !== null && !fontsAllowed(rules, families)) return "font";
  }
  const positioned = name === "position" && /^(absolute|fixed)\b/i.test(value.trim());
  return positioned && !rules.allow.freeform ? "freeform" : null;
}

/** The part of a declaration that names fonts, or null if it names none. */
function familiesIn(name: string, value: string): string | null {
  if (name === "font-family" || FONT_PROPERTY.test(name)) return value;
  return name === "font" ? shorthandFamilies(value) : null;
}
