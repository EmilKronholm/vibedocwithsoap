import { failed, type Command, type EditResult } from "../commands";
import type { EditingCore } from "../editing";
import { humanEditsSinceAi } from "../editing/human-edits";
import { Emitter } from "../util/emitter";
import type { AiProvider, AiRequest, AiResult } from "./contract";
import { CancelledError, EmptyResultError, runProvider } from "./run";

/**
 * Asks the AI for work and hands what comes back to editing. The AI never
 * writes to the document: its result goes through the same door as everything
 * else, as a revision to review or a new document.
 */
export class AiCommander {
  #abort: AbortController | null = null;
  readonly #progress = new Emitter<[string]>();

  constructor(
    private readonly core: EditingCore,
    private readonly provider: () => AiProvider | null,
  ) {}

  /** Writes a new document from the instruction. It replaces the current one; undo brings that back. */
  compose(instruction?: string, context?: string): Promise<EditResult> {
    return this.#run("compose", instruction, context);
  }

  /** Asks for a revision of the current document. It ends in review. */
  revise(instruction?: string, context?: string): Promise<EditResult> {
    return this.#run("revise", instruction, context);
  }

  /** Stops the AI. The document is left as it was. */
  cancel(): void {
    this.#abort?.abort();
  }

  /** The document as the AI is writing it. */
  onProgress(listener: (html: string) => void): () => void {
    return this.#progress.on(listener);
  }

  async #run(kind: AiRequest["kind"], instruction: string | undefined, context: string | undefined): Promise<EditResult> {
    const provider = this.provider();
    if (!provider) return failed("no-provider", "No AI provider is set.");
    if (this.core.status.current !== "idle") return failed("locked", "Finish what is open first.");

    const request = this.#request(kind, instruction, context);
    const abort = new AbortController();
    this.#abort = abort;
    this.core.status.set("working");

    try {
      const result = await runProvider(provider, request, abort.signal, (html) => this.#progress.emit(html));
      return this.#hand(kind, result);
    } catch (error) {
      this.core.status.set("idle");
      return this.#failure(error);
    } finally {
      if (this.#abort === abort) this.#abort = null;
    }
  }

  #request(kind: AiRequest["kind"], instruction: string | undefined, context: string | undefined): AiRequest {
    const state = this.core.model.get();
    const humanEdits = humanEditsSinceAi(this.core.context);
    return {
      kind,
      html: state.html,
      instruction: instruction?.trim() || undefined,
      page: state.page,
      rules: this.core.rules,
      humanEdits: humanEdits.length > 0 ? humanEdits : undefined,
      context,
    };
  }

  #hand(kind: AiRequest["kind"], result: AiResult): EditResult {
    const command: Command = kind === "compose" ? { kind: "applyAiDocument", ...result } : { kind: "proposeAi", ...result };
    return this.core.dispatch(command, "ai");
  }

  #failure(error: unknown): EditResult {
    if (error instanceof CancelledError) return failed("cancelled", "Cancelled.");
    if (error instanceof EmptyResultError) return failed("ai-error", error.message);
    return failed("ai-error", error instanceof Error ? error.message : String(error));
  }
}
