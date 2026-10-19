import { isFailure } from "@folio/core";
import { FRIENDLY_PRESETS } from "../ai/friendly";
import { PROVIDERS } from "../ai/providers";
import type { Ctx, Tab } from "../context";
import { button, field, group, h, hint, row, select } from "../dom";

// Remembered between rebuilds of the tab.
let choice = 0;
let instruction = "";

export const aiTab: Tab = {
  id: "ai",
  title: "AI",
  intro: "The AI is one function you give the editor. Writing replaces the document; revising returns changes to review. The page is locked while the AI works, and cancelling leaves the document as it was.",
  build: (ctx) => {
    const { editor } = ctx;
    const busy = editor.status !== "idle";
    editor.ai = PROVIDERS[choice].provider;

    return [
      group(
        "Which AI",
        select(PROVIDERS.map((p) => p.name), PROVIDERS[choice].name, (name) => {
          choice = PROVIDERS.findIndex((p) => p.name === name);
          editor.ai = PROVIDERS[choice].provider;
          ctx.refresh();
        }),
        hint(PROVIDERS[choice].about),
      ),
      group(
        "Ask",
        row(...FRIENDLY_PRESETS.map((text) => button(text, () => ((instruction = text), ctx.refresh())))),
        field("Instruction", h("textarea", { rows: 2, value: instruction, placeholder: "What should it do?", onInput: (e: Event) => (instruction = (e.target as HTMLTextAreaElement).value) })),
        row(
          button("Write a new document", () => void ask(ctx, "compose"), { disabled: busy }),
          button("Revise this one", () => void ask(ctx, "revise"), { disabled: busy, primary: true }),
          button("Cancel", () => editor.cancel(), { disabled: editor.status !== "working" }),
        ),
        editor.status === "working" ? hint("The AI is working. The page is locked.") : null,
      ),
      group(
        "Tell the AI what it cannot see",
        hint("Edit some text yourself, then revise. The request carries what you typed since the AI's last version, and the review flags any change to it."),
      ),
    ];
  },
};

async function ask({ editor, log, say, refresh }: Ctx, kind: "compose" | "revise"): Promise<void> {
  const result = await (kind === "compose" ? editor.compose(instruction) : editor.revise(instruction));
  const ok = !isFailure(result);
  say(ok ? `${kind}: ${kind === "revise" ? "a revision is ready to review (Review tab)" : "document written (undo brings the old one back)"}` : `${kind}: ${result.error.message}`, ok);
  log(`${kind}: ${ok ? "done" : result.error.code}`);
  refresh();
}
