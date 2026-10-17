import { isAiKind, isFailure, succeeded, type AiDocument, type Command, type EditResult } from "../../commands";
import type { Actor } from "../../model";
import { ReviewSession } from "../../review";
import type { CommandHandler, EditingContext } from "../context";
import { humanEditsSinceAi } from "../human-edits";
import { removedNotices } from "../notices";

/** Takes work from the AI: a revision to be reviewed, or a whole new document. */
export class AiHandler implements CommandHandler {
  constructor(private readonly context: EditingContext) {}

  handles(kind: Command["kind"]): boolean {
    return isAiKind(kind);
  }

  run(command: Command, actor: Actor): EditResult {
    if (command.kind === "proposeAi") return this.#propose(command, actor);
    if (command.kind === "applyAiDocument") return this.#apply(command, actor);
    return succeeded({ changed: false });
  }

  // A revision is compared with the document, and waits for the person's decisions.
  #propose(document: AiDocument, actor: Actor): EditResult {
    const { model, gate, review, status } = this.context;
    const cleaned = gate.enforce({ ...model.get(), html: document.html }, actor);
    if (isFailure(cleaned)) return cleaned;

    const session = new ReviewSession(
      model.get().html,
      { ...document, html: cleaned.state.html },
      { humanEdits: humanEditsSinceAi(this.context), violations: cleaned.violations },
    );
    if (session.isEmpty) {
      status.set("idle");
      return succeeded({ changed: false, notices: [{ code: "unchanged", message: "The AI returned the document unchanged." }] });
    }

    review.set(session);
    status.set("reviewing");
    return succeeded({ changed: false, notices: removedNotices(cleaned.violations) });
  }

  // A new document has nothing to compare with, so it is committed straight away. Undo brings the old one back.
  #apply(document: AiDocument, actor: Actor): EditResult {
    const { model, gate, status, committer } = this.context;
    const cleaned = gate.enforce({ ...model.get(), html: document.html }, actor);
    if (isFailure(cleaned)) return cleaned;

    status.set("idle");
    committer.commit(cleaned.state, "ai", document.summary || undefined);
    return succeeded({ notices: removedNotices(cleaned.violations) });
  }
}
