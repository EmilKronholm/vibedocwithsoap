import type { Editor } from "@vibedocwithsoap/core";
import { createCtx, type Ctx } from "./context";
import { button, h } from "./dom";
import { saveState } from "./save-state";
import { TABS } from "./tabs";

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

/** A control being used must not be rebuilt under the person's hand: a colour picker would lose the drag. */
const usingAControl = (root: HTMLElement) => ["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName ?? "") && root.contains(document.activeElement);

/** The sidebar: chips, tab buttons, the tab itself, a banner, and the event log. */
export function mountShell(editor: Editor): Ctx {
  const content = byId("content");
  const banner = byId("banner");
  const log = byId("log");
  let current = TABS[0].id;
  let queued = false;

  const ctx = createCtx(editor, {
    say(text, ok) {
      banner.textContent = text;
      banner.className = ok ? "ok" : "no";
    },
    log(line) {
      log.textContent = `${new Date().toLocaleTimeString()}  ${line}\n${log.textContent ?? ""}`.split("\n").slice(0, 40).join("\n");
    },
    refresh() {
      if (queued) return;
      queued = true;
      setTimeout(() => ((queued = false), draw()), 0);
    },
  });

  const choose = (id: string) => {
    current = id;
    banner.textContent = "";
    banner.className = "";
    draw(true);
  };

  function draw(force = false): void {
    drawChips();
    drawNav();
    if (!force && usingAControl(content)) return;
    const tab = TABS.find((t) => t.id === current) ?? TABS[0];
    content.replaceChildren(h("h2", {}, tab.title), h("p", { class: "intro" }, tab.intro), ...(tab.build(ctx).filter(Boolean) as Node[]));
  }

  function drawNav(): void {
    byId("nav").replaceChildren(...TABS.map((t) => h("button", { type: "button", class: t.id === current ? "on" : "", onClick: () => choose(t.id) }, t.title)));
  }

  function drawChips(): void {
    const chip = (text: string, cls = "") => h("span", { class: `chip ${cls}` }, text);
    byId("chips").replaceChildren(
      chip(`status: ${editor.status}`, editor.status),
      chip(`${editor.versions.length} versions`),
      chip(editor.rules ? "rules on" : "no rules"),
      chip(saveState.text),
    );
  }

  const events = ["state", "status", "review", "selection"] as const;
  for (const name of events) editor.on(name, () => ctx.refresh());
  editor.on("notice", (notice) => {
    ctx.log(`notice: ${notice.message}`);
    ctx.say(notice.violations?.length ? `${notice.message} (${notice.violations.map((v) => `${v.count}× ${v.detail}`).join(", ")})` : notice.message, false);
  });
  editor.on("review", (review) => ctx.log(review ? `review: ${review.changes.length} change(s) to decide` : "review ended"));
  editor.on("status", (status) => ctx.log(`status: ${status}`));

  draw(true);
  return ctx;
}

export { button };
