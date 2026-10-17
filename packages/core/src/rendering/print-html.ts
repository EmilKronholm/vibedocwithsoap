import { pageGeometry, paperDimensions, safeColor, type PageSetup } from "../model";
import { BASELINE_CSS, DOC_CLASS } from "./baseline-css";

/** Where a document may load fonts and images from by default: Google Fonts. */
export const DEFAULT_RESOURCE_ORIGINS: readonly string[] = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];

/** The policy for a document allowed to load from `origins`. The browser enforces it, so no CSS trick reaches anywhere else. */
export function contentSecurityPolicy(origins: readonly string[]): string {
  const allowed = origins.join(" ");
  return [
    "default-src 'none'",
    `style-src 'unsafe-inline' ${allowed}`,
    `font-src data: ${allowed}`,
    `img-src data: blob: ${allowed}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join("; ");
}

export interface PrintOptions {
  title: string;
  lang?: string;
  origins?: readonly string[];
}

const escapeHtml = (value: string) => value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/**
 * A standalone HTML document with the pages laid out one after another, each
 * exactly one sheet. There is nothing left for a printer to decide: the page
 * breaks are already placed.
 */
export function buildPrintableHtml(pages: readonly HTMLElement[], page: PageSetup, options: PrintOptions): string {
  const csp = contentSecurityPolicy(options.origins ?? DEFAULT_RESOURCE_ORIGINS).replace(/"/g, "&quot;");
  return [
    "<!doctype html>",
    `<html lang="${escapeHtml(options.lang ?? "en")}">`,
    `<head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}">`,
    `<title>${escapeHtml(options.title)}</title>`,
    `<style>${BASELINE_CSS}</style>`,
    `<style>${printCss(page)}</style>`,
    "</head><body>",
    ...pages.map((root, index) => sheet(root, page, index === pages.length - 1)),
    "</body></html>",
  ].join("\n");
}

function printCss(page: PageSetup): string {
  const { width, height } = paperDimensions(page.size);
  return `
@page { size: ${width}mm ${height}mm; margin: 0; }
html, body { margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.folio-print-page { position: relative; overflow: hidden; break-after: page; }
.folio-print-page:last-child { break-after: auto; }
`;
}

function sheet(root: HTMLElement, page: PageSetup, last: boolean): string {
  const g = pageGeometry(page);
  const { top, right, bottom, left } = g.margin;
  // One pixel under the sheet, so rounding can never push a blank page after the last one.
  const style = `width:${g.width}px;height:${g.height - (last ? 1 : 0)}px;padding:${top}px ${right}px ${bottom}px ${left}px;background:${safeColor(page.background)};`;
  return `<section class="folio-print-page ${DOC_CLASS}" style="${style}">${root.innerHTML}</section>`;
}
