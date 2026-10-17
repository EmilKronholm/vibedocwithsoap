import type { ReviewSession, ReviewSnapshot } from "../review";
import { Emitter } from "../util/emitter";

/** Holds the revision under review, if there is one, and tells listeners when it or the decisions on it change. */
export class ReviewStore {
  #session: ReviewSession | null = null;
  readonly #changes = new Emitter<[ReviewSnapshot | null]>();

  get session(): ReviewSession | null {
    return this.#session;
  }

  snapshot(): ReviewSnapshot | null {
    return this.#session?.snapshot() ?? null;
  }

  /** The document with the revision's changes marked, for drawing instead of the document itself. */
  displayHtml(): string | null {
    return this.#session?.displayHtml() ?? null;
  }

  set(session: ReviewSession): void {
    this.#session = session;
    this.changed();
  }

  clear(): void {
    this.#session = null;
    this.changed();
  }

  /** Call after the decisions on the session changed. */
  changed(): void {
    this.#changes.emit(this.snapshot());
  }

  onChange(listener: (review: ReviewSnapshot | null) => void): () => void {
    return this.#changes.on(listener);
  }
}
