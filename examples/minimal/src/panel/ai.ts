import { isFailure } from "@vibedocwithsoap/core";
import { claudeAi } from "../ai/claude-ai";
import { mockAi } from "../ai/mock-ai";
import { button, field, h, hint, row, select } from "../dom";
import { section, type PanelContext } from "./section";

const PROVIDERS = ["Mock AI (no key)", "Claude (key in this browser, demo only)"];

export function aiSection({ editor, log }: PanelContext) {
  let instruction = "";
  let provider = PROVIDERS[0];
  const providers = [mockAi(), claudeAi()];
  editor.ai = providers[0];

  const ask = async (kind: "compose" | "revise") => {
    const result = await (kind === "compose" ? editor.compose(instruction) : editor.revise(instruction));
    log(`${kind}: ${isFailure(result) ? result.error.message : "done"}`);
  };

  return section("AI", () => {
    const busy = editor.status !== "idle";
    return [
      hint("Write replaces the document. Revise returns changes to review below. The page is locked while the AI works."),
      field("Provider", select(PROVIDERS, provider, (name) => {
        provider = name;
        editor.ai = providers[PROVIDERS.indexOf(name)];
      })),
      field("Instruction", h("textarea", { rows: 2, value: instruction, placeholder: "e.g. make it shorter, add a paragraph", onInput: (e: Event) => (instruction = (e.target as HTMLTextAreaElement).value) })),
      row(
        button("Write", () => void ask("compose"), busy),
        button("Revise", () => void ask("revise"), busy),
        button("Cancel", () => editor.cancel(), editor.status !== "working"),
      ),
      editor.status === "working" ? h("small", {}, "The AI is working…") : null,
    ];
  });
}
