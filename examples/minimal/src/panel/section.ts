import type { Command, Editor } from "@vibedocwithsoap/core";
import { h, type Child } from "../dom";

export interface Section {
  el: HTMLElement;
  update(): void;
}

/** What every panel section can use. */
export interface PanelContext {
  editor: Editor;
  /** Runs a command as a person and logs how it went. */
  run(command: Command): void;
  log(line: string): void;
}

/** A collapsible section that rebuilds itself on update, unless a control inside it is being used. */
export function section(title: string, build: () => Child[], open = true): Section {
  const body = h("div", { class: "body" });
  const el = h("details", { open }, h("summary", {}, title), body);

  const update = () => {
    if (body.contains(document.activeElement)) return;
    const children = build().filter((c) => c !== null && c !== false && c !== undefined);
    body.replaceChildren(...children.map((c) => (c instanceof Node ? c : document.createTextNode(String(c)))));
  };
  return { el, update };
}
