import { isFailure, type Caret, type Command, type EditResult } from "../commands";
import type { ElementPath } from "../dom";
import type { EditingCore, EditorStatus } from "../editing";
import type { Actor, DocumentState, Version } from "../model";
import { InputTranslator, PresentationAdapter, placeCaret, type Presentation } from "../presentation";
import type { DocumentRules } from "../rules";
import { EventBus } from "../util/event-bus";
import { restoreCaret, saveCaret } from "./caret-keeper";
import type { EditorEventName, EditorEvents } from "./events";
import { describeElement, type ElementInfo } from "./inspect";
import { FlowRenderer, type RenderOrigin, type Renderer } from "./renderer";

export type RendererFactory = (presentation: Presentation) => Renderer;

/**
 * A document editor on a page: the editing core, the browser page it is shown
 * on, and the wiring between them. Everything around the page (toolbar, chat,
 * panels) is up to the host, which talks to this object.
 */
export class Editor {
  readonly #core: EditingCore;
  readonly #adapter: PresentationAdapter;
  readonly #renderer: Renderer;
  readonly #translator: InputTranslator;
  readonly #events = new EventBus<EditorEvents>();
  readonly #cleanups: Array<() => void> = [];
  #origin: RenderOrigin = "other";
  /** The render still under way, if the renderer is asynchronous. */
  #rendering: Promise<void> | null = null;

  constructor(core: EditingCore, container: HTMLElement, rendererFactory?: RendererFactory) {
    this.#core = core;
    this.#adapter = new PresentationAdapter(container);
    const presentation = this.#adapter.presentation;
    this.#renderer = rendererFactory?.(presentation) ?? new FlowRenderer(presentation);
    this.#translator = new InputTranslator(this.#adapter, (command, origin) => this.#run(command, "human", origin ?? "other"));

    this.#cleanups.push(
      this.#translator.selection.onChange((path) => this.#events.emit("selection", path)),
      core.model.subscribe((state, previous) => this.#onState(state, previous)),
      core.status.onChange((status) => this.#onStatus(status)),
      core.onNotice((notice) => this.#events.emit("notice", notice)),
    );
    this.#render(core.model.get());
  }

  get state(): DocumentState {
    return this.#core.model.get();
  }

  get status(): EditorStatus {
    return this.#core.status.current;
  }

  get canUndo(): boolean {
    return this.#core.canUndo;
  }

  get canRedo(): boolean {
    return this.#core.canRedo;
  }

  get versions(): readonly Version[] {
    return this.#core.versions;
  }

  get rules(): DocumentRules | undefined {
    return this.#core.rules;
  }

  set rules(rules: DocumentRules | undefined) {
    this.#core.rules = rules;
  }

  /** The element the person last clicked or typed in. */
  get selection(): ElementPath | null {
    return this.#translator.selection.path;
  }

  /** False when this browser cannot edit as plain text; the document is then read-only. */
  get plaintextOnlySupported(): boolean {
    return this.#adapter.presentation.plaintextOnlySupported;
  }

  /** The page the document is shown on, for hosts that draw around it. */
  get presentation(): Presentation {
    return this.#adapter.presentation;
  }

  /** Runs a command as `actor` (a person unless said otherwise). The result says whether it worked and why not. */
  dispatch(command: Command, actor: Actor = "human"): EditResult {
    this.#translator.text.flush();
    return this.#run(command, actor, "other");
  }

  /** Describes the selected element for a style panel, or null if nothing is selected. */
  describeSelection(): ElementInfo | null {
    const path = this.selection;
    const el = path ? this.#adapter.presentation.byPath(path) : null;
    return path && el ? describeElement(el, path) : null;
  }

  /** Puts the caret in the element at `path`. */
  focus(path: ElementPath): void {
    this.#adapter.presentation.byPath(path)?.focus();
  }

  on<K extends EditorEventName>(name: K, listener: (...args: EditorEvents[K]) => void): () => void {
    return this.#events.on(name, listener);
  }

  destroy(): void {
    this.#cleanups.forEach((cleanup) => cleanup());
    this.#translator.destroy();
    this.#renderer.destroy();
    this.#adapter.destroy();
    this.#events.clear();
  }

  #run(command: Command, actor: Actor, origin: RenderOrigin): EditResult {
    this.#origin = origin;
    let result: EditResult;
    try {
      result = this.#core.dispatch(command, actor);
    } finally {
      this.#origin = "other";
    }
    if (!isFailure(result) && result.focus) this.#afterRender(() => this.#placeCaret(result.focus!));
    return result;
  }

  #onState(state: DocumentState, previous: DocumentState): void {
    this.#events.emit("state", state, previous);
    this.#render(state);
  }

  #onStatus(status: EditorStatus): void {
    this.#adapter.presentation.setLocked(status !== "idle");
    this.#events.emit("status", status);
  }

  // The caret is saved before the page is replaced and put back after, so a render never costs the person their place.
  #render(state: DocumentState): void {
    const presentation = this.#adapter.presentation;
    const caret = saveCaret(presentation);
    const finish = () => {
      this.#rendering = null;
      presentation.setLocked(this.#core.status.current !== "idle");
      restoreCaret(presentation, caret);
      this.#dropMissingSelection();
    };

    const pending = this.#renderer.render({ state, origin: this.#origin });
    if (pending) this.#rendering = pending.then(finish);
    else finish();
  }

  // Run once the page shows the current state: now, or when an asynchronous render ends.
  #afterRender(action: () => void): void {
    if (this.#rendering) void this.#rendering.then(action);
    else action();
  }

  #placeCaret(caret: Caret): void {
    const el = this.#adapter.presentation.byPath(caret.path);
    if (el && this.#adapter.presentation.unitOf(el) === el) placeCaret(el, caret.offset);
  }

  // After a command removes or moves things, the remembered selection may point at nothing.
  #dropMissingSelection(): void {
    const path = this.#translator.selection.path;
    if (path && !this.#adapter.presentation.byPath(path)) this.#translator.selection.clear();
  }
}
