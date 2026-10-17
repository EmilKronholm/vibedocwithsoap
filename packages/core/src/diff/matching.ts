import { lcsPairs } from "./lcs";
import type { Change, Unit } from "./types";
import { diffWords, similarity } from "./word-diff";

/** Below this, two paragraphs are a removal and an addition, not an edit. */
const PAIR_THRESHOLD = 0.35;

type Pair = [number, number];

/** The working state while two lists of units are matched up. */
export class Matching {
  readonly changes: Change[] = [];
  readonly matchedOld = new Set<number>();
  readonly matchedNew = new Set<number>();
  anchors: Pair[] = [];
  unchanged = 0;
  #nextId = 0;

  constructor(
    readonly oldUnits: Unit[],
    readonly newUnits: Unit[],
  ) {}

  id(): string {
    return `c${this.#nextId++}`;
  }

  match(i: number, j: number): void {
    this.matchedOld.add(i);
    this.matchedNew.add(j);
  }

  modified(i: number, j: number, markupOnly: boolean): void {
    const [before, after] = [this.oldUnits[i], this.newUnits[j]];
    this.changes.push({
      id: this.id(),
      kind: "modified",
      oldIndex: i,
      newIndex: j,
      oldText: before.text,
      newText: after.text,
      words: diffWords(before.text, after.text),
      markupOnly,
      blockId: after.blockId,
    });
  }
}

/**
 * Pass 1: units with identical text, in the same order. If only their markup
 * differs, that is a formatting change.
 */
export function matchIdentical(m: Matching): void {
  m.anchors = lcsPairs(m.oldUnits.map((u) => u.text), m.newUnits.map((u) => u.text));
  for (const [i, j] of m.anchors) {
    m.match(i, j);
    if (m.oldUnits[i].markup === m.newUnits[j].markup) m.unchanged++;
    else m.modified(i, j, true);
  }
}

/** Pass 2: between the anchors, pair up units whose text is alike: those are edits. */
export function matchSimilar(m: Matching): void {
  const bounds: Pair[] = [[-1, -1], ...m.anchors, [m.oldUnits.length, m.newUnits.length]];
  for (let k = 0; k < bounds.length - 1; k++) {
    const oldGap = range(bounds[k][0] + 1, bounds[k + 1][0]);
    const newGap = range(bounds[k][1] + 1, bounds[k + 1][1]);
    if (oldGap.length > 0 && newGap.length > 0) pairGap(m, oldGap, newGap);
  }
}

const range = (from: number, to: number): number[] => Array.from({ length: Math.max(0, to - from) }, (_, n) => from + n);

function pairGap(m: Matching, oldGap: number[], newGap: number[]): void {
  const candidates = oldGap
    .flatMap((i) => newGap.map((j) => ({ i, j, score: score(m.oldUnits[i], m.newUnits[j]) })))
    .filter((c) => c.score >= PAIR_THRESHOLD)
    .sort((x, y) => y.score - x.score);

  for (const { i, j } of candidates) {
    if (m.matchedOld.has(i) || m.matchedNew.has(j)) continue;
    m.match(i, j);
    m.modified(i, j, false);
  }
}

// The same tag counts for a little, so a heading prefers a heading.
const score = (a: Unit, b: Unit) => similarity(a.text, b.text) + (a.tag === b.tag ? 0.05 : 0);

/** Pass 3: what is left with identical text on both sides moved; the rest was removed or added. */
export function matchLeftovers(m: Matching): void {
  const leftover = leftoverByText(m);
  for (const unit of m.oldUnits) {
    if (m.matchedOld.has(unit.index)) continue;
    const j = leftover.get(unit.text)?.shift();
    if (j === undefined) {
      m.changes.push({ id: m.id(), kind: "removed", oldIndex: unit.index, text: unit.text, blockId: unit.blockId });
    } else {
      m.match(unit.index, j);
      m.changes.push({ id: m.id(), kind: "moved", oldIndex: unit.index, newIndex: j, text: unit.text, blockId: m.newUnits[j].blockId });
    }
  }
  for (const unit of m.newUnits) {
    if (!m.matchedNew.has(unit.index)) m.changes.push({ id: m.id(), kind: "added", newIndex: unit.index, text: unit.text, blockId: unit.blockId });
  }
}

function leftoverByText(m: Matching): Map<string, number[]> {
  const byText = new Map<string, number[]>();
  for (const unit of m.newUnits) {
    if (m.matchedNew.has(unit.index)) continue;
    byText.set(unit.text, [...(byText.get(unit.text) ?? []), unit.index]);
  }
  return byText;
}
