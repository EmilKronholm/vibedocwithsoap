import { isFailure, type EditResult } from "../../commands";
import { PARAGRAPH_TAGS, pathOfStamped, unitText, type ElementPath } from "../../dom";
import { caretOffset, placeCaret } from "./caret";
import type { PresentationAdapter, PresentationEvent } from "./presentation-adapter";
import type { CommandSink } from "./sink";

/** What the key handler needs to find an element on the page again after a command changed it. */
export interface ViewAccess {
  byPath(path: ElementPath): HTMLElement | null;
}

/**
 * Takes over the few keys where the browser's own behaviour would change the
 * document's structure behind our back: Enter, Backspace and Delete at the
 * edge of an element, and undo and redo.
 */
export class KeyHandler {
  constructor(
    adapter: PresentationAdapter,
    private readonly view: ViewAccess,
    private readonly sink: CommandSink,
    private readonly flushTyping: () => void,
  ) {
    adapter.on("keydown", (event) => this.#onKeyDown(event));
    adapter.on("beforeinput", (event) => this.#onBeforeInput(event));
  }

  #onKeyDown({ detail }: PresentationEvent): void {
    const event = detail.original as KeyboardEvent;
    // During composition (an input method) the browser must be left alone.
    if (event.isComposing) return;
    if (this.#undoRedo(event)) return;
    if (!detail.unit) return;

    if (event.key === "Enter") this.#enter(event, detail.unit);
    else if (event.key === "Backspace" || event.key === "Delete") this.#join(event, detail.unit);
  }

  // The browser's own undo menu would undo its text edits, not ours.
  #onBeforeInput({ detail }: PresentationEvent): void {
    const event = detail.original as InputEvent;
    if (event.inputType !== "historyUndo" && event.inputType !== "historyRedo") return;
    event.preventDefault();
    this.flushTyping();
    this.sink({ kind: event.inputType === "historyUndo" ? "undo" : "redo" });
  }

  #undoRedo(event: KeyboardEvent): boolean {
    if (!(event.ctrlKey || event.metaKey)) return false;
    const key = event.key.toLowerCase();
    if (key !== "z" && key !== "y") return false;

    event.preventDefault();
    this.flushTyping();
    const redo = key === "y" || event.shiftKey;
    this.#restoreCaret(this.sink({ kind: redo ? "redo" : "undo" }));
    return true;
  }

  #enter(event: KeyboardEvent, unit: HTMLElement): void {
    event.preventDefault();
    this.flushTyping();

    const startsElement = PARAGRAPH_TAGS.has(unit.tagName.toUpperCase()) && !event.shiftKey;
    const path = pathOfStamped(unit);
    const offset = caretOffset(unit);
    if (!startsElement || !path || offset === null) {
      unit.ownerDocument.execCommand("insertLineBreak");
      return;
    }
    this.#restoreCaret(this.sink({ kind: "splitUnit", path, offset }));
  }

  // Backspace at the very start, or Delete at the very end, joins with the neighbour.
  #join(event: KeyboardEvent, unit: HTMLElement): void {
    this.flushTyping();
    const offset = caretOffset(unit);
    const path = pathOfStamped(unit);
    if (offset === null || !path) return;

    const atStart = event.key === "Backspace" && offset === 0;
    const atEnd = event.key === "Delete" && offset === unitText(unit).length;
    if (!atStart && !atEnd) return;

    const result = this.sink({ kind: "mergeUnits", path, direction: atStart ? "previous" : "next" });
    // Nothing to join with: leave the key to the browser.
    if (isFailure(result)) return;
    event.preventDefault();
    this.#restoreCaret(result);
  }

  #restoreCaret(result: EditResult): void {
    if (isFailure(result) || !result.focus) return;
    const element = this.view.byPath(result.focus.path);
    if (element) placeCaret(element, result.focus.offset);
  }
}
