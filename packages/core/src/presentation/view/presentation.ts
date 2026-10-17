import { isTextUnit, parseHtml, pathKey, stampPaths, PATH_ATTR, type ElementPath } from "../../dom";
import { installUiStyles } from "./ui-styles";

/** Elements a person can edit, provided they hold only text. Each becomes its own plain-text editor. */
export const EDITABLE_TAGS: ReadonlySet<string> = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "LI",
  "TD",
  "TH",
  "BLOCKQUOTE",
  "FIGCAPTION",
  "DT",
  "DD",
  "SPAN",
  "DIV",
]);

/** Marks an editable element, whether or not the browser can edit it. */
export const UNIT_ATTR = "data-folio-unit";

/** Browser events forwarded to listeners. `selectionchange` is forwarded only when the selection is inside the presentation. */
export const RAW_EVENTS = [
  "beforeinput",
  "input",
  "keydown",
  "keyup",
  "paste",
  "cut",
  "copy",
  "compositionstart",
  "compositionupdate",
  "compositionend",
  "focusin",
  "focusout",
  "pointerdown",
  "pointerup",
  "click",
  "dblclick",
  "contextmenu",
  "dragstart",
  "drop",
  "selectionchange",
] as const;

export type RawEventName = (typeof RAW_EVENTS)[number];

export type RawEventListener = (event: Event) => void;

/**
 * Shows an HTML string and reports every raw browser event inside it.
 * It decides nothing and never changes the document.
 *
 * The HTML is not sanitised here: give it only HTML the editing layer has already cleaned.
 */
export class Presentation {
  readonly root: HTMLElement;

  /** False when the browser cannot edit as plain text. Those elements are left read-only instead of allowing rich text. */
  plaintextOnlySupported = true;

  readonly #listeners = new Set<RawEventListener>();
  readonly #cleanups: Array<() => void> = [];
  #locked = false;

  constructor(root: HTMLElement) {
    this.root = root;
    installUiStyles(root.ownerDocument);
    for (const name of RAW_EVENTS) if (name !== "selectionchange") this.#forward(root, name, true);
    this.#forwardSelectionChange();
  }

  /** Replaces what is shown with `html`. Every element gets its path, and text elements become editable. */
  setHtml(html: string): void {
    const parsed = parseHtml(html, this.root.ownerDocument);
    stampPaths(parsed);
    this.root.replaceChildren(...Array.from(parsed.childNodes));
    this.makeEditable(this.root);
  }

  /** Makes the text elements under `root` editable. Used for content put on the page by other means, such as pages. */
  makeEditable(root: Element): void {
    for (const element of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
      if (!EDITABLE_TAGS.has(element.tagName.toUpperCase()) || !isTextUnit(element)) continue;
      element.setAttribute(UNIT_ATTR, "");
      this.#applyEditable(element);
    }
  }

  #applyEditable(element: HTMLElement): void {
    if (this.#locked) {
      element.removeAttribute("contenteditable");
      return;
    }
    // setAttribute, not the property: the property throws in browsers that do not know the value.
    element.setAttribute("contenteditable", "plaintext-only");
    if (element.contentEditable !== "plaintext-only") {
      element.removeAttribute("contenteditable");
      this.plaintextOnlySupported = false;
    }
  }

  /** While locked, text elements cannot be typed into. Used while the AI works or a review is open. */
  setLocked(locked: boolean): void {
    this.#locked = locked;
    for (const unit of Array.from(this.root.querySelectorAll<HTMLElement>(`[${UNIT_ATTR}]`))) this.#applyEditable(unit);
  }

  /** The editable element containing `node`, or null if there is none inside the presentation. */
  unitOf(node: EventTarget | Node | null): HTMLElement | null {
    const element = node instanceof Element ? node : node instanceof Node ? node.parentElement : null;
    const unit = element?.closest<HTMLElement>(`[${UNIT_ATTR}]`) ?? null;
    // closest() climbs past the root, so an editable ancestor outside it must not count.
    return unit && this.root.contains(unit) ? unit : null;
  }

  /** The element showing the document element at `path`. */
  byPath(path: ElementPath): HTMLElement | null {
    return this.root.querySelector<HTMLElement>(`[${PATH_ATTR}="${pathKey(path)}"]`);
  }

  /** Calls `listener` for every raw event. Returns a function that stops it. */
  listen(listener: RawEventListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Removes every browser listener. Call when the presentation is discarded. */
  destroy(): void {
    for (const cleanup of this.#cleanups) cleanup();
    this.#cleanups.length = 0;
    this.#listeners.clear();
  }

  #emit(event: Event): void {
    for (const listener of this.#listeners) listener(event);
  }

  #forward(target: EventTarget, name: string, capture: boolean): void {
    const forward = (event: Event) => this.#emit(event);
    // Capture: see the event before anything inside the document can stop it.
    target.addEventListener(name, forward, capture);
    this.#cleanups.push(() => target.removeEventListener(name, forward, capture));
  }

  // selectionchange fires on the document, not on the element.
  #forwardSelectionChange(): void {
    const doc = this.root.ownerDocument;
    const onChange = (event: Event) => {
      const anchor = doc.getSelection()?.anchorNode;
      if (anchor && this.root.contains(anchor)) this.#emit(event);
    };
    doc.addEventListener("selectionchange", onChange);
    this.#cleanups.push(() => doc.removeEventListener("selectionchange", onChange));
  }
}
