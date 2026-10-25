import { DEFAULT_PAGE } from "./page";
import type { DocumentState } from "./state";
import type { Version } from "./versions";

export const SNAPSHOT_VERSION = 1;

/** Everything needed to save a document and open it again: plain JSON. */
export interface DocumentSnapshot {
  schemaVersion: typeof SNAPSHOT_VERSION;
  state: DocumentState;
  versions: Version[];
}

export function createSnapshot(state: DocumentState, versions: readonly Version[]): DocumentSnapshot {
  return { schemaVersion: SNAPSHOT_VERSION, state, versions: [...versions] };
}

/** Checks a value from storage and returns it as a snapshot. Throws if it is not usable. */
export function parseSnapshot(value: unknown): DocumentSnapshot {
  const raw = typeof value === "string" ? JSON.parse(value) : value;
  if (!raw || typeof raw !== "object") throw new Error("VibeDocWithSoap: not a document snapshot");

  const snapshot = raw as Partial<DocumentSnapshot>;
  if (snapshot.schemaVersion !== SNAPSHOT_VERSION) {
    throw new Error(`VibeDocWithSoap: unsupported snapshot version ${String(snapshot.schemaVersion)}`);
  }
  if (!snapshot.state || typeof snapshot.state.html !== "string") throw new Error("VibeDocWithSoap: snapshot has no document");

  const state: DocumentState = { html: snapshot.state.html, page: snapshot.state.page ?? DEFAULT_PAGE };
  return createSnapshot(state, Array.isArray(snapshot.versions) ? snapshot.versions : []);
}
