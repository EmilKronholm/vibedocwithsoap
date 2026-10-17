import { Emitter } from "../util/emitter";
import { sameState, type DocumentState } from "./state";

export type StateListener = (state: DocumentState, previous: DocumentState) => void;

/** What everyone may do with the model: read it and watch it change. */
export interface ReadonlyStateModel {
  get(): DocumentState;
  subscribe(listener: StateListener): () => void;
}

/** The only way to change the model. Editing holds it; nothing else is given it. */
export interface StateWriter {
  commit(next: DocumentState): void;
}

/**
 * Creates the model and its writer separately, so "the model can only be
 * changed through editing" is enforced by who is handed the writer.
 */
export function createStateModel(initial: DocumentState): { model: ReadonlyStateModel; writer: StateWriter } {
  let current = initial;
  const changes = new Emitter<[DocumentState, DocumentState]>();

  const model: ReadonlyStateModel = {
    get: () => current,
    subscribe: (listener) => changes.on(listener),
  };

  const writer: StateWriter = {
    commit(next) {
      if (sameState(current, next)) return;
      const previous = current;
      current = next;
      changes.emit(next, previous);
    },
  };

  return { model, writer };
}
