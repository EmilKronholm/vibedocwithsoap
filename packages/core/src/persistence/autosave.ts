import type { DocumentSnapshot } from "../model";
import { Emitter } from "../util/emitter";
import type { DocumentStore } from "./store";

export type SaveStatus = { state: "saving" } | { state: "saved"; at: Date } | { state: "error"; message: string };

/** What autosave needs from the editor: to be told about changes, and to ask for the current snapshot. */
export interface SnapshotSource {
  onChange(listener: () => void): () => void;
  snapshot(): DocumentSnapshot;
}

export interface AutosaveOptions {
  /** Wait this long after the last change before saving. */
  delayMs?: number;
}

/**
 * Saves the document to a store after changes. Saves never overlap: a change
 * that arrives while one is running is saved when it finishes, so the store
 * always ends with the latest document.
 */
export class Autosave {
  readonly #status = new Emitter<[SaveStatus]>();
  readonly #stop: () => void;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #saving: Promise<void> | null = null;
  #dirty = false;

  constructor(
    private readonly source: SnapshotSource,
    private readonly store: DocumentStore,
    private readonly options: AutosaveOptions = {},
  ) {
    this.#stop = source.onChange(() => this.#schedule());
  }

  onStatus(listener: (status: SaveStatus) => void): () => void {
    return this.#status.on(listener);
  }

  /** Saves now, and resolves when everything up to now is saved. */
  async flush(): Promise<void> {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    this.#dirty = true;
    await this.#drain();
  }

  destroy(): void {
    this.#stop();
    if (this.#timer) clearTimeout(this.#timer);
    this.#status.clear();
  }

  #schedule(): void {
    this.#dirty = true;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = setTimeout(() => void this.flush(), this.options.delayMs ?? 800);
  }

  // One save at a time; a change made during a save sets #dirty and is picked up by the loop.
  #drain(): Promise<void> {
    this.#saving ??= this.#saveWhileDirty().finally(() => (this.#saving = null));
    return this.#saving;
  }

  async #saveWhileDirty(): Promise<void> {
    while (this.#dirty) {
      this.#dirty = false;
      this.#status.emit({ state: "saving" });
      try {
        await this.store.save(this.source.snapshot());
        this.#status.emit({ state: "saved", at: new Date() });
      } catch (error) {
        // The document is still in the editor; the next change tries again.
        this.#status.emit({ state: "error", message: error instanceof Error ? error.message : String(error) });
        return;
      }
    }
  }
}
