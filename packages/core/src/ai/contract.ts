import type { AiDocument, ChangeScope } from "../commands";
import { CHANGE_SCOPES } from "../commands";
import type { PageSetup } from "../model";
import type { DocumentRules } from "../rules";

/** What the AI is asked to do. Plain JSON, so it can travel to any backend. */
export interface AiRequest {
  /** `compose` writes a new document; `revise` changes the current one. */
  kind: "compose" | "revise";
  /** The document as it stands, including the person's edits. Empty for `compose` into an empty document. */
  html: string;
  /** What the person asked for. Optional: a revision can be driven by the document alone. */
  instruction?: string;
  page: PageSetup;
  /** What the document may contain. Enforced on the result either way; `describeRules` turns it into text for a prompt. */
  rules?: DocumentRules;
  /** Text the person typed since the AI's last version. It should come back unchanged. */
  humanEdits?: string[];
  /** Background from the host that is not part of the request: tone, house rules. */
  context?: string;
}

/** A whole document written by the AI, with a summary and what it says it changed. */
export type AiResult = AiDocument;

export type AiEvent =
  /** The document so far, while it is being written. A snapshot, not a delta. */
  | { type: "progress"; html: string }
  | { type: "done"; result: AiResult }
  | { type: "error"; message: string };

/**
 * What the host gives the editor: a function from a request to a result. It
 * may return the result, or stream events with progress. What happens behind
 * it (a model, a backend, a person) is the host's business.
 */
export type AiProvider = (request: AiRequest, options: { signal: AbortSignal }) => AsyncIterable<AiEvent> | Promise<AiResult>;

/** Checks that an unknown value is a usable result. Returns null if it is not. */
export function readAiResult(value: unknown): AiResult | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (typeof raw.html !== "string" || !raw.html.trim()) return null;

  return {
    html: raw.html,
    summary: typeof raw.summary === "string" ? raw.summary : "",
    scope: CHANGE_SCOPES.includes(raw.scope as ChangeScope) ? (raw.scope as ChangeScope) : "whole",
    targets: Array.isArray(raw.targets) ? raw.targets.filter((t): t is string => typeof t === "string") : undefined,
  };
}
