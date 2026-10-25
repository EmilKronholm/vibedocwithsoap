import { VibedocEditorElement } from "./vibedoc-editor";

export { VibedocEditorElement, type VibedocElementEventMap } from "./vibedoc-editor";

/** Registers `<vibedoc-editor>`. Safe to call more than once, and does nothing where there is no DOM. */
export function defineVibedocElements(): void {
  if (typeof customElements === "undefined") return;
  if (!customElements.get("vibedoc-editor")) customElements.define("vibedoc-editor", VibedocEditorElement);
}

defineVibedocElements();
