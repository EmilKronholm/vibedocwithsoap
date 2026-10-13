/**
 * The presentation adapter: the one door between the DOM and the rest of Folio.
 *
 * Today it does two things:
 *
 * 1. `setup(html)` puts an HTML string on the page.
 * 2. Every raw browser event from the page comes out of the adapter as a
 *    custom event, `folio:<name>` (e.g. `folio:beforeinput`), with the
 *    original event and the text element it happened in.
 *
 * Nothing handles those events yet. They are here so that later layers
 * (commands, rules, history) listen to the adapter and never to the DOM.
 */

import { Presentation, type RawEventName } from "../view/presentation";

export const EVENT_PREFIX = "folio:";

export interface PresentationEventDetail {
  /** The browser's own event, untouched. */
  original: Event;
  /** The editable element it happened in, or null if it happened elsewhere. */
  unit: HTMLElement | null;
}

export type PresentationEvent = CustomEvent<PresentationEventDetail>;

export class PresentationAdapter extends EventTarget {
  readonly presentation: Presentation;
  readonly #stop: () => void;

  constructor(container: HTMLElement) {
    super();
    this.presentation = new Presentation(container);
    this.#stop = this.presentation.listen((original) => {
      const unit = this.presentation.unitOf(original.target) ?? this.#unitOfSelection();
      const detail: PresentationEventDetail = { original, unit };
      // Not cancelable on purpose: the adapter reports, it doesn't decide. Cancelling is done on the original.
      this.dispatchEvent(new CustomEvent(EVENT_PREFIX + original.type, { detail }));
    });
  }

  /** Puts the HTML string on the page. */
  setup(html: string): void {
    this.presentation.setHtml(html);
  }

  /** Listens to one kind of raw event, as the adapter reports it. Returns a function that stops it. */
  on(name: RawEventName, handler: (event: PresentationEvent) => void): () => void {
    const listener = (event: Event) => handler(event as PresentationEvent);
    this.addEventListener(EVENT_PREFIX + name, listener);
    return () => this.removeEventListener(EVENT_PREFIX + name, listener);
  }

  destroy(): void {
    this.#stop();
    this.presentation.destroy();
  }

  /** `selectionchange` has no useful target, so find the element from where the caret is. */
  #unitOfSelection(): HTMLElement | null {
    const selection = this.presentation.root.ownerDocument.getSelection();
    return this.presentation.unitOf(selection?.anchorNode ?? null);
  }
}
