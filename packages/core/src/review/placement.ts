import { unitsWithin, type Parsed } from "./parsed";

/** Puts a node into the new document. */
export type Placer = (node: Element) => void;

/**
 * Where to put old content back in the new document. It goes next to the
 * nearest old neighbour that survived, so it lands where it used to be even
 * though the element it lived in may no longer exist. `placed` holds old
 * elements already put back, so a run of removals keeps its order.
 */
export function placeRemoved(oldEl: Element, p: Parsed, placed: Map<Element, Element>): Placer {
  return byOldSiblings(oldEl, p, placed) ?? byUnitOrder(oldEl, p);
}

function byOldSiblings(oldEl: Element, p: Parsed, placed: Map<Element, Element>): Placer | null {
  const siblings = oldEl.parentElement ? Array.from(oldEl.parentElement.children) : [];
  const at = siblings.indexOf(oldEl);

  for (let k = at - 1; k >= 0; k--) {
    const target = counterpart(siblings[k], "last", p, placed);
    if (target) return (node) => target.after(node);
  }
  for (let k = at + 1; k < siblings.length; k++) {
    const target = counterpart(siblings[k], "first", p, placed);
    if (target) return (node) => target.before(node);
  }
  return null;
}

/**
 * The new element that plays the role of old sibling `el`. A unit maps
 * directly. A container is found by taking one of its surviving units and
 * climbing as many levels in the new document as it sat below `el` in the old.
 */
function counterpart(el: Element, side: "first" | "last", p: Parsed, placed: Map<Element, Element>): Element | undefined {
  if (placed.has(el)) return placed.get(el);

  const survivors = unitsWithin(el, p).filter((u) => p.oldToNew.has(u.index));
  const unit = side === "first" ? survivors[0] : survivors[survivors.length - 1];
  if (!unit) return undefined;

  let depth = 0;
  for (let node: Element | null = unit.el; node && node !== el; node = node.parentElement) depth++;

  let target: Element | null | undefined = p.oldToNew.get(unit.index);
  for (let k = 0; k < depth && target; k++) target = target.parentElement;
  return target && target !== p.newRoot && p.newRoot.contains(target) ? target : undefined;
}

// No usable sibling: anchor on the nearest surviving unit in reading order.
function byUnitOrder(oldEl: Element, p: Parsed): Placer {
  const first = unitsWithin(oldEl, p)[0];
  const index = first ? first.index : 0;

  for (let i = index - 1; i >= 0; i--) {
    const el = p.oldToNew.get(i);
    if (el) return (node) => el.after(node);
  }
  for (let i = index + 1; i < p.oldUnits.length; i++) {
    const el = p.oldToNew.get(i);
    if (el) return (node) => el.before(node);
  }
  return (node) => p.newRoot.append(node);
}
