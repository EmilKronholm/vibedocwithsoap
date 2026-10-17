import { failed, isHistoryKind, succeeded, type Command, type EditResult } from "../../commands";
import { sameState } from "../../model";
import type { CommandHandler, EditingContext } from "../context";

/** Undo, redo, and going back to an earlier version. */
export class HistoryHandler implements CommandHandler {
  constructor(private readonly context: EditingContext) {}

  handles(kind: Command["kind"]): boolean {
    return isHistoryKind(kind);
  }

  run(command: Command): EditResult {
    switch (command.kind) {
      case "undo":
        return this.#moved(this.context.committer.undo(), "There is nothing to undo.");
      case "redo":
        return this.#moved(this.context.committer.redo(), "There is nothing to redo.");
      case "restoreVersion":
        return this.#restore(command.id);
      default:
        return failed("invalid", "Not a history command.");
    }
  }

  #moved(done: boolean, nothing: string): EditResult {
    return done ? succeeded() : failed("nothing-to-do", nothing);
  }

  #restore(id: string): EditResult {
    const { committer, model } = this.context;
    const version = committer.versions.find(id);
    if (!version) return failed("invalid", "There is no such version.");
    if (sameState(version.state, model.get())) return succeeded({ changed: false });

    committer.commit(version.state, "human", `Restored: ${version.summary ?? "earlier version"}`);
    return succeeded();
  }
}
