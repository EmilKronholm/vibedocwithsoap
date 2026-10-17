import { SVG_NS } from "../dom";
import { GLOBAL_ATTRS, TAG_ATTRS } from "./allowlists";

const isSafeLink = (value: string) => /^(https?:|mailto:|tel:|#)/.test(value.trim().toLowerCase());

/** Never `data:image/svg+xml`: it can carry script. */
function isSafeImage(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v.startsWith("https:") || /^data:image\/(png|jpe?g|gif|webp|avif);/.test(v);
}

/** Whether an attribute may stay on an element. */
export function keepsAttribute(el: Element, name: string, value: string): boolean {
  if (name.startsWith("on")) return false;
  if (name.startsWith("data-") || name.startsWith("aria-")) return true;
  if (el.namespaceURI === SVG_NS) return keepsSvgAttribute(name, value);

  const tag = el.tagName.toUpperCase();
  if (!GLOBAL_ATTRS.has(name) && !TAG_ATTRS[tag]?.includes(name)) return false;
  if (name === "href") return isSafeLink(value);
  if (name === "src") return isSafeImage(value);
  if (name === "srcset") return value.split(",").every((candidate) => isSafeImage(candidate.trim()));
  return true;
}

// Presentation attributes are many and harmless; links may only point inside the document.
function keepsSvgAttribute(name: string, value: string): boolean {
  if (name === "href" || name === "xlink:href") return value.trim().startsWith("#");
  return true;
}
