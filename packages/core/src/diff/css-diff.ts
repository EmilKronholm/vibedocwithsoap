import type { CssDiff } from "./types";

/** Splits CSS into its top-level rules, comments removed and whitespace normalised. */
export function splitCssRules(css: string): string[] {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of stripped) {
    current += char;
    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth = Math.max(0, depth - 1);
      if (depth === 0) {
        rules.push(current);
        current = "";
      }
    } else if (char === ";" && depth === 0) {
      // A top-level statement such as @import.
      rules.push(current);
      current = "";
    }
  }
  return rules.map(normalizeRule).filter(Boolean);
}

const normalizeRule = (rule: string) => rule.replace(/\s+/g, " ").replace(/\s*([{};:,])\s*/g, "$1").trim();

export function diffCss(before: string, after: string): CssDiff {
  const oldRules = splitCssRules(before);
  const newRules = splitCssRules(after);
  const inOld = new Set(oldRules);
  const inNew = new Set(newRules);
  const added = newRules.filter((rule) => !inOld.has(rule));
  const removed = oldRules.filter((rule) => !inNew.has(rule));
  return { changed: added.length > 0 || removed.length > 0, added, removed };
}
