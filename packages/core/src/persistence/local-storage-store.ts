import { parseSnapshot, type DocumentSnapshot } from "../model";
import type { DocumentStore } from "./store";

/** Keeps the document in the browser's `localStorage`. Small documents only; the browser limits the size. */
export class LocalStorageStore implements DocumentStore {
  constructor(
    private readonly key: string,
    private readonly storage: Pick<Storage, "getItem" | "setItem"> = localStorage,
  ) {}

  async load(): Promise<DocumentSnapshot | null> {
    const saved = this.storage.getItem(this.key);
    if (saved === null) return null;
    try {
      return parseSnapshot(saved);
    } catch {
      // A damaged or outdated save is treated as no save, so the editor still opens.
      return null;
    }
  }

  async save(snapshot: DocumentSnapshot): Promise<void> {
    this.storage.setItem(this.key, JSON.stringify(snapshot));
  }
}
