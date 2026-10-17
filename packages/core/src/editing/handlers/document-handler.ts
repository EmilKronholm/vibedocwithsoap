import { isDocumentKind, isFailure, succeeded, type Command, type DocumentCommand, type EditResult } from "../../commands";
import { sameState, type Actor } from "../../model";
import { applyDocumentCommand } from "../apply";
import type { CommandHandler, EditingContext } from "../context";
import { historyKey } from "../history-key";
import { removedNotices } from "../notices";

/** Runs the commands that change the document: apply, enforce the rules, commit. */
export class DocumentHandler implements CommandHandler {
  constructor(private readonly context: EditingContext) {}

  handles(kind: Command["kind"]): boolean {
    return isDocumentKind(kind);
  }

  run(command: Command, actor: Actor): EditResult {
    const document = command as DocumentCommand;
    const { model, gate, committer } = this.context;

    const applied = applyDocumentCommand(model.get(), document);
    if (isFailure(applied)) return applied;

    const gated = gate.enforce(applied.state, actor);
    if (isFailure(gated)) return gated;
    if (sameState(gated.state, model.get())) return succeeded({ changed: false });

    committer.commit(gated.state, actor, undefined, historyKey(document));
    return succeeded({ focus: applied.focus, notices: removedNotices(gated.violations) });
  }
}
