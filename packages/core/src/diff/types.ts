/** One piece of a word diff: text that stayed, was inserted, or was deleted. */
export type WordOp = { op: "equal" | "insert" | "delete"; text: string };

/** A text element or an image, as the diff sees it. */
export interface Unit {
  index: number;
  el: Element;
  tag: string;
  text: string;
  /** The unit's markup with whitespace collapsed, to catch changes to attributes and inline content. */
  markup: string;
  blockId?: string;
}

interface ChangeBase {
  id: string;
  blockId?: string;
}

export type Change =
  | (ChangeBase & {
      kind: "modified";
      oldIndex: number;
      newIndex: number;
      oldText: string;
      newText: string;
      words: WordOp[];
      /** Same text, different markup: a class, a style, a link. */
      markupOnly: boolean;
    })
  | (ChangeBase & { kind: "added"; newIndex: number; text: string })
  | (ChangeBase & { kind: "removed"; oldIndex: number; text: string })
  | (ChangeBase & { kind: "moved"; oldIndex: number; newIndex: number; text: string });

export type ChangeKind = Change["kind"];

export interface CssDiff {
  changed: boolean;
  /** Top-level rules present only in the new version. */
  added: string[];
  /** Top-level rules present only in the old version. */
  removed: string[];
}

export interface DocDiff {
  changes: Change[];
  css: CssDiff;
  /** Every matched pair of units as [oldIndex, newIndex], unchanged ones included. */
  matches: Array<[number, number]>;
  oldUnitCount: number;
  newUnitCount: number;
  unchangedCount: number;
}
