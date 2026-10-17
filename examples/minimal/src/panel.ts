import { PAPER_SIZES, heading, isFailure, paragraph, readKnobs, textBox, type Command, type Editor, type ElementPath, type PaperSize } from "@folio/core";
import { button, field, h, hex, hint, row, select, type Child } from "./dom";
import { RULES } from "./rules";

export interface Section {
  el: HTMLElement;
  update(): void;
}

/** A collapsible section that rebuilds itself on update, unless a control inside it is being used. */
function section(title: string, build: () => Child[], open = true): Section {
  const body = h("div", { class: "body" });
  const el = h("details", { open }, h("summary", {}, title), body);
  const update = () => {
    if (body.contains(document.activeElement)) return;
    body.replaceChildren(...build().filter((c): c is Node | string | number => Boolean(c) || c === 0).map((c) => (c instanceof Node ? c : document.createTextNode(String(c)))));
  };
  return { el, update };
}

export function createPanel(editor: Editor, log: (line: string) => void): Section[] {
  const run = (command: Command) => {
    const result = editor.dispatch(command);
    log(`${command.kind}: ${isFailure(result) ? `refused (${result.error.message})` : result.changed ? "ok" : "no change"}`);
  };
  const path = () => editor.selection;
  const afterSelected = () => path() ?? "end";

  return [
    historySection(editor, run),
    selectionSection(editor, run),
    insertSection(run, afterSelected),
    pageSection(editor, run),
    knobSection(editor, run),
    rulesSection(editor),
  ];
}

function historySection(editor: Editor, run: (c: Command) => void): Section {
  return section("History", () => [
    row(button("Undo", () => run({ kind: "undo" }), !editor.canUndo), button("Redo", () => run({ kind: "redo" }), !editor.canRedo)),
    ...[...editor.versions].reverse().map((v, i) =>
      row(h("small", {}, `${v.author} · ${new Date(v.createdAt).toLocaleTimeString()} · ${v.summary ?? "edit"}`), i === 0 ? h("small", {}, "current") : button("Restore", () => run({ kind: "restoreVersion", id: v.id }))),
    ),
  ]);
}

function selectionSection(editor: Editor, run: (c: Command) => void): Section {
  return section("Selected element", () => {
    const info = editor.describeSelection();
    const at = editor.selection;
    if (!info || !at) return [hint("Click an element on the page. Enter, Backspace and typing work as in any editor.")];
    const style = (property: string, value: string | null) => run({ kind: "setInlineStyle", path: at, property, value });
    const size = parseFloat(info.computed["font-size"]) * 0.75;

    return [
      h("p", {}, h("b", {}, `<${info.tag}>`), info.text ? ` “${info.text.slice(0, 40)}”` : ""),
      row(
        button("Up", () => run({ kind: "moveElement", path: at, direction: "up" })),
        button("Down", () => run({ kind: "moveElement", path: at, direction: "down" })),
        button("Duplicate", () => run({ kind: "duplicateElement", path: at })),
        button("Delete", () => run({ kind: "removeElement", path: at })),
      ),
      row(
        field("Colour", h("input", { type: "color", value: hex(info.computed.color), onInput: (e: Event) => style("color", (e.target as HTMLInputElement).value) })),
        field("Size (pt)", h("input", { type: "number", min: 5, max: 96, step: 0.5, value: Math.round(size * 2) / 2, onChange: (e: Event) => style("font-size", `${(e.target as HTMLInputElement).value}pt`) })),
      ),
      row(
        field("Font", select(["Georgia, serif", "Inter, sans-serif", "Papyrus, fantasy", "monospace"], "", (v) => style("font-family", v))),
        button("Reset style", () => run({ kind: "setInlineCss", path: at, css: "" })),
      ),
    ];
  });
}

function insertSection(run: (c: Command) => void, after: () => ElementPath | "end"): Section {
  return section("Insert after the selection", () => [
    row(
      button("Paragraph", () => run({ kind: "insertElement", after: after(), element: paragraph("New paragraph") })),
      button("Heading", () => run({ kind: "insertElement", after: after(), element: heading(2, "New heading") })),
      button("Text box", () => run({ kind: "insertElement", after: after(), element: textBox({ left: 380, top: 40, width: 180, text: "A text box" }) })),
    ),
    hint("A text box is a positioned element, so rules that do not allow free-form content refuse it."),
  ]);
}

function pageSection(editor: Editor, run: (c: Command) => void): Section {
  return section("Page", () => {
    const page = editor.state.page;
    const name = typeof page.size === "string" ? page.size : "custom";
    return [
      row(
        field("Paper", select(Object.keys(PAPER_SIZES), name, (v) => run({ kind: "setPage", page: { ...page, size: v as PaperSize } }))),
        field("Paper colour", h("input", { type: "color", value: hex(page.background ?? "#ffffff"), onInput: (e: Event) => run({ kind: "setPage", page: { ...page, background: (e.target as HTMLInputElement).value } }) })),
      ),
    ];
  });
}

function knobSection(editor: Editor, run: (c: Command) => void): Section {
  return section("Document settings", () => {
    const knobs = readKnobs(editor.state.html);
    if (knobs.length === 0) return [hint("This document declares no settings.")];
    return knobs.map((k) => {
      if (k.kind === "color") return field(k.label, h("input", { type: "color", value: hex(k.value), onInput: (e: Event) => run({ kind: "setKnob", name: k.name, value: (e.target as HTMLInputElement).value }) }));
      if (k.kind === "options") return field(k.label, select(k.options, k.value, (v) => run({ kind: "setKnob", name: k.name, value: v })));
      return field(`${k.label}: ${k.value}${k.unit}`, h("input", { type: "range", min: k.min, max: k.max, step: k.step, value: k.value, onInput: (e: Event) => run({ kind: "setKnob", name: k.name, value: Number((e.target as HTMLInputElement).value) }) }));
    });
  });
}

function rulesSection(editor: Editor): Section {
  return section("Rules", () => {
    const current = Object.entries(RULES).find(([, r]) => JSON.stringify(r) === JSON.stringify(editor.rules))?.[0] ?? "custom";
    return [
      hint("What a document may contain. A person's change that breaks the rules is refused."),
      field("Rule set", select([...Object.keys(RULES), ...(current === "custom" ? ["custom"] : [])], current, (v) => { if (v in RULES) editor.rules = RULES[v]; })),
    ];
  });
}
