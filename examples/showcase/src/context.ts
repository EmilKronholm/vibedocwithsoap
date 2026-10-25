import { isFailure, type Actor, type Command, type EditResult, type Editor, type ElementPath } from "@vibedocwithsoap/core";
import type { Child } from "./dom";

/** What every tab can use. */
export interface Ctx {
  editor: Editor;
  /** Runs a command, tells the person how it went, and returns the result. */
  run(command: Command, actor?: Actor): EditResult;
  /** Shows a line in the banner at the top of the sidebar. */
  say(text: string, ok: boolean): void;
  log(line: string): void;
  /** Asks every tab to rebuild itself. */
  refresh(): void;
  /** The selected element, or the first piece of text in the document. */
  targetPath(): ElementPath | null;
}

export interface Tab {
  id: string;
  title: string;
  /** What this feature is, in a sentence or two. */
  intro: string;
  build(ctx: Ctx): Child[];
}

export function createCtx(editor: Editor, parts: { say: Ctx["say"]; log: Ctx["log"]; refresh: Ctx["refresh"] }): Ctx {
  const run: Ctx["run"] = (command, actor = "human") => {
    const result = editor.dispatch(command, actor);
    const who = actor === "ai" ? " (as the AI)" : "";
    if (isFailure(result)) {
      parts.say(`${command.kind}${who} was refused: ${result.error.message}`, false);
      parts.log(`${command.kind}${who}: refused [${result.error.code}]`);
    } else {
      parts.say(`${command.kind}${who}: ${result.changed ? "done" : "nothing to change"}`, true);
      parts.log(`${command.kind}${who}: ${result.changed ? "ok" : "no change"}`);
    }
    return result;
  };

  const targetPath = (): ElementPath | null => {
    if (editor.selection) return editor.selection;
    const first = editor.presentation.root.querySelector("[data-vibedoc-unit]");
    const key = first?.getAttribute("data-vibedoc-path");
    return key ? key.split(".").map(Number) : null;
  };

  return { editor, run, targetPath, ...parts };
}
