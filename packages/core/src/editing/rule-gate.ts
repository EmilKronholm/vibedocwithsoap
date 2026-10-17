import { failed, type Command, type EditFailure, type RuleViolation } from "../commands";
import type { Actor, DocumentState } from "../model";
import { canPerform, checkCommand, type DocumentRules } from "../rules";
import { sanitizeHtml } from "../sanitize";

export interface Gated {
  state: DocumentState;
  /** What the rules removed. Always empty for a human, whose change is refused instead. */
  violations: RuleViolation[];
}

/**
 * The Rule Engine: decides whether an actor may do something, and keeps
 * documents inside the rules.
 *
 * A person's change that breaks a rule is refused. The AI's output that breaks
 * a rule is cleaned and reported, because there is no one to ask "did you mean
 * that?" and the rest of the revision is still worth reviewing.
 */
export class RuleGate {
  constructor(readonly rules: DocumentRules | undefined = undefined) {}

  /** Checks that can be made before a command is applied. */
  permits(actor: Actor, command: Command): EditFailure | null {
    if (!canPerform(actor, command.kind, this.rules)) return failed("not-allowed", `The ${actor} may not do that here.`);
    return actor === "human" ? checkCommand(command, this.rules) : null;
  }

  /** HTML from the host, cleaned under the rules. Violations are dropped silently: there is no one to tell. */
  clean(html: string): string {
    return sanitizeHtml(html, this.rules).html;
  }

  /** The state after sanitising and the rules, or a failure for a person's change that breaks them. */
  enforce(state: DocumentState, actor: Actor): Gated | EditFailure {
    const cleaned = sanitizeHtml(state.html, this.rules);
    if (actor === "human" && cleaned.violations.length > 0) {
      return failed("rule-violation", "That would break this document's rules.", cleaned.violations);
    }
    return { state: { ...state, html: cleaned.html }, violations: cleaned.violations };
  }
}
