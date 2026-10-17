/** The Google Fonts style sheet URL for a family. */
export function googleFontUrl(family: string, weights = [400, 600, 700]): string {
  const name = family.trim().replace(/\s+/g, "+");
  const variants = [0, 1].flatMap((ital) => weights.map((w) => `${ital},${w}`)).join(";");
  return `https://fonts.googleapis.com/css2?family=${name}:ital,wght@${variants}&display=swap`;
}

/**
 * Adds `@import url(...)` at the start of the document's first style element,
 * so a font chosen by hand travels with the document into exports and the
 * AI's next revision. Does nothing if the URL is already there.
 */
export function addFontImport(html: string, url: string): string {
  if (html.includes(url)) return html;
  const rule = `@import url("${url}");\n`;
  const firstStyle = /<style[^>]*>/i.exec(html);
  if (!firstStyle) return `<style>\n${rule}</style>\n${html}`;
  const at = firstStyle.index + firstStyle[0].length;
  return `${html.slice(0, at)}\n${rule}${html.slice(at)}`;
}
