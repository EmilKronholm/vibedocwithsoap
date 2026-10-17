import { CHANGE_SCOPES, type AiDocument, type ChangeScope } from "../commands";
import { diffDocuments } from "./document-diff";
import type { Change, DocDiff } from "./types";
import { similarity } from "./word-diff";

const RANK = Object.fromEntries(CHANGE_SCOPES.map((scope, index) => [scope, index])) as Record<ChangeScope, number>;

/** Share of the document that has to change before it counts as a rewrite. */
const WHOLE_THRESHOLD = 0.6;

/** How alike two texts must be for one to count as the person's text that the AI touched. */
const HUMAN_TEXT_MATCH = 0.85;

export interface ScopeReport {
  declared: ChangeScope;
  actual: ChangeScope;
  /** The diff is broader than the AI said. */
  broaderThanDeclared: boolean;
  /** Changes outside the blocks the AI said it would touch. */
  outsideTargets: string[];
  /** Changes to text the person wrote since the AI's last version. */
  touchedHumanEdits: string[];
  /** Plain-language warnings for the reviewer. Empty when everything lines up. */
  warnings: string[];
}

/** The scope the diff really has. */
export function actualScope(diff: DocDiff): ChangeScope {
  const real = diff.changes.filter((c) => !(c.kind === "modified" && c.markupOnly));
  const size = Math.max(diff.oldUnitCount, diff.newUnitCount, 1);

  if (real.length / size > WHOLE_THRESHOLD) return "whole";
  if (diff.css.changed) return "layout";
  return real.some((c) => c.kind !== "modified") ? "section" : "text";
}

/** Text the person wrote or changed between the AI's version and the current one. */
export function humanEditsBetween(aiHtml: string, currentHtml: string): string[] {
  return diffDocuments(aiHtml, currentHtml)
    .changes.flatMap((c) => (c.kind === "modified" ? [c.newText] : c.kind === "added" ? [c.text] : []))
    .filter(Boolean);
}

/** Compares what the AI said it did with what the diff shows. */
export function checkScope(diff: DocDiff, result: Pick<AiDocument, "scope" | "targets">, humanEdits: string[] = []): ScopeReport {
  const actual = actualScope(diff);
  const broaderThanDeclared = RANK[actual] > RANK[result.scope];
  const outsideTargets = changesOutsideTargets(diff, result.targets);
  const touchedHumanEdits = changesToHumanText(diff, humanEdits);

  const warnings = [
    broaderThanDeclared && `The AI described this as a ${result.scope} change, but it actually changed the ${describe(actual)}.`,
    outsideTargets.length > 0 && `${plural(outsideTargets.length, "change")} outside the parts the AI said it would edit.`,
    touchedHumanEdits.length > 0 && `${plural(touchedHumanEdits.length, "change")} to text you edited yourself.`,
  ].filter((w): w is string => Boolean(w));

  return { declared: result.scope, actual, broaderThanDeclared, outsideTargets, touchedHumanEdits, warnings };
}

function changesOutsideTargets(diff: DocDiff, targets: string[] | undefined): string[] {
  const wanted = new Set(targets ?? []);
  if (wanted.size === 0) return [];
  return diff.changes
    .filter((c) => !(c.kind === "modified" && c.markupOnly))
    .filter((c) => !c.blockId || !wanted.has(c.blockId))
    .map((c) => c.id);
}

function changesToHumanText(diff: DocDiff, humanEdits: string[]): string[] {
  return diff.changes
    .filter((c) => {
      const before = previousText(c);
      return before !== undefined && humanEdits.some((edit) => similarity(edit, before) > HUMAN_TEXT_MATCH);
    })
    .map((c) => c.id);
}

function previousText(change: Change): string | undefined {
  if (change.kind === "modified") return change.oldText;
  return change.kind === "removed" ? change.text : undefined;
}

const SCOPE_WORDS: Record<ChangeScope, string> = {
  text: "wording",
  section: "structure (added, removed or moved content)",
  layout: "styling and layout",
  whole: "whole document",
};

const describe = (scope: ChangeScope) => SCOPE_WORDS[scope];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
