import type { AiDocument, RuleViolation } from "../commands";
import { checkScope, diffDocuments, type Change, type DocDiff, type ScopeReport } from "../diff";
import { applyDecisions } from "./apply-decisions";
import { buildReviewHtml } from "./markup";
import type { ReviewChange, ReviewFlag, ReviewSnapshot } from "./types";

const STYLES = /<style[\s\S]*?<\/style>/gi;

export interface ReviewContext {
  /** Text the person typed since the AI's last version. */
  humanEdits: string[];
  /** What the rules removed from the proposal. */
  violations: RuleViolation[];
}

/** One revision waiting for review: the document it was made against, what the AI returned, the diff, and the decisions so far. */
export class ReviewSession {
  readonly diff: DocDiff;
  readonly report: ScopeReport;
  #rejected = new Set<string>();
  #rejectCss = false;

  /** `proposal.html` must already be clean. */
  constructor(
    readonly base: string,
    readonly proposal: AiDocument,
    private readonly context: ReviewContext,
  ) {
    this.diff = diffDocuments(base, proposal.html);
    this.report = checkScope(this.diff, proposal, context.humanEdits);
  }

  get isEmpty(): boolean {
    return this.diff.changes.length === 0 && !this.diff.css.changed;
  }

  get summary(): string {
    return this.proposal.summary;
  }

  /** Whether anything at all is kept. If not, finishing changes nothing. */
  get keepsSomething(): boolean {
    return this.#rejected.size < this.diff.changes.length || (this.diff.css.changed && !this.#rejectCss);
  }

  get isPartial(): boolean {
    return this.#rejected.size > 0 || this.#rejectCss;
  }

  setAccepted(changeId: string, accepted: boolean): void {
    if (accepted) this.#rejected.delete(changeId);
    else this.#rejected.add(changeId);
  }

  setCssAccepted(accepted: boolean): void {
    this.#rejectCss = !accepted && this.diff.css.changed;
  }

  setAllAccepted(accepted: boolean): void {
    this.#rejected = accepted ? new Set() : new Set(this.diff.changes.map((c) => c.id));
    this.setCssAccepted(accepted);
  }

  /** The document with the kept changes applied. */
  finalHtml(): string {
    return applyDecisions(this.base, this.proposal.html, this.diff, { rejected: this.#rejected, rejectCss: this.#rejectCss });
  }

  /** The new document with its changes marked, for display. With the CSS undone, the old style sheets show. */
  displayHtml(): string {
    const html = buildReviewHtml(this.base, this.proposal.html, this.diff);
    if (!this.#rejectCss) return html;
    const oldStyles = Array.from(this.base.matchAll(STYLES), (m) => m[0]).join("\n");
    return oldStyles + html.replace(STYLES, "");
  }

  snapshot(): ReviewSnapshot {
    const { css } = this.diff;
    return {
      summary: this.summary,
      report: this.report,
      changes: this.diff.changes.map((change) => this.#describe(change)),
      css: { changed: css.changed, accepted: !this.#rejectCss, added: css.added, removed: css.removed },
      violations: this.context.violations,
    };
  }

  #describe(change: Change): ReviewChange {
    return {
      id: change.id,
      kind: change.kind === "modified" && change.markupOnly ? "restyled" : change.kind,
      blockId: change.blockId,
      before: change.kind === "modified" ? change.oldText : change.kind === "removed" ? change.text : undefined,
      after: change.kind === "modified" ? change.newText : change.kind === "removed" ? undefined : change.text,
      words: change.kind === "modified" && !change.markupOnly ? change.words : undefined,
      accepted: !this.#rejected.has(change.id),
      flags: this.#flags(change),
    };
  }

  #flags(change: Change): ReviewFlag[] {
    const flags: ReviewFlag[] = [];
    if (this.report.outsideTargets.includes(change.id)) flags.push("outside-targets");
    if (this.report.touchedHumanEdits.includes(change.id)) flags.push("touched-human-edit");
    return flags;
  }
}
