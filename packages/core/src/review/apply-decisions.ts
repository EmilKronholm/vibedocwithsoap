import type { Change, DocDiff } from "../diff";
import { removedRoot, parseBoth, unitsWithin, type Parsed } from "./parsed";
import { placeRemoved } from "./placement";

export interface ReviewDecisions {
  /** Ids of changes to undo. Everything else is kept. */
  rejected: Iterable<string>;
  /** Restore the old style sheets. */
  rejectCss?: boolean;
}

type Removal = Extract<Change, { kind: "removed" | "moved" }>;

/** The document the reviewer ends up with: the new version, with every rejected change undone. */
export function applyDecisions(beforeHtml: string, afterHtml: string, diff: DocDiff, decisions: ReviewDecisions): string {
  const rejected = new Set(decisions.rejected);
  const p = parseBoth(beforeHtml, afterHtml, diff);

  const removals = undoInPlace(p, diff, rejected);
  restoreRemovals(p, diff, rejected, removals);
  if (decisions.rejectCss) restoreStyles(p);
  return p.newRoot.innerHTML;
}

// Edits and additions are undone where they stand. Removals and moves are collected for the next step.
function undoInPlace(p: Parsed, diff: DocDiff, rejected: Set<string>): Removal[] {
  const removals: Removal[] = [];
  for (const change of diff.changes) {
    if (!rejected.has(change.id)) continue;
    if (change.kind === "removed" || change.kind === "moved") removals.push(change);
    else if (change.kind === "modified") revertEdit(p, change);
    else removeAndPrune(p.newUnits[change.newIndex]?.el, p.newRoot);
  }
  return removals;
}

function revertEdit(p: Parsed, change: Extract<Change, { kind: "modified" }>): void {
  const target = p.newUnits[change.newIndex]?.el;
  const source = p.oldUnits[change.oldIndex]?.el;
  if (target && source) target.replaceWith(source.cloneNode(true));
}

// Content goes back in old-document order, so each piece can anchor on the one restored before it.
function restoreRemovals(p: Parsed, diff: DocDiff, rejected: Set<string>, removals: Removal[]): void {
  const restored = new Map<Element, Element>();
  const handled = new Set<Element>();

  for (const change of [...removals].sort((x, y) => x.oldIndex - y.oldIndex)) {
    const unit = p.oldUnits[change.oldIndex];
    if (!unit) continue;
    if (change.kind === "moved") restoreMoved(p, change, unit.el, restored);
    else restoreRemoved(p, diff, rejected, unit, restored, handled);
  }
}

function restoreMoved(p: Parsed, change: Extract<Removal, { kind: "moved" }>, oldEl: Element, restored: Map<Element, Element>): void {
  removeAndPrune(p.newUnits[change.newIndex]?.el, p.newRoot);
  p.oldToNew.delete(change.oldIndex);
  const clone = oldEl.cloneNode(true) as Element;
  placeRemoved(oldEl, p, restored)(clone);
  restored.set(oldEl, clone);
  p.oldToNew.set(change.oldIndex, clone);
}

// A removed section comes back whole, but only if every removal in it was rejected; otherwise unit by unit.
function restoreRemoved(
  p: Parsed,
  diff: DocDiff,
  rejected: Set<string>,
  unit: Parsed["oldUnits"][number],
  restored: Map<Element, Element>,
  handled: Set<Element>,
): void {
  const top = removedRoot(unit, p);
  const allRejected = unitsWithin(top, p).every((u) => {
    const removal = diff.changes.find((c) => c.kind === "removed" && c.oldIndex === u.index);
    return removal && rejected.has(removal.id);
  });
  const el = allRejected ? top : unit.el;
  if (handled.has(el)) return;
  handled.add(el);

  const clone = el.cloneNode(true) as Element;
  placeRemoved(el, p, restored)(clone);
  restored.set(el, clone);
}

function restoreStyles(p: Parsed): void {
  for (const style of Array.from(p.newRoot.querySelectorAll("style"))) style.remove();
  p.newRoot.prepend(...Array.from(p.oldRoot.querySelectorAll("style"), (s) => s.cloneNode(true)));
}

/** Removes `el`, then any ancestor left with nothing in it. */
function removeAndPrune(el: Element | undefined, root: Element): void {
  if (!el) return;
  let parent = el.parentElement;
  el.remove();
  while (parent && parent !== root && parent.children.length === 0 && !(parent.textContent ?? "").trim()) {
    const next: HTMLElement | null = parent.parentElement;
    parent.remove();
    parent = next;
  }
}
