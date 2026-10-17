import { diffCss } from "./css-diff";
import { Matching, matchIdentical, matchLeftovers, matchSimilar } from "./matching";
import { readUnits } from "./read-units";
import type { Change, ChangeKind, DocDiff } from "./types";

/**
 * What an AI revision actually changed, whatever it says it did. The AI
 * rewrites the whole document, so nothing about an element's identity
 * survives reliably; units are matched by their text instead.
 */
export function diffDocuments(beforeHtml: string, afterHtml: string): DocDiff {
  const before = readUnits(beforeHtml);
  const after = readUnits(afterHtml);

  const matching = new Matching(before.units, after.units);
  matchIdentical(matching);
  matchSimilar(matching);
  matchLeftovers(matching);

  const changes = inReadingOrder(matching.changes, matching.anchors);
  return {
    changes,
    matches: matchedPairs(changes, matching.anchors),
    css: diffCss(before.css, after.css),
    oldUnitCount: before.units.length,
    newUnitCount: after.units.length,
    unchangedCount: matching.unchanged,
  };
}

// Changes sit in the order of the new document. A removal sits where it used to be.
function inReadingOrder(changes: Change[], anchors: Array<[number, number]>): Change[] {
  const position = (c: Change) => ("newIndex" in c ? c.newIndex : newPositionOfRemoved(c.oldIndex, anchors) - 0.5);
  return [...changes].sort((x, y) => position(x) - position(y));
}

/** The index in the new document that a removed unit sat just before. */
function newPositionOfRemoved(oldIndex: number, anchors: Array<[number, number]>): number {
  for (const [i, j] of anchors) if (i > oldIndex) return j;
  return Number.MAX_SAFE_INTEGER;
}

// Matches the review needs to find a unit's counterpart: the anchors, edits that changed text, and moves.
function matchedPairs(changes: Change[], anchors: Array<[number, number]>): Array<[number, number]> {
  const pairs = [...anchors];
  for (const c of changes) {
    if ((c.kind === "modified" && !c.markupOnly) || c.kind === "moved") pairs.push([c.oldIndex, c.newIndex]);
  }
  return pairs.sort((x, y) => x[0] - y[0]);
}

export function countChanges(diff: DocDiff): Record<ChangeKind, number> & { css: boolean } {
  const counts = { modified: 0, added: 0, removed: 0, moved: 0, css: diff.css.changed };
  for (const c of diff.changes) counts[c.kind]++;
  return counts;
}

export function isEmptyDiff(diff: DocDiff): boolean {
  return diff.changes.length === 0 && !diff.css.changed;
}
