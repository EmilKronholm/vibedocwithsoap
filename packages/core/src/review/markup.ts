import { collectUnits } from "../dom";
import type { Change, DocDiff, Unit } from "../diff";
import { CHANGE_ATTR, GHOST_ATTR, KIND_ATTR } from "./attrs";
import { parseBoth, removedRoot, unitsWithin, type Parsed } from "./parsed";
import { placeRemoved } from "./placement";
import { markWordDiff } from "./word-marks";

/**
 * The new document with its changes marked, for display while reviewing:
 * edited text as `<ins>` and `<del>`, new and moved units tagged, removed
 * content shown as a struck-through ghost where it used to be. Never stored.
 */
export function buildReviewHtml(beforeHtml: string, afterHtml: string, diff: DocDiff): string {
  const p = parseBoth(beforeHtml, afterHtml, diff);
  markPresent(p, diff);
  showRemoved(p, diff);
  return p.newRoot.innerHTML;
}

// Changes to things that still exist in the new document.
function markPresent(p: Parsed, diff: DocDiff): void {
  for (const change of diff.changes) {
    if (change.kind === "removed") continue;
    const el = p.newUnits[change.newIndex]?.el;
    if (!el) continue;

    el.setAttribute(CHANGE_ATTR, change.id);
    if (change.kind !== "modified") {
      el.setAttribute(KIND_ATTR, change.kind);
    } else {
      el.setAttribute(KIND_ATTR, change.markupOnly ? "restyled" : "modified");
      if (!change.markupOnly) markWordDiff(el, change.words, change.id);
    }
  }
}

type Removed = Extract<Change, { kind: "removed" }>;

function showRemoved(p: Parsed, diff: DocDiff): void {
  const placed = new Map<Element, Element>();
  const ghosts = new Map<Element, Element[]>();
  const removed = diff.changes.filter((c): c is Removed => c.kind === "removed").sort((x, y) => x.oldIndex - y.oldIndex);

  for (const change of removed) {
    const unit = p.oldUnits[change.oldIndex];
    if (unit) showOne(p, change, unit, placed, ghosts);
  }
}

function showOne(p: Parsed, change: Removed, unit: Unit, placed: Map<Element, Element>, ghosts: Map<Element, Element[]>): void {
  const top = removedRoot(unit, p);
  const indexInTop = unitsWithin(top, p).indexOf(unit);

  // Already shown as part of its section: only tag the unit inside the ghost.
  if (ghosts.has(top)) {
    ghosts.get(top)?.[indexInTop]?.setAttribute(CHANGE_ATTR, change.id);
    return;
  }

  const ghost = top.cloneNode(true) as Element;
  const holder = p.newRoot.ownerDocument.createElement("div");
  holder.append(ghost);
  // The units inside the ghost, found before the ghost is marked, in the same order as in the original.
  const inner = top === unit.el ? [ghost] : collectUnits(holder);
  ghosts.set(top, inner);

  ghost.setAttribute(GHOST_ATTR, "");
  ghost.setAttribute(KIND_ATTR, "removed");
  inner[indexInTop]?.setAttribute(CHANGE_ATTR, change.id);
  placeRemoved(top, p, placed)(ghost);
  placed.set(top, ghost);
}
