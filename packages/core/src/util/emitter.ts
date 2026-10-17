/** A set of listeners for one kind of event. */
export class Emitter<Args extends unknown[]> {
  readonly #listeners = new Set<(...args: Args) => void>();

  /** Adds a listener. Returns a function that removes it. */
  on(listener: (...args: Args) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  emit(...args: Args): void {
    // Copied so a listener may remove itself while we iterate.
    for (const listener of Array.from(this.#listeners)) listener(...args);
  }

  clear(): void {
    this.#listeners.clear();
  }
}
