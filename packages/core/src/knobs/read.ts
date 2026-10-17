import type { Knob } from "./types";

// --name: value; /* @knob "Label" spec */
const DECLARATION = /(--[A-Za-z0-9_-]+)\s*:\s*([^;{}]+?)\s*;\s*\/\*\s*@knob\s+([\s\S]*?)\*\//g;

/** All knobs declared in a document's style elements, in source order. The first declaration of a name wins. */
export function readKnobs(html: string): Knob[] {
  const css = Array.from(html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi), (m) => m[1]).join("\n");
  const knobs: Knob[] = [];
  const seen = new Set<string>();

  for (const [, name, raw, spec] of css.matchAll(DECLARATION)) {
    if (seen.has(name)) continue;
    const knob = parseKnob(name, raw, spec);
    if (!knob) continue;
    knobs.push(knob);
    seen.add(name);
  }
  return knobs;
}

function parseLabel(spec: string): { label: string; rest: string } {
  const quoted = /^"([^"]*)"\s*([\s\S]*)$/.exec(spec.trim());
  if (quoted) return { label: quoted[1], rest: quoted[2].trim() };
  const [label, ...rest] = spec.trim().split(/\s+/);
  return { label, rest: rest.join(" ") };
}

function parseKnob(name: string, raw: string, spec: string): Knob | null {
  const { label, rest } = parseLabel(spec);
  const value = raw.trim();

  if (/^colou?r\b/i.test(rest)) return { kind: "color", name, label, value };

  const options = /^options\s+(.+)$/i.exec(rest);
  if (options) return { kind: "options", name, label, value, options: options[1].split(/[|,]/).map((o) => o.trim()).filter(Boolean) };

  return parseNumberKnob(name, label, value, rest);
}

function parseNumberKnob(name: string, label: string, value: string, rest: string): Knob | null {
  const range = /^(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)(?:\s+step\s+([\d.]+))?/i.exec(rest);
  const number = /^(-?[\d.]+)([a-z%]*)$/i.exec(value);
  if (!range || !number) return null;

  const min = Number(range[1]);
  const max = Number(range[2]);
  const step = range[3] ? Number(range[3]) : (max - min) / 100;
  return { kind: "number", name, label, value: Number(number[1]), unit: number[2], min, max, step };
}
