import type { DocumentSnapshot } from "../model";

/**
 * Where a document is kept. Implement this for your database, your API or
 * the browser; the editor only ever hands over one snapshot of plain JSON.
 */
export interface DocumentStore {
  /** The saved document, or null if there is none yet. */
  load(): Promise<DocumentSnapshot | null>;
  save(snapshot: DocumentSnapshot): Promise<void>;
}
