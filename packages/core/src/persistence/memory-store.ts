import { parseSnapshot, type DocumentSnapshot } from "../model";
import type { DocumentStore } from "./store";

/** Keeps the document in memory. For tests and demos. */
export class MemoryStore implements DocumentStore {
  #json: string | null;

  constructor(initial: DocumentSnapshot | null = null) {
    this.#json = initial ? JSON.stringify(initial) : null;
  }

  async load(): Promise<DocumentSnapshot | null> {
    return this.#json === null ? null : parseSnapshot(this.#json);
  }

  async save(snapshot: DocumentSnapshot): Promise<void> {
    // Through JSON, so a store never holds anything a real one could not.
    this.#json = JSON.stringify(snapshot);
  }
}
