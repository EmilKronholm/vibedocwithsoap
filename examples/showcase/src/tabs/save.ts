import { parseSnapshot } from "@vibedocwithsoap/core";
import type { Tab } from "../context";
import { button, group, h, hint, row } from "../dom";
import { SAVE_KEY, saveState } from "../save-state";

function download(name: string, text: string): void {
  const link = h("a", { href: URL.createObjectURL(new Blob([text], { type: "application/json" })), download: name });
  document.body.append(link);
  link.click();
  link.remove();
}

export const saveTab: Tab = {
  id: "save",
  title: "Save",
  intro: "VibeDocWithSoap stores nothing. It hands you one snapshot of plain JSON (the document and its versions) and takes one back. A store is anything that can load and save it.",
  build: ({ editor, say }) => {
    const json = JSON.stringify(editor.snapshot());
    return [
      group("Autosave", hint(saveState.text), hint("Saved to this browser a moment after each change, never two saves at once. Reload the page: the document and its history are still here.")),
      group(
        "The snapshot",
        hint(`${(json.length / 1024).toFixed(1)} KB of JSON, ${editor.versions.length} version(s).`),
        row(
          button("Download as a file", () => download("vibedoc-document.json", JSON.stringify(editor.snapshot(), null, 2))),
          h("label", { class: "act", style: "padding: 4px 10px; border: 1px solid #cbd5e1; border-radius: 4px; cursor: pointer" }, "Load from a file…", h("input", {
            type: "file",
            accept: "application/json",
            style: "display: none",
            onChange: async (e: Event) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              try {
                await saveState.store.save(parseSnapshot(await file.text()));
                location.reload();
              } catch (error) {
                say(`That file is not a VibeDocWithSoap document: ${error instanceof Error ? error.message : error}`, false);
              }
            },
          })),
        ),
      ),
      group(
        "Start over",
        row(button("Clear the saved document and reload", () => (localStorage.removeItem(SAVE_KEY), location.reload()))),
      ),
    ];
  },
};
