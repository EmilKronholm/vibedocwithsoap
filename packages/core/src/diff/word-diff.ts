import { lcsPairs } from "./lcs";
import type { WordOp } from "./types";

// Beyond this the table gets too large; treat the whole text as replaced.
const MAX_CELLS = 4_000_000;

/** Words and the whitespace between them, as separate tokens. */
const tokenize = (text: string): string[] => text.match(/\s+|[^\s]+/g) ?? [];

/** What changed inside a paragraph, word by word. */
export function diffWords(before: string, after: string): WordOp[] {
  if (before === after) return before ? [{ op: "equal", text: before }] : [];

  const a = tokenize(before);
  const b = tokenize(after);
  if (a.length * b.length > MAX_CELLS) {
    return [
      { op: "delete", text: before },
      { op: "insert", text: after },
    ];
  }
  return opsFromPairs(a, b, lcsPairs(a, b));
}

function opsFromPairs(a: string[], b: string[], pairs: Array<[number, number]>): WordOp[] {
  const ops: WordOp[] = [];
  const push = (op: WordOp["op"], text: string) => {
    const last = ops[ops.length - 1];
    if (last && last.op === op) last.text += text;
    else ops.push({ op, text });
  };

  let i = 0;
  let j = 0;
  for (const [matchA, matchB] of pairs) {
    while (i < matchA) push("delete", a[i++]);
    while (j < matchB) push("insert", b[j++]);
    push("equal", a[i++]);
    j++;
  }
  while (i < a.length) push("delete", a[i++]);
  while (j < b.length) push("insert", b[j++]);
  return ops;
}

/** How alike two texts are, from 0 to 1, by the words they share. Order is ignored. */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const wordsA = words(a);
  const wordsB = words(b);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const w of wordsA) counts.set(w, (counts.get(w) ?? 0) + 1);

  let shared = 0;
  for (const w of wordsB) {
    const left = counts.get(w);
    if (!left) continue;
    shared++;
    counts.set(w, left - 1);
  }
  return (2 * shared) / (wordsA.length + wordsB.length);
}

const words = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);
