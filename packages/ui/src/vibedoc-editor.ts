import { createEditor, type AiProvider, type DocumentRules, type DocumentSnapshot, type Editor, type EditorEvents } from "@vibedocwithsoap/core";

/** The events the element dispatches, named after the editor's own, with the same arguments as `detail`. */
export interface VibedocElementEventMap {
  "vibedoc-state": CustomEvent<{ state: EditorEvents["state"][0]; previous: EditorEvents["state"][1] }>;
  "vibedoc-status": CustomEvent<{ status: EditorEvents["status"][0] }>;
  "vibedoc-review": CustomEvent<{ review: EditorEvents["review"][0] }>;
  "vibedoc-notice": CustomEvent<{ notice: EditorEvents["notice"][0] }>;
  "vibedoc-selection": CustomEvent<{ path: EditorEvents["selection"][0] }>;
}

/** Lets the editor exist in browsers and at import time on a server, where `HTMLElement` is missing. */
const Base: typeof HTMLElement = typeof HTMLElement === "undefined" ? (class {} as typeof HTMLElement) : HTMLElement;

/**
 * `<vibedoc-editor>`: a document editor as an HTML element. It draws into itself,
 * so the page's own CSS can style what is around the paper. Everything else
 * (toolbar, chat, panels) is the host's: use `element.editor` to drive it.
 *
 * Set `html`, `rules`, `ai` or `snapshot` before or after it is connected, and
 * listen for `vibedoc-*` events.
 */
export class VibedocEditorElement extends Base {
  #editor: Editor | null = null;
  #html = "";
  #rules: DocumentRules | undefined;
  #ai: AiProvider | null = null;
  #snapshot: DocumentSnapshot | undefined;

  /** The editor inside, once the element is connected. Null before. */
  get editor(): Editor | null {
    return this.#editor;
  }

  /** The document to start with. Setting it later replaces the document through the rules, as a person's change. */
  set html(html: string) {
    this.#html = html;
    this.#editor?.dispatch({ kind: "replaceAll", html });
  }

  get html(): string {
    return this.#editor?.state.html ?? this.#html;
  }

  set rules(rules: DocumentRules | undefined) {
    this.#rules = rules;
    if (this.#editor) this.#editor.rules = rules;
  }

  get rules(): DocumentRules | undefined {
    return this.#editor?.rules ?? this.#rules;
  }

  /** How the editor reaches the AI. See `httpProvider` in `@vibedocwithsoap/core`. */
  set ai(provider: AiProvider | null) {
    this.#ai = provider;
    if (this.#editor) this.#editor.ai = provider;
  }

  get ai(): AiProvider | null {
    return this.#ai;
  }

  /** A saved document to open. It is read when the element connects; setting it later starts a new editor. */
  set snapshot(snapshot: DocumentSnapshot | undefined) {
    this.#snapshot = snapshot;
    if (this.#editor) this.#restart();
  }

  connectedCallback(): void {
    if (!this.#editor) this.#start();
  }

  disconnectedCallback(): void {
    this.#stop();
  }

  #start(): void {
    const editor = createEditor({ container: this, html: this.#html, snapshot: this.#snapshot, rules: this.#rules });
    editor.ai = this.#ai;
    this.#editor = editor;
    this.#forward(editor);
  }

  #stop(): void {
    this.#editor?.destroy();
    this.#editor = null;
  }

  #restart(): void {
    this.#stop();
    this.replaceChildren();
    this.#start();
  }

  #forward(editor: Editor): void {
    const send = <K extends keyof VibedocElementEventMap>(name: K, detail: VibedocElementEventMap[K]["detail"]) =>
      this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));

    editor.on("state", (state, previous) => send("vibedoc-state", { state, previous }));
    editor.on("status", (status) => send("vibedoc-status", { status }));
    editor.on("review", (review) => send("vibedoc-review", { review }));
    editor.on("notice", (notice) => send("vibedoc-notice", { notice }));
    editor.on("selection", (path) => send("vibedoc-selection", { path }));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "vibedoc-editor": VibedocEditorElement;
  }
  interface HTMLElementEventMap extends VibedocElementEventMap {}
}
