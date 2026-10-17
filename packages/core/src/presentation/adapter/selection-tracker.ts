import { PATH_ATTR, parsePathKey, type ElementPath } from "../../dom";
import { Emitter } from "../../util/emitter";
import type { PresentationAdapter } from "./presentation-adapter";

/** Follows which element of the document the person last clicked or typed in. */
export class SelectionTracker {
  #path: ElementPath | null = null;
  readonly #changes = new Emitter<[ElementPath | null]>();

  constructor(adapter: PresentationAdapter) {
    adapter.on("click", ({ detail }) => this.#select(detail.original.target));
    adapter.on("focusin", ({ detail }) => this.#select(detail.original.target));
  }

  get path(): ElementPath | null {
    return this.#path;
  }

  onChange(listener: (path: ElementPath | null) => void): () => void {
    return this.#changes.on(listener);
  }

  /** Forget the selection, for example after the element it pointed at is gone. */
  clear(): void {
    this.#set(null);
  }

  #select(target: EventTarget | null): void {
    const element = target instanceof Element ? target.closest(`[${PATH_ATTR}]`) : null;
    this.#set(element ? parsePathKey(element.getAttribute(PATH_ATTR) ?? "") : null);
  }

  #set(path: ElementPath | null): void {
    if (path?.join(".") === this.#path?.join(".")) return;
    this.#path = path;
    this.#changes.emit(path);
  }
}
