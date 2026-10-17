import { readUnits, type DocDiff, type Unit } from "../diff";

/** Both versions of a document, parsed, with the units of each matched up. */
export interface Parsed {
  oldRoot: HTMLElement;
  newRoot: HTMLElement;
  oldUnits: Unit[];
  newUnits: Unit[];
  /** An old unit's index to the new element it became. */
  oldToNew: Map<number, Element>;
}

export function parseBoth(beforeHtml: string, afterHtml: string, diff: DocDiff): Parsed {
  const before = readUnits(beforeHtml);
  const after = readUnits(afterHtml);
  const oldToNew = new Map<number, Element>();
  for (const [i, j] of diff.matches) {
    const el = after.units[j]?.el;
    if (el) oldToNew.set(i, el);
  }
  return { oldRoot: before.root, newRoot: after.root, oldUnits: before.units, newUnits: after.units, oldToNew };
}

/** The old units inside `el`, in order. */
export function unitsWithin(el: Element, p: Parsed): Unit[] {
  return p.oldUnits.filter((u) => el === u.el || el.contains(u.el));
}

/**
 * The largest piece of the old document that disappeared together with this
 * unit: it climbs while the parent holds no unit that survived. A deleted
 * section comes back as the section, not as loose paragraphs.
 */
export function removedRoot(unit: Unit, p: Parsed): Element {
  const survived = (el: Element) => p.oldUnits.some((u) => p.oldToNew.has(u.index) && el.contains(u.el));
  let top: Element = unit.el;
  for (let parent = top.parentElement; parent && parent !== p.oldRoot; parent = parent.parentElement) {
    if (survived(parent)) break;
    top = parent;
  }
  return top;
}
