import { createEditor } from "@folio/core";
import { h } from "./dom";
import { createPanel } from "./panel";
import { SAMPLE } from "./sample";

const page = document.querySelector<HTMLElement>("#page")!;
const panel = document.querySelector<HTMLElement>("#panel")!;

const editor = createEditor({ container: page, html: SAMPLE });

if (!editor.plaintextOnlySupported) {
  panel.before(h("p", { class: "warn", style: "padding: 8px 14px" }, "This browser cannot edit as plain text, so the page is read-only."));
}

// The log: what the editor tells the host.
const logBox = h("pre", {});
const log = (line: string) => {
  logBox.textContent = `${new Date().toLocaleTimeString()}  ${line}\n${logBox.textContent ?? ""}`.split("\n").slice(0, 60).join("\n");
};

const sections = createPanel(editor, log);
const logSection = h("details", { open: true }, h("summary", {}, "Events"), h("div", { class: "body" }, logBox));
panel.append(...sections.map((s) => s.el), logSection);

let queued = false;
const refresh = () => {
  if (queued) return;
  queued = true;
  setTimeout(() => {
    queued = false;
    sections.forEach((s) => s.update());
  }, 0);
};

editor.on("state", (state, previous) => {
  log(`state changed (${previous.html.length} -> ${state.html.length} characters)`);
  refresh();
});
editor.on("status", (status) => {
  log(`status: ${status}`);
  refresh();
});
editor.on("notice", (notice) => log(`notice: ${notice.message}`));
editor.on("selection", (path) => {
  log(`selected: ${path ? path.join(".") : "nothing"}`);
  refresh();
});
refresh();
