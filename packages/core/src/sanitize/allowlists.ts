/** Every HTML tag that is safe in a document at all. Rules can only narrow this. */
export const HTML_TAGS: ReadonlySet<string> = new Set([
  "A", "ABBR", "ADDRESS", "ARTICLE", "ASIDE", "B", "BDI", "BDO", "BLOCKQUOTE", "BR", "CAPTION", "CITE",
  "CODE", "COL", "COLGROUP", "DATA", "DD", "DEL", "DETAILS", "DFN", "DIV", "DL", "DT", "EM", "FIGCAPTION",
  "FIGURE", "FOOTER", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HGROUP", "HR", "I", "IMG", "INS",
  "KBD", "LI", "MAIN", "MARK", "NAV", "OL", "P", "PICTURE", "PRE", "Q", "RP", "RT", "RUBY", "S", "SAMP",
  "SECTION", "SMALL", "SOURCE", "SPAN", "STRONG", "STYLE", "SUB", "SUMMARY", "SUP", "TABLE", "TBODY", "TD",
  "TFOOT", "TH", "THEAD", "TIME", "TR", "U", "UL", "VAR", "WBR",
]);

/** SVG for icons, charts and decorations. Compared lower-case because SVG tag names keep their case. */
export const SVG_TAGS: ReadonlySet<string> = new Set([
  "svg", "g", "path", "circle", "ellipse", "line", "polyline", "polygon", "rect", "text", "tspan", "defs",
  "lineargradient", "radialgradient", "stop", "clippath", "mask", "pattern", "symbol", "use", "title", "desc",
]);

/** Removed together with everything inside them. */
export const DROPPED_TAGS: ReadonlySet<string> = new Set([
  "SCRIPT", "NOSCRIPT", "IFRAME", "FRAME", "FRAMESET", "OBJECT", "EMBED", "APPLET", "PORTAL", "FORM",
  "INPUT", "BUTTON", "TEXTAREA", "SELECT", "OPTION", "DIALOG", "TEMPLATE", "LINK", "META", "BASE", "TITLE",
  "AUDIO", "VIDEO", "CANVAS", "MATH", "FOREIGNOBJECT",
]);

export const GLOBAL_ATTRS: ReadonlySet<string> = new Set(["class", "id", "style", "title", "lang", "dir", "role", "hidden"]);

export const TAG_ATTRS: Readonly<Record<string, readonly string[]>> = {
  A: ["href", "rel"],
  IMG: ["src", "srcset", "alt", "width", "height"],
  SOURCE: ["srcset", "type", "media", "width", "height"],
  TD: ["colspan", "rowspan", "headers"],
  TH: ["colspan", "rowspan", "headers", "scope"],
  COL: ["span"],
  COLGROUP: ["span"],
  OL: ["start", "reversed", "type"],
  LI: ["value"],
  TIME: ["datetime"],
  DATA: ["value"],
  DEL: ["cite", "datetime"],
  INS: ["cite", "datetime"],
  Q: ["cite"],
  BLOCKQUOTE: ["cite"],
  DETAILS: ["open"],
  STYLE: ["media"],
};
