import type { PresentationAdapter } from "./presentation-adapter";

/** Pasting brings only plain text, on one line, so no markup can come in from outside. */
export class PasteHandler {
  constructor(adapter: PresentationAdapter) {
    adapter.on("paste", ({ detail }) => {
      if (!detail.unit) return;
      const event = detail.original as ClipboardEvent;
      event.preventDefault();
      const text = (event.clipboardData?.getData("text/plain") ?? "").replace(/\s+/g, " ");
      detail.unit.ownerDocument.execCommand("insertText", false, text);
    });
  }
}
