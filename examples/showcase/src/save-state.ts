import { LocalStorageStore } from "@folio/core";

export const SAVE_KEY = "folio-showcase-document";

/** Where the document is kept, and how the last save went. Shared by main.ts and the Save tab. */
export const saveState = {
  store: new LocalStorageStore(SAVE_KEY),
  text: "Not saved yet",
};
