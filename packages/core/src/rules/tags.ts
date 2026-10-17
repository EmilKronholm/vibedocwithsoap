import type { ResolvedRules } from "./resolve";

const IMAGE_TAGS = ["IMG", "PICTURE", "SOURCE"];
const TABLE_TAGS = ["TABLE", "CAPTION", "COL", "COLGROUP", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR"];

/** What `content: "text"` allows: structure for words, nothing else. */
const TEXT_TAGS: ReadonlySet<string> = new Set([
  "ABBR", "ADDRESS", "ARTICLE", "ASIDE", "B", "BDI", "BDO", "BLOCKQUOTE", "BR", "CITE", "CODE", "DD", "DEL",
  "DFN", "DIV", "DL", "DT", "EM", "FOOTER", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "HGROUP", "I", "INS",
  "KBD", "LI", "MAIN", "MARK", "NAV", "OL", "P", "PRE", "Q", "S", "SAMP", "SECTION", "SMALL", "SPAN", "STRONG",
  "STYLE", "SUB", "SUP", "TIME", "U", "UL", "VAR", "WBR",
]);

/**
 * The HTML tags a document may contain under the rules. `base` is every tag
 * that is safe at all; the rules can only narrow it. `<style>` is always
 * allowed because it is how a document looks.
 */
export function allowedHtmlTags(rules: ResolvedRules, base: ReadonlySet<string>): ReadonlySet<string> {
  const tags = rules.tags ? exactTags(rules.tags, base) : tagsForLevel(rules, base);
  tags.add("STYLE");
  return tags;
}

function exactTags(wanted: ReadonlySet<string>, base: ReadonlySet<string>): Set<string> {
  return new Set([...wanted].filter((tag) => base.has(tag)));
}

function tagsForLevel(rules: ResolvedRules, base: ReadonlySet<string>): Set<string> {
  const tags = new Set(rules.level === "text" ? [...TEXT_TAGS].filter((t) => base.has(t)) : base);
  const toggle = (names: string[], on: boolean) => names.forEach((n) => (on && base.has(n) ? tags.add(n) : tags.delete(n)));

  toggle(IMAGE_TAGS, rules.allow.images);
  toggle(["A"], rules.allow.links);
  toggle(TABLE_TAGS, rules.allow.tables);
  if (!rules.allow.images) tags.delete("FIGURE");
  return tags;
}

export { IMAGE_TAGS, TABLE_TAGS };
