import type { Tab } from "../context";
import { button, field, group, h, hex, hint, row, select } from "../dom";

const FONTS = ["Georgia, serif", "Inter, sans-serif", "monospace", "Papyrus, fantasy"];
const WEIGHTS = ["300", "400", "500", "600", "700"];

export const styleTab: Tab = {
  id: "style",
  title: "Style",
  intro: "Restyle the selected element. Each control is one command, so it is undoable, versioned, and checked against the document's rules.",
  build: ({ editor, run }) => {
    const info = editor.describeSelection();
    const at = editor.selection;
    if (!info || !at) return [hint("Click an element on the page first.")];

    const style = (property: string, value: string | null) => run({ kind: "setInlineStyle", path: at, property, value });
    const value = (e: Event) => (e.target as HTMLInputElement).value;
    const size = Math.round(parseFloat(info.computed["font-size"]) * 0.75 * 2) / 2;

    return [
      h("p", {}, h("b", {}, `<${info.tag}>`), info.text ? ` “${info.text.slice(0, 50)}”` : ""),
      group(
        "Text",
        row(
          field("Colour", h("input", { type: "color", value: hex(info.computed.color), onInput: (e: Event) => style("color", value(e)) })),
          field("Size (pt)", h("input", { type: "number", min: 5, max: 96, step: 0.5, value: size, onChange: (e: Event) => style("font-size", `${value(e)}pt`) })),
        ),
        row(
          field("Font", select(FONTS, "", (v) => style("font-family", v))),
          field("Weight", select(WEIGHTS, String(Math.round(parseFloat(info.computed["font-weight"]) / 100) * 100 || 400), (v) => style("font-weight", v))),
        ),
        row(field("Align", select(["start", "center", "end", "justify"], info.computed["text-align"], (v) => style("text-align", v)))),
        hint("Papyrus is not in the Business or Text-only rule sets: pick it there to see a refusal."),
      ),
      group(
        "Raw inline CSS",
        h("textarea", { rows: 2, value: info.inlineCss, onChange: (e: Event) => run({ kind: "setInlineCss", path: at, css: value(e) }) }),
        row(button("Reset all inline style", () => run({ kind: "setInlineCss", path: at, css: "" }))),
      ),
    ];
  },
};
