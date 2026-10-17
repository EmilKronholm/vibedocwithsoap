import { DEFAULT_PAGE, samePage, type PageSetup } from "./page";

/** The state of a document: its HTML and its page. Nothing else. */
export interface DocumentState {
  html: string;
  page: PageSetup;
}

export function createState(init: Partial<DocumentState> = {}): DocumentState {
  return { html: init.html ?? "", page: init.page ?? DEFAULT_PAGE };
}

export function sameState(a: DocumentState, b: DocumentState): boolean {
  return a === b || (a.html === b.html && samePage(a.page, b.page));
}

/** Who made a change. */
export type Actor = "human" | "ai";
