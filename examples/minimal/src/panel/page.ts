import { PAPER_SIZES, readKnobs, type PaperSize } from "@folio/core";
import { field, h, hex, hint, select } from "../dom";
import { section, type PanelContext } from "./section";

export function pageSection({ editor, run }: PanelContext) {
  return section("Page", () => {
    const page = editor.state.page;
    const name = typeof page.size === "string" ? page.size : "custom";
    return [
      field("Paper", select(Object.keys(PAPER_SIZES), name, (v) => run({ kind: "setPage", page: { ...page, size: v as PaperSize } }))),
      field(
        "Paper colour",
        h("input", { type: "color", value: hex(page.background ?? "#ffffff"), onInput: (e: Event) => run({ kind: "setPage", page: { ...page, background: (e.target as HTMLInputElement).value } }) }),
      ),
    ];
  });
}

export function knobSection({ editor, run }: PanelContext) {
  return section("Document settings", () => {
    const knobs = readKnobs(editor.state.html);
    if (knobs.length === 0) return [hint("This document declares no settings.")];

    return knobs.map((k) => {
      const set = (value: string | number) => run({ kind: "setKnob", name: k.name, value });
      const value = (e: Event) => (e.target as HTMLInputElement).value;

      if (k.kind === "color") return field(k.label, h("input", { type: "color", value: hex(k.value), onInput: (e: Event) => set(value(e)) }));
      if (k.kind === "options") return field(k.label, select(k.options, k.value, set));
      return field(`${k.label}: ${k.value}${k.unit}`, h("input", { type: "range", min: k.min, max: k.max, step: k.step, value: k.value, onInput: (e: Event) => set(Number(value(e))) }));
    });
  });
}
