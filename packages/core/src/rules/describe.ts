import { resolveRules } from "./resolve";
import type { ContentLevel, DocumentRules } from "./types";

const LEVEL_TEXT: Record<ContentLevel, string> = {
  text: "Plain text structure only: headings, paragraphs, lists and simple wrapper elements.",
  rich: "Text structure, plus tables, images, links and horizontal rules.",
  free: "Any document content.",
};

const CAPABILITIES = ["images", "links", "tables", "svg", "freeform"] as const;

const CAPABILITY_NAMES: Record<(typeof CAPABILITIES)[number], string> = {
  images: "images",
  links: "links",
  tables: "tables",
  svg: "SVG",
  freeform: "absolutely positioned elements",
};

/**
 * The rules as plain sentences for a prompt. Nothing sends these anywhere:
 * the rules are enforced on whatever comes back. This only helps a model
 * avoid output that would be removed.
 */
export function describeRules(rules: DocumentRules | null | undefined): string {
  const lines = [...contentLines(rules), ...fontLines(rules), ...pageLines(rules)];
  return lines.join("\n");
}

function contentLines(rules: DocumentRules | null | undefined): string[] {
  const resolved = resolveRules(rules);
  const lines: string[] = [];
  if (resolved.tags) {
    lines.push(`Use only these HTML elements: ${[...resolved.tags].map((t) => t.toLowerCase()).join(", ")}. (<style> is always allowed.)`);
  } else {
    lines.push(LEVEL_TEXT[resolved.level]);
    const forbidden = CAPABILITIES.filter((c) => !resolved.allow[c]);
    if (forbidden.length > 0 && resolved.level !== "text") lines.push(`Do not use: ${forbidden.map((c) => CAPABILITY_NAMES[c]).join(", ")}.`);
  }
  if (!resolved.allow.freeform) lines.push("Do not position elements with position: absolute or fixed.");
  return lines;
}

function fontLines(rules: DocumentRules | null | undefined): string[] {
  if (!rules?.fonts) return [];
  return [`Fonts: only ${rules.fonts.join(", ")} (and generic families such as serif and sans-serif). Do not @import any other font.`];
}

function pageLines(rules: DocumentRules | null | undefined): string[] {
  const page = rules?.page;
  const lines: string[] = [];
  if (page?.sizes?.length) {
    const sizes = page.sizes.map((s) => (typeof s === "string" ? s : `${s.width}x${s.height}mm`));
    lines.push(`The paper is ${sizes.join(" or ")}; you cannot change it.`);
  }
  if (page?.backgrounds?.length) lines.push(`The page colour is ${page.backgrounds.join(" or ")}. Choose text colours that read on it.`);
  return lines;
}
