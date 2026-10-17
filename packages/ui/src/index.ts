import { FolioEditorElement } from "./folio-editor";

export { FolioEditorElement, type FolioElementEventMap } from "./folio-editor";

/** Registers `<folio-editor>`. Safe to call more than once, and does nothing where there is no DOM. */
export function defineFolioElements(): void {
  if (typeof customElements === "undefined") return;
  if (!customElements.get("folio-editor")) customElements.define("folio-editor", FolioEditorElement);
}

defineFolioElements();
