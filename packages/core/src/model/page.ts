export type PaperSize = "A4" | "A5" | "Letter" | "Legal" | { width: number; height: number };

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PageSetup {
  size: PaperSize;
  /** In millimetres. */
  margin: Margins;
  /** Colour of the paper, any CSS colour. White when unset. */
  background?: string;
}

/** Dimensions in millimetres. */
export const PAPER_SIZES: Record<Exclude<PaperSize, object>, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
};

export const DEFAULT_PAGE: PageSetup = {
  size: "A4",
  margin: { top: 20, right: 18, bottom: 20, left: 18 },
};

export const MM_TO_PX = 96 / 25.4;

export function paperDimensions(size: PaperSize): { width: number; height: number } {
  return typeof size === "string" ? PAPER_SIZES[size] : size;
}

export interface PageGeometry {
  width: number;
  height: number;
  margin: Margins;
  /** Height available to content on one page. */
  contentHeight: number;
  contentWidth: number;
}

/** Everything layout needs, in CSS pixels. */
export function pageGeometry(page: PageSetup): PageGeometry {
  const { width, height } = paperDimensions(page.size);
  const margin = {
    top: page.margin.top * MM_TO_PX,
    right: page.margin.right * MM_TO_PX,
    bottom: page.margin.bottom * MM_TO_PX,
    left: page.margin.left * MM_TO_PX,
  };
  const widthPx = width * MM_TO_PX;
  const heightPx = height * MM_TO_PX;
  return {
    width: widthPx,
    height: heightPx,
    margin,
    contentWidth: widthPx - margin.left - margin.right,
    contentHeight: heightPx - margin.top - margin.bottom,
  };
}

export function samePage(a: PageSetup, b: PageSetup): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

/** A page colour that is safe to put in CSS: a colour value, never a declaration. White if it is not one. */
export function safeColor(value: string | undefined): string {
  return value && /^[#a-zA-Z0-9(),.%\s/-]+$/.test(value) ? value : "#fff";
}
