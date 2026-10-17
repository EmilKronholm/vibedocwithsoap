import { EditingCore } from "../editing";
import { createState, type DocumentSnapshot, type PageSetup } from "../model";
import type { DocumentRules } from "../rules";
import { Editor, type RendererFactory } from "./editor";

export interface EditorOptions {
  /** The element the document is shown in. */
  container: HTMLElement;
  /** The document to start with. Cleaned under the rules before it is shown. */
  html?: string;
  page?: PageSetup;
  /** A saved document with its versions. Takes precedence over `html` and `page`. */
  snapshot?: DocumentSnapshot;
  rules?: DocumentRules;
  /** How the state is drawn. Defaults to one continuous flow. */
  renderer?: RendererFactory;
}

/** Creates an editor in `options.container`. */
export function createEditor(options: EditorOptions): Editor {
  const initial = options.snapshot?.state ?? createState({ html: options.html, page: options.page });
  const core = new EditingCore({ initial, versions: options.snapshot?.versions, rules: options.rules });
  return new Editor(core, options.container, options.renderer);
}
