/** Content with no text of its own: shown, never typed into. */
export const REPLACED_TAGS: ReadonlySet<string> = new Set(["IMG", "SVG", "HR", "CANVAS", "PICTURE", "VIDEO"]);

/** Elements that are not part of the readable document. */
export const SKIPPED_TAGS: ReadonlySet<string> = new Set(["STYLE", "SCRIPT", "TEMPLATE", "HEAD", "TITLE", "META", "LINK"]);

/** Text elements that stay editable while empty: an empty paragraph is still a paragraph. */
export const EMPTY_TEXT_TAGS: ReadonlySet<string> = new Set([
  "P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "TD", "TH", "BLOCKQUOTE", "DT", "DD", "FIGCAPTION", "CAPTION",
]);

/** Elements where Enter starts a new element; anywhere else it breaks the line. */
export const PARAGRAPH_TAGS: ReadonlySet<string> = new Set([
  "P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "DT", "DD",
]);

export const SVG_NS = "http://www.w3.org/2000/svg";
