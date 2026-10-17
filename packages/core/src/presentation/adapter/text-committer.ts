import { pathOfStamped, unitText } from "../../dom";
import type { PresentationAdapter } from "./presentation-adapter";
import type { CommandSink } from "./sink";

/**
 * Typing is native: the browser edits the text. This only notices that a text
 * element changed and, after a pause or when focus leaves it, sends its new
 * text as one `setText` command.
 */
export class TextCommitter {
  #pending: HTMLElement | null = null;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #composing = false;

  constructor(
    adapter: PresentationAdapter,
    private readonly sink: CommandSink,
    private readonly debounceMs = 400,
  ) {
    adapter.on("input", ({ detail }) => this.#changed(detail.unit));
    adapter.on("focusout", () => this.flush());
    adapter.on("compositionstart", () => (this.#composing = true));
    adapter.on("compositionend", () => (this.#composing = false));
  }

  /** Sends any text typed but not yet sent. */
  flush(): void {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    const unit = this.#pending;
    this.#pending = null;
    if (unit?.isConnected) this.#send(unit);
  }

  destroy(): void {
    if (this.#timer) clearTimeout(this.#timer);
    this.#pending = null;
  }

  #changed(unit: HTMLElement | null): void {
    if (!unit) return;
    this.#pending = unit;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#onPause(), this.debounceMs);
  }

  // Re-rendering in the middle of an input method's composition would break it, so wait for it to end.
  #onPause(): void {
    if (this.#composing) this.#timer = setTimeout(() => this.#onPause(), this.debounceMs);
    else this.flush();
  }

  #send(unit: HTMLElement): void {
    const path = pathOfStamped(unit);
    if (path) this.sink({ kind: "setText", path, text: unitText(unit) }, "typing");
  }
}
