import { isFailure, type Command, type Editor } from "@vibedocwithsoap/core";
import { aiSection } from "./ai";
import { exportSection } from "./export";
import { historySection } from "./history";
import { insertSection } from "./insert";
import { knobSection, pageSection } from "./page";
import { reviewSection } from "./review";
import { rulesSection } from "./rules";
import { selectionSection } from "./selection";
import type { PanelContext, Section } from "./section";

export type { Section } from "./section";

/** Every control the example offers, each built from the editor's public API. */
export function createPanel(editor: Editor, log: (line: string) => void): Section[] {
  const context: PanelContext = {
    editor,
    log,
    run(command: Command) {
      const result = editor.dispatch(command);
      log(`${command.kind}: ${isFailure(result) ? `refused (${result.error.message})` : result.changed ? "ok" : "no change"}`);
    },
  };
  return [aiSection, reviewSection, historySection, selectionSection, insertSection, pageSection, knobSection, rulesSection, exportSection].map((build) => build(context));
}
