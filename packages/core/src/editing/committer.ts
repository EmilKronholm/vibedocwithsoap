import type { Actor, DocumentState, ReadonlyStateModel, StateWriter, UndoHistory, VersionLog } from "../model";

/** Records a change everywhere it has to be recorded: the model, the undo history and the version log. */
export class Committer {
  constructor(
    private readonly model: ReadonlyStateModel,
    private readonly writer: StateWriter,
    readonly history: UndoHistory,
    readonly versions: VersionLog,
  ) {}

  /** A new state made by `author`. `key` lets a burst of the same kind of edit share one undo step. */
  commit(next: DocumentState, author: Actor, summary?: string, key = ""): void {
    // History needs the state from before, so it is recorded first.
    this.history.record(this.model.get(), key);
    this.writer.commit(next);
    this.versions.record(next, author, summary);
  }

  /** Moves to a state that history already holds. Not a new undo step. */
  moveTo(state: DocumentState, summary?: string): void {
    this.writer.commit(state);
    this.versions.record(state, "human", summary);
  }

  undo(): boolean {
    const previous = this.history.undo(this.model.get());
    if (!previous) return false;
    this.moveTo(previous, "Undo");
    return true;
  }

  redo(): boolean {
    const next = this.history.redo(this.model.get());
    if (!next) return false;
    this.moveTo(next, "Redo");
    return true;
  }
}
