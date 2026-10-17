import { paperDimensions, type Margins, type PageSetup, type PaperSize } from "../model";
import type { DocumentRules, PageRules } from "./types";

export interface PageViolation {
  field: "size" | "margin" | "background";
  message: string;
}

const WHITE = "#ffffff";

const sameSize = (a: PaperSize, b: PaperSize) => {
  const x = paperDimensions(a);
  const y = paperDimensions(b);
  return Math.abs(x.width - y.width) < 0.5 && Math.abs(x.height - y.height) < 0.5;
};

const normalizeColor = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");

const colorAllowed = (limits: PageRules, page: PageSetup) =>
  !limits.backgrounds || limits.backgrounds.map(normalizeColor).includes(normalizeColor(page.background ?? WHITE));

const sizeAllowed = (limits: PageRules, page: PageSetup) => !limits.sizes || limits.sizes.some((s) => sameSize(s, page.size));

/** What is wrong with a page setup under the rules. Empty when it is fine. */
export function checkPage(page: PageSetup, rules: DocumentRules | null | undefined): PageViolation[] {
  const limits: PageRules = rules?.page ?? {};
  const problems: PageViolation[] = [];
  if (!sizeAllowed(limits, page)) problems.push({ field: "size", message: "This paper size is not allowed." });
  if (!colorAllowed(limits, page)) problems.push({ field: "background", message: "This page colour is not allowed." });
  problems.push(...marginProblems(page.margin, limits));
  return problems;
}

function marginProblems(margin: Margins, limits: PageRules): PageViolation[] {
  const { min = 0, max = Infinity } = limits.margin ?? {};
  return (["top", "right", "bottom", "left"] as const)
    .filter((side) => margin[side] < min || margin[side] > max)
    .map((side) => ({ field: "margin" as const, message: `The ${side} margin must be between ${min} and ${max} mm.` }));
}

/** The page nearest to `page` that the rules allow. For choosing a starting point, not for overriding a document silently. */
export function fitPage(page: PageSetup, rules: DocumentRules | null | undefined): PageSetup {
  const limits = rules?.page;
  if (!limits) return page;
  const { min = -Infinity, max = Infinity } = limits.margin ?? {};
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const margin: Margins = {
    top: clamp(page.margin.top),
    right: clamp(page.margin.right),
    bottom: clamp(page.margin.bottom),
    left: clamp(page.margin.left),
  };
  const size = sizeAllowed(limits, page) ? page.size : limits.sizes![0];
  const background = colorAllowed(limits, page) ? page.background : limits.backgrounds![0];
  return { ...page, size, margin, ...(background !== undefined ? { background } : {}) };
}
