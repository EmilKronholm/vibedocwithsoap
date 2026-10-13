/**
 * The presentation: a piece of the DOM that shows a document.
 *
 * It receives HTML as a string, puts it on the page, and makes the text
 * elements editable as plain text. That is all it does. It decides nothing:
 * every raw browser event inside it is passed on, untouched, to whoever
 * listens (the presentation adapter), and nothing here changes the document.
 *
 * Not sanitised yet. The HTML is put on the page as given, so only give it
 * HTML you trust until the editing layer in front of it exists.
 */

/**
 * Which elements a person can edit. Each becomes its own plain-text editor.
 * For now a fixed list; later this will come from somewhere smarter.
 */
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
]);

/**
 * The raw browser events we pass on. These are the ones that matter for
 * editing; the adapter turns each into a custom event of the same name.
 * `selectionchange` is special: the browser fires it on the document, not on
 * the element, so it is forwarded only when the selection is inside here.
 */
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

const EDITABLE_SELECTOR = Array.from(EDITABLE_TAGS, (tag) => tag.toLowerCase()).join(", ");

export type RawEventListener = (event: Event) => void;

export class Presentation {
  readonly root: HTMLElement;

  /**
   * False when this browser can't do plain-text-only editing. Those elements
   * are then left read-only instead of falling back to rich text, which would
   * let formatting and pasted markup in.
   */
  plaintextOnlySupported = true;

  readonly #listeners = new Set<RawEventListener>();
  readonly #cleanups: Array<() => void> = [];

  constructor(root: HTMLElement) {
    this.root = root;

    for (const name of RAW_EVENTS) {
      if (name === "selectionchange") continue;
      const forward = (event: Event) => this.#emit(event);
      // Capture, so we see the event before anything inside the document can stop it.
      root.addEventListener(name, forward, true);
      this.#cleanups.push(() => root.removeEventListener(name, forward, true));
    }

    const doc = root.ownerDocument;
    const selection = (event: Event) => {
      const anchor = doc.getSelection()?.anchorNode;
      if (anchor && root.contains(anchor)) this.#emit(event);
    };
    doc.addEventListener("selectionchange", selection);
    this.#cleanups.push(() => doc.removeEventListener("selectionchange", selection));
  }

  /** Puts the HTML on the page and makes its text elements editable. Replaces what was there. */
  setHtml(html: string): void {
    // A template parses the string without running or loading anything yet.
    const template = this.root.ownerDocument.createElement("template");
    template.innerHTML = html;
    this.root.replaceChildren(template.content);
    this.#makeEditable();
  }

  /** The editable element that contains `node`, or null if it is outside any. */
  unitOf(node: EventTarget | Node | null): HTMLElement | null {
    const element = node instanceof Element ? node : node instanceof Node ? node.parentElement : null;
    const unit = element?.closest<HTMLElement>(EDITABLE_SELECTOR) ?? null;
    return unit && this.root.contains(unit) ? unit : null;
  }

  /** Calls `listener` for every raw event. Returns a function that stops it. */
  listen(listener: RawEventListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /** Stops listening to the browser. The presentation can't be used afterwards. */
  destroy(): void {
    for (const cleanup of this.#cleanups) cleanup();
    this.#cleanups.length = 0;
    this.#listeners.clear();
  }

  #emit(event: Event): void {
    for (const listener of this.#listeners) listener(event);
  }

  #makeEditable(): void {
    for (const element of Array.from(this.root.querySelectorAll<HTMLElement>(EDITABLE_SELECTOR))) {
      // Set as an attribute: assigning the property throws in browsers that don't know the value.
      element.setAttribute("contenteditable", "plaintext-only");
      if (element.contentEditable !== "plaintext-only") {
        element.removeAttribute("contenteditable");
        this.plaintextOnlySupported = false;
      }
    }
  }
}
