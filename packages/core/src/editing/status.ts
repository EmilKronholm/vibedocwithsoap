import { failed, isAiKind, isDocumentKind, isHistoryKind, isReviewKind, type CommandKind, type EditFailure } from "../commands";
import { Emitter } from "../util/emitter";

/**
 * - `idle`: the person can edit.
 * - `working`: the AI is writing. The document is locked.
 * - `reviewing`: an AI revision waits for the person's decisions. The document is locked.
 */
export type EditorStatus = "idle" | "working" | "reviewing";

const LOCK_MESSAGE: Record<Exclude<EditorStatus, "idle">, string> = {
  working: "The AI is working. Wait for it to finish.",
  reviewing: "Finish or discard the review first.",
};

export class StatusMachine {
  #status: EditorStatus = "idle";
  readonly #changes = new Emitter<[EditorStatus]>();

  get current(): EditorStatus {
    return this.#status;
  }

  onChange(listener: (status: EditorStatus) => void): () => void {
    return this.#changes.on(listener);
  }

  set(next: EditorStatus): void {
    if (next === this.#status) return;
    this.#status = next;
    this.#changes.emit(next);
  }

  /** A failure if a command of this kind may not run in the current status. */
  check(kind: CommandKind): EditFailure | null {
    if (isDocumentKind(kind) || isHistoryKind(kind)) return this.#status === "idle" ? null : failed("locked", LOCK_MESSAGE[this.#status]);
    if (isReviewKind(kind)) return this.#status === "reviewing" ? null : failed("no-review", "There is no revision to review.");
    if (isAiKind(kind)) return this.#status === "working" ? null : failed("invalid", "The AI has not been started.");
    return null;
  }
}
