import { field, hint, select } from "../dom";
import { RULES } from "../rules";
import { section, type PanelContext } from "./section";

export function rulesSection({ editor }: PanelContext) {
  return section("Rules", () => {
    const current = Object.entries(RULES).find(([, rules]) => JSON.stringify(rules) === JSON.stringify(editor.rules))?.[0] ?? "custom";
    const names = [...Object.keys(RULES), ...(current === "custom" ? ["custom"] : [])];
    return [
      hint("What a document may contain. A person's change that breaks the rules is refused; the AI's is cleaned."),
      field("Rule set", select(names, current, (name) => {
        if (name in RULES) editor.rules = RULES[name];
      })),
    ];
  });
}
