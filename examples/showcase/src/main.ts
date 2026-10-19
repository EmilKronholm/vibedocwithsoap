import { createEditor } from "@folio/core";
import { SAMPLE } from "./sample";
import { saveState } from "./save-state";
import { mountShell } from "./shell";

// The document is kept in this browser. Any other store works the same way: load a snapshot, hand it back.
const snapshot = await saveState.store.load();
const editor = createEditor({ container: document.getElementById("page")!, html: SAMPLE, snapshot: snapshot ?? undefined });

const ctx = mountShell(editor);

const autosave = editor.autosave(saveState.store);
autosave.onStatus((status) => {
  saveState.text = status.state === "saved" ? `saved ${status.at.toLocaleTimeString()}` : status.state === "saving" ? "saving…" : "not saved";
  if (status.state === "error") ctx.say(`Could not save: ${status.message}`, false);
  ctx.refresh();
});
