import type { CommandKind } from "../commands";
import type { PaperSize } from "../model";

/**
 * How much a document may contain, as an abstraction over tags.
 *
 * - `text`: headings, paragraphs, lists and plain wrappers.
 * - `rich`: text plus tables, images, links and rules.
 * - `free`: everything the sanitiser allows, including SVG and positioned decorations.
 */
export type ContentLevel = "text" | "rich" | "free";

export interface ContentAllow {
  images?: boolean;
  links?: boolean;
  tables?: boolean;
  svg?: boolean;
  /** Absolutely positioned and fixed elements. When off, `position: absolute | fixed` is removed. */
  freeform?: boolean;
}

export interface PageRules {
  /** Paper sizes the page may have. One entry locks it. */
  sizes?: readonly PaperSize[];
  /** Margin limits in millimetres. */
  margin?: { min?: number; max?: number };
  /** Colours the paper may have. One entry locks it. */
  backgrounds?: readonly string[];
}

export interface PermissionRules {
  /** Replaces the default list of commands each actor may use. */
  human?: readonly CommandKind[];
  ai?: readonly CommandKind[];
}

/** What a document may contain, which fonts and paper it may use, and who may do what. Unset means no restriction. */
export interface DocumentRules {
  /** Default `free`. */
  content?: ContentLevel;
  /** Switch single capabilities on or off on top of the level. */
  allow?: ContentAllow;
  /** An exact list of HTML tags, replacing what the level allows. `style` is always allowed. */
  tags?: readonly string[];
  /** Font families the document may use. Generic families such as `serif` are always allowed. */
  fonts?: readonly string[];
  page?: PageRules;
  permissions?: PermissionRules;
}
