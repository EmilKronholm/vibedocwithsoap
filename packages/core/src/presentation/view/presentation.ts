/** Elements a person can edit. Each becomes its own plain-text editor. */
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

const EDITABLE_SELECTOR = Array.from(EDITABLE_TAGS, (tag) => tag.toLowerCase()).join(", ");

export type RawEventListener = (event: Event) => void;

/**
 * Shows an HTML string and reports every raw browser event inside it.
 * It decides nothing and never changes the document.
 *
 * The HTML is not sanitised here: give it only HTML you trust.
 */
export class Presentation {
  readonly root: HTMLElement;

  /** False when the browser cannot edit as plain text. Those elements are left read-only instead of allowing rich text. */
  plaintextOnlySupported = true;

  readonly #listeners = new Set<RawEventListener>();
  readonly #cleanups: Array<() => void> = [];

  constructor(root: HTMLElement) {
    this.root = root;

    for (const name of RAW_EVENTS) {
      if (name === "selectionchange") continue;
      const forward = (event: Event) => this.#emit(event);
      // Capture: see the event before anything inside the document can stop it.
      root.addEventListener(name, forward, true);
      this.#cleanups.push(() => root.removeEventListener(name, forward, true));
    }

    // selectionchange fires on the document, not on the element.
    const doc = root.ownerDocument;
    const selection = (event: Event) => {
      const anchor = doc.getSelection()?.anchorNode;
      if (anchor && root.contains(anchor)) this.#emit(event);
    };
    doc.addEventListener("selectionchange", selection);
    this.#cleanups.push(() => doc.removeEventListener("selectionchange", selection));
  }

  /** Replaces what is shown with `html` and makes its text elements editable. */
  setHtml(html: string): void {
    // A template parses without a parent element, so a top-level <tr> or <li> is kept.
    const template = this.root.ownerDocument.createElement("template");
    template.innerHTML = html;
    this.root.replaceChildren(template.content);
    this.#makeEditable();
  }

  /** The editable element containing `node`, or null if there is none inside the presentation. */
  unitOf(node: EventTarget | Node | null): HTMLElement | null {
    const element = node instanceof Element ? node : node instanceof Node ? node.parentElement : null;
    const unit = element?.closest<HTMLElement>(EDITABLE_SELECTOR) ?? null;
    // closest() climbs past the root, so an editable ancestor outside it must not count.
    return unit && this.root.contains(unit) ? unit : null;
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

  #makeEditable(): void {
    for (const element of Array.from(this.root.querySelectorAll<HTMLElement>(EDITABLE_SELECTOR))) {
      // setAttribute, not the property: the property throws in browsers that do not know the value.
      element.setAttribute("contenteditable", "plaintext-only");
      if (element.contentEditable !== "plaintext-only") {
        element.removeAttribute("contenteditable");
        this.plaintextOnlySupported = false;
      }
    }
  }
}
