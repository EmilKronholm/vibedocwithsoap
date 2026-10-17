import type { Knob } from "./types";

/** A value as it is written into the CSS: numbers are clamped to the knob's range and given its unit. */
export function formatKnobValue(knob: Knob, value: number | string): string {
  if (knob.kind !== "number") return String(value);
  const clamped = Math.min(knob.max, Math.max(knob.min, Number(value)));
  return `${parseFloat(clamped.toFixed(4))}${knob.unit}`;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Rewrites the first declaration of each named property, inside style
 * elements only, and leaves everything else byte for byte as it was.
 */
export function setKnobs(html: string, values: Record<string, string>): string {
  const pending = new Map(Object.entries(values));
  return html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (whole, open: string, css: string, close: string) => {
    const rewritten = rewriteDeclarations(css, pending);
    return rewritten === css ? whole : `${open}${rewritten}${close}`;
  });
}

function rewriteDeclarations(css: string, pending: Map<string, string>): string {
  let out = css;
  for (const [name, value] of pending) {
    const declaration = new RegExp(`(${escapeRegExp(name)}\\s*:\\s*)([^;{}]+?)(\\s*;)`);
    if (!declaration.test(out)) continue;
    out = out.replace(declaration, (_whole, head: string, _old: string, tail: string) => `${head}${value}${tail}`);
    pending.delete(name);
  }
  return out;
}
