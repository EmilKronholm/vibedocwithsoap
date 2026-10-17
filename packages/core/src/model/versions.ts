import { createId } from "../util/id";
import type { Actor, DocumentState } from "./state";

/** A saved point in the document's history. */
export interface Version {
  id: string;
  state: DocumentState;
  author: Actor;
  /** What changed, in plain language. The AI always supplies one. */
  summary?: string;
  /** ISO timestamp. */
  createdAt: string;
  parentId?: string;
}

export interface VersionLogOptions {
  now?: () => Date;
  newId?: () => string;
}

/** The versions of a document, oldest first. Added to, never rewritten, except that consecutive human edits share one. */
export class VersionLog {
  #versions: readonly Version[];
  readonly #now: () => Date;
  readonly #newId: () => string;

  constructor(initial: readonly Version[] = [], options: VersionLogOptions = {}) {
    this.#versions = initial;
    this.#now = options.now ?? (() => new Date());
    this.#newId = options.newId ?? (() => createId("v"));
  }

  list(): readonly Version[] {
    return this.#versions;
  }

  head(): Version | undefined {
    return this.#versions[this.#versions.length - 1];
  }

  find(id: string): Version | undefined {
    return this.#versions.find((v) => v.id === id);
  }

  /** The newest version written by `author`. */
  lastBy(author: Actor): Version | undefined {
    return [...this.#versions].reverse().find((v) => v.author === author);
  }

  record(state: DocumentState, author: Actor, summary?: string): Version {
    const head = this.head();
    // A version with a summary was recorded on purpose (initial, restored), so it stays.
    if (head && head.author === "human" && author === "human" && !head.summary && !summary) return this.#replaceHead(head, state);

    const version: Version = {
      id: this.#newId(),
      state,
      author,
      summary,
      createdAt: this.#now().toISOString(),
      parentId: head?.id,
    };
    this.#versions = [...this.#versions, version];
    return version;
  }

  // Typing a paragraph would otherwise create a version per pause.
  #replaceHead(head: Version, state: DocumentState): Version {
    const replaced: Version = { ...head, state, createdAt: this.#now().toISOString() };
    this.#versions = [...this.#versions.slice(0, -1), replaced];
    return replaced;
  }
}
