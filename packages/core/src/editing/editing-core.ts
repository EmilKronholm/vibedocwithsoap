import { failed, isFailure, type Command, type EditResult, type Notice } from "../commands";
import {
  UndoHistory,
  VersionLog,
  createState,
  createStateModel,
  type Actor,
  type DocumentState,
  type ReadonlyStateModel,
  type Version,
} from "../model";
import type { ReviewSnapshot } from "../review";
import type { DocumentRules } from "../rules";
import { Emitter } from "../util/emitter";
import { Committer } from "./committer";
import type { CommandHandler, EditingContext } from "./context";
import { AiHandler } from "./handlers/ai-handler";
import { DocumentHandler } from "./handlers/document-handler";
import { HistoryHandler } from "./handlers/history-handler";
import { ReviewHandler } from "./handlers/review-handler";
import { ReviewStore } from "./review-store";
import { RuleGate } from "./rule-gate";
import { StatusMachine } from "./status";

export interface EditingOptions {
  initial?: DocumentState;
  /** Versions saved earlier. If none are given, a non-empty initial document becomes the first version. */
  versions?: readonly Version[];
  rules?: DocumentRules;
}

/**
 * The one door every change goes through, whoever makes it. A command is
 * checked against the status (locked while the AI works), the rules (who may
 * do what), applied, kept inside the rules, and only then written to the
 * model, with history and versions recorded alongside.
 */
export class EditingCore {
  readonly model: ReadonlyStateModel;
  readonly status = new StatusMachine();
  readonly #context: EditingContext;
  readonly #handlers: CommandHandler[];
  readonly #notices = new Emitter<[Notice]>();

  constructor(options: EditingOptions = {}) {
    const gate = new RuleGate(options.rules);
    const given = options.initial ?? createState();
    const initial = { ...given, html: gate.clean(given.html) };
    const { model, writer } = createStateModel(initial);
    const history = new UndoHistory();
    const versions = new VersionLog(options.versions);
    if (!options.versions?.length && initial.html) versions.record(initial, "human", "Initial document");

    this.model = model;
    this.#context = { model, status: this.status, gate, review: new ReviewStore(), committer: new Committer(model, writer, history, versions) };
    this.#handlers = [
      new DocumentHandler(this.#context),
      new HistoryHandler(this.#context),
      new ReviewHandler(this.#context),
      new AiHandler(this.#context),
    ];
  }

  get rules(): DocumentRules | undefined {
    return this.#context.gate.rules;
  }

  set rules(rules: DocumentRules | undefined) {
    this.#context.gate = new RuleGate(rules);
  }

  get canUndo(): boolean {
    return this.#context.committer.history.canUndo && this.status.current === "idle";
  }

  get canRedo(): boolean {
    return this.#context.committer.history.canRedo && this.status.current === "idle";
  }

  get versions(): readonly Version[] {
    return this.#context.committer.versions.list();
  }

  /** The AI revision waiting for the person's decisions, or null. */
  get review(): ReviewSnapshot | null {
    return this.#context.review.snapshot();
  }

  /** The document with the revision's changes marked, to draw while reviewing. Null when nothing is under review. */
  get reviewHtml(): string | null {
    return this.#context.review.displayHtml();
  }

  onReview(listener: (review: ReviewSnapshot | null) => void): () => void {
    return this.#context.review.onChange(listener);
  }

  /** The context handlers work with. */
  get context(): EditingContext {
    return this.#context;
  }

  onNotice(listener: (notice: Notice) => void): () => void {
    return this.#notices.on(listener);
  }

  /** Runs a command as `actor` (a person unless said otherwise). */
  dispatch(command: Command, actor: Actor = "human"): EditResult {
    const refused = this.status.check(command.kind) ?? this.#context.gate.permits(actor, command);
    if (refused) return refused;

    const handler = this.#handlers.find((h) => h.handles(command.kind));
    if (!handler) return failed("invalid", `Nothing handles ${command.kind}.`);

    const result = handler.run(command, actor);
    if (!isFailure(result)) result.notices.forEach((notice) => this.#notices.emit(notice));
    return result;
  }
}
