import { failed, isFailure, isReviewKind, succeeded, type Command, type EditResult } from "../../commands";
import type { ReviewSession } from "../../review";
import type { CommandHandler, EditingContext } from "../context";

/** The person's decisions on an AI revision: keep or undo each change, then finish or discard. */
export class ReviewHandler implements CommandHandler {
  constructor(private readonly context: EditingContext) {}

  handles(kind: Command["kind"]): boolean {
    return isReviewKind(kind);
  }

  run(command: Command): EditResult {
    const session = this.context.review.session;
    if (!session) return failed("no-review", "There is no revision to review.");

    switch (command.kind) {
      case "decideChange":
        return this.#decide(() => session.setAccepted(command.id, command.accepted));
      case "decideCss":
        return this.#decide(() => session.setCssAccepted(command.accepted));
      case "decideAll":
        return this.#decide(() => session.setAllAccepted(command.accepted));
      case "finishReview":
        return this.#finish(session);
      case "discardReview":
        return this.#discard();
      default:
        return failed("invalid", "Not a review command.");
    }
  }

  #decide(change: () => void): EditResult {
    change();
    this.context.review.changed();
    return succeeded({ changed: false });
  }

  // The review ends before the commit, so the page is drawn as a normal document when it is written.
  #finish(session: ReviewSession): EditResult {
    const { review, status, committer, model, gate } = this.context;
    const keeps = session.keepsSomething;
    const html = keeps ? session.finalHtml() : model.get().html;
    const summary = `${session.summary || "AI revision"}${session.isPartial ? " (partly kept)" : ""}`;

    review.clear();
    status.set("idle");
    if (keeps) {
      const gated = gate.enforce({ ...model.get(), html }, "ai");
      if (!isFailure(gated)) committer.commit(gated.state, "ai", summary);
    }
    return succeeded({ changed: keeps });
  }

  #discard(): EditResult {
    this.context.review.clear();
    this.context.status.set("idle");
    return succeeded({ changed: false });
  }
}
