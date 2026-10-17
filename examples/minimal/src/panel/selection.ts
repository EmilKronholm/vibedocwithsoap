import { button, field, h, hex, hint, row, select } from "../dom";
import { section, type PanelContext } from "./section";

const FONTS = ["Georgia, serif", "Inter, sans-serif", "Papyrus, fantasy", "monospace"];

export function selectionSection({ editor, run }: PanelContext) {
  return section("Selected element", () => {
    const info = editor.describeSelection();
    const at = editor.selection;
    if (!info || !at) return [hint("Click an element on the page. Enter, Backspace and typing work as in any editor.")];

    const style = (property: string, value: string | null) => run({ kind: "setInlineStyle", path: at, property, value });
    const sizePt = Math.round(parseFloat(info.computed["font-size"]) * 0.75 * 2) / 2;
    const input = (e: Event) => (e.target as HTMLInputElement).value;

    return [
      h("p", {}, h("b", {}, `<${info.tag}>`), info.text ? ` “${info.text.slice(0, 40)}”` : ""),
      row(
        button("Up", () => run({ kind: "moveElement", path: at, direction: "up" })),
        button("Down", () => run({ kind: "moveElement", path: at, direction: "down" })),
        button("Duplicate", () => run({ kind: "duplicateElement", path: at })),
        button("Delete", () => run({ kind: "removeElement", path: at })),
      ),
      row(
        field("Colour", h("input", { type: "color", value: hex(info.computed.color), onInput: (e: Event) => style("color", input(e)) })),
        field("Size (pt)", h("input", { type: "number", min: 5, max: 96, step: 0.5, value: sizePt, onChange: (e: Event) => style("font-size", `${input(e)}pt`) })),
      ),
      row(field("Font", select(FONTS, "", (v) => style("font-family", v))), button("Reset style", () => run({ kind: "setInlineCss", path: at, css: "" }))),
    ];
  });
}
