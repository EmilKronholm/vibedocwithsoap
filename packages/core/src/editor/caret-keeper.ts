import { pathOfStamped, type ElementPath } from "../dom";
import { caretOffset, placeCaret, type Presentation } from "../presentation";

interface SavedCaret {
  path: ElementPath;
  offset: number;
}

/** Remembers where the caret is, so a render that replaces the page does not lose it. */
export function saveCaret(presentation: Presentation): SavedCaret | null {
  const selection = presentation.root.ownerDocument.getSelection();
  const unit = presentation.unitOf(selection?.anchorNode ?? null);
  const path = unit ? pathOfStamped(unit) : null;
  const offset = unit ? caretOffset(unit) : null;
  return path && offset !== null ? { path, offset } : null;
}

export function restoreCaret(presentation: Presentation, saved: SavedCaret | null): void {
  if (!saved) return;
  const unit = presentation.byPath(saved.path);
  if (unit && presentation.unitOf(unit)) placeCaret(unit, saved.offset);
}
