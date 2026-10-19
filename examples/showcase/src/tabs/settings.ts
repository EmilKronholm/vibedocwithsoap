import { PAPER_SIZES, readKnobs, type Margins, type PaperSize } from "@folio/core";
import type { Ctx, Tab } from "../context";
import { field, group, h, hex, hint, row, select } from "../dom";

export const settingsTab: Tab = {
  id: "settings",
  title: "Settings",
  intro: "Two kinds of settings. The document declares its own (the AI decides what is worth adjusting). The page is Folio's: paper, margins, colour.",
  build: (ctx) => [documentSettings(ctx), pageSettings(ctx)],
};

function documentSettings({ editor, run }: Ctx) {
  const knobs = readKnobs(editor.state.html);
  if (knobs.length === 0) return group("Document settings", hint("This document declares none."));

  return group(
    "Document settings (from @knob comments in its CSS)",
    ...knobs.map((k) => {
      const set = (value: string | number) => run({ kind: "setKnob", name: k.name, value });
      const value = (e: Event) => (e.target as HTMLInputElement).value;
      if (k.kind === "color") return field(k.label, h("input", { type: "color", value: hex(k.value), onInput: (e: Event) => set(value(e)) }));
      if (k.kind === "options") return field(k.label, select(k.options, k.value, set));
      return field(`${k.label}: ${k.value}${k.unit}`, h("input", { type: "range", min: k.min, max: k.max, step: k.step, value: k.value, onInput: (e: Event) => set(Number(value(e))) }));
    }),
    hint("Each slider move is one undo step, however many events it sends."),
  );
}

function pageSettings({ editor, run }: Ctx) {
  const page = editor.state.page;
  const name = typeof page.size === "string" ? page.size : "custom";
  const margin = (side: keyof Margins) =>
    field(`${side} (mm)`, h("input", { type: "number", min: 0, max: 60, value: page.margin[side], onChange: (e: Event) => run({ kind: "setPage", page: { ...page, margin: { ...page.margin, [side]: Number((e.target as HTMLInputElement).value) || 0 } } }) }));

  return group(
    "Page",
    row(
      field("Paper", select(Object.keys(PAPER_SIZES), name, (v) => run({ kind: "setPage", page: { ...page, size: v as PaperSize } }))),
      field("Paper colour", h("input", { type: "color", value: hex(page.background ?? "#ffffff"), onInput: (e: Event) => run({ kind: "setPage", page: { ...page, background: (e.target as HTMLInputElement).value } }) })),
    ),
    row(margin("top"), margin("right"), margin("bottom"), margin("left")),
    hint("Change the margins and watch the page breaks move. The pages on screen are the pages that print."),
  );
}
