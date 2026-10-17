import { paperDimensions, type PageSetup } from "../model";

const WHITE = /^(#fff|#ffffff|white)$/i;

/** The page in one sentence, so a model knows the space it is writing into. */
export function describePage(page: PageSetup): string {
  const { width, height } = paperDimensions(page.size);
  const name = typeof page.size === "string" ? page.size : "custom";
  const m = page.margin;
  const column = (width - m.left - m.right).toFixed(1);
  const colour = !page.background || WHITE.test(page.background.trim()) ? "" : ` The paper colour is ${page.background}.`;
  return `${name} paper (${width}x${height}mm), margins ${m.top}/${m.right}/${m.bottom}/${m.left}mm (top/right/bottom/left), so the content column is ${column}mm wide.${colour}`;
}
