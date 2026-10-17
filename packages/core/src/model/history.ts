import type { DocumentState } from "./state";

export interface UndoOptions {
  /** Most steps kept. */
  limit?: number;
  /** Edits with the same key closer together than this share one step. */
  coalesceMs?: number;
  now?: () => number;
}

/** Undo and redo as snapshots of the state before each change. */
export class UndoHistory {
  readonly #limit: number;
  readonly #coalesceMs: number;
  readonly #now: () => number;
  #past: DocumentState[] = [];
  #future: DocumentState[] = [];
  #lastKey = "";
  #lastAt = 0;

  constructor(options: UndoOptions = {}) {
    this.#limit = options.limit ?? 200;
    this.#coalesceMs = options.coalesceMs ?? 1000;
    this.#now = options.now ?? Date.now;
  }

  get canUndo(): boolean {
    return this.#past.length > 0;
  }

  get canRedo(): boolean {
    return this.#future.length > 0;
  }

  /** Remembers `before` as a step. A `key` lets a burst of the same kind of edit (typing, a slider drag) count as one. */
  record(before: DocumentState, key = ""): void {
    this.#future = [];
    const at = this.#now();
    const continuing = key !== "" && key === this.#lastKey && at - this.#lastAt < this.#coalesceMs;
    this.#lastKey = key;
    this.#lastAt = at;
    // Continuing a burst: the step already holds the state from before it began.
    if (continuing) return;

    this.#past.push(before);
    if (this.#past.length > this.#limit) this.#past.shift();
  }

  /** The state to go back to, or null. `current` becomes the redo step. */
  undo(current: DocumentState): DocumentState | null {
    const previous = this.#past.pop();
    if (!previous) return null;
    this.#future.push(current);
    this.#lastKey = "";
    return previous;
  }

  redo(current: DocumentState): DocumentState | null {
    const next = this.#future.pop();
    if (!next) return null;
    this.#past.push(current);
    this.#lastKey = "";
    return next;
  }

  clear(): void {
    this.#past = [];
    this.#future = [];
    this.#lastKey = "";
  }
}
