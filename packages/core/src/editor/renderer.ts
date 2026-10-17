import type { DocumentState } from "../model";
import type { Presentation } from "../presentation";

/** Why a render is happening. After typing, the page already shows the new text. */
export type RenderOrigin = "typing" | "other";

export interface RenderRequest {
  state: DocumentState;
  origin: RenderOrigin;
  /** Draw this instead of the state's HTML: the document with a revision's changes marked, while reviewing. */
  html?: string;
}

/** Turns the state into something on the page. The state is read, never written. */
export interface Renderer {
  render(request: RenderRequest): void | Promise<void>;
  destroy(): void;
}

/** Shows the document as one continuous flow, with no page breaks. */
export class FlowRenderer implements Renderer {
  constructor(private readonly presentation: Presentation) {}

  render({ state, origin, html }: RenderRequest): void {
    // What was just typed is already on the page.
    if (origin === "typing" && html === undefined) return;
    this.presentation.setHtml(html ?? state.html);
  }

  destroy(): void {}
}
