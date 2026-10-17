import type { Presentation } from "../presentation";
import type { Paginator } from "../rendering";
import type { RenderRequest, Renderer } from "./renderer";

/** Draws the document as pages: the paginator splits it, the presentation shows one sheet per page. */
export class PagedRenderer implements Renderer {
  #latest = 0;

  constructor(
    private readonly presentation: Presentation,
    private readonly paginator: Paginator,
  ) {}

  async render({ state, html }: RenderRequest): Promise<void> {
    // Pagination waits for fonts, so renders can overlap. Only the newest is drawn.
    const ticket = ++this.#latest;
    const pages = await this.paginator(html ?? state.html, state.page);
    if (ticket === this.#latest) this.presentation.setPages(pages, state.page);
  }

  destroy(): void {
    // Whatever is still measuring will find itself out of date and draw nothing.
    this.#latest = Number.POSITIVE_INFINITY;
  }
}
