import { Presentation, type RawEventName } from "../view/presentation";

export const EVENT_PREFIX = "folio:";

export interface PresentationEventDetail {
  /** The browser's own event, untouched. */
  original: Event;
  /** The editable element it happened in, or null. */
  unit: HTMLElement | null;
}

export type PresentationEvent = CustomEvent<PresentationEventDetail>;

/**
 * The one door between the DOM and the rest of Folio. Puts HTML on the page
 * and reports every raw browser event as a `folio:<name>` custom event.
 */
export class PresentationAdapter extends EventTarget {
  readonly presentation: Presentation;
  readonly #stop: () => void;

  constructor(container: HTMLElement) {
    super();
    this.presentation = new Presentation(container);
    this.#stop = this.presentation.listen((original) => {
      const unit = this.presentation.unitOf(original.target) ?? this.#unitOfSelection();
      // Not cancelable: cancel the original event instead.
      this.dispatchEvent(new CustomEvent(EVENT_PREFIX + original.type, { detail: { original, unit } }));
    });
  }

  /** Puts the HTML string on the page. */
  setup(html: string): void {
    this.presentation.setHtml(html);
  }

  /** Listens to one kind of raw event. Returns a function that stops it. */
  on(name: RawEventName, handler: (event: PresentationEvent) => void): () => void {
    const listener = (event: Event) => handler(event as PresentationEvent);
    this.addEventListener(EVENT_PREFIX + name, listener);
    return () => this.removeEventListener(EVENT_PREFIX + name, listener);
  }

  destroy(): void {
    this.#stop();
    this.presentation.destroy();
  }

  // selectionchange has no useful target, so use where the caret is.
  #unitOfSelection(): HTMLElement | null {
    const selection = this.presentation.root.ownerDocument.getSelection();
    return this.presentation.unitOf(selection?.anchorNode ?? null);
  }
}
