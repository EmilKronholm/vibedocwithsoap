import type { RuleViolation } from "../commands";
import { IMAGE_TAGS, TABLE_TAGS } from "../rules/tags";

/** Counts what the rules removed, one entry per kind of thing. */
export class Violations {
  readonly #counts = new Map<string, RuleViolation>();

  add(rule: RuleViolation["rule"], detail: string): void {
    const key = `${rule}:${detail}`;
    const found = this.#counts.get(key);
    if (found) found.count++;
    else this.#counts.set(key, { rule, detail, count: 1 });
  }

  list(): RuleViolation[] {
    return [...this.#counts.values()];
  }
}

/**
 * How a removed tag is reported: what a person would call it, once per table
 * or image rather than once per cell. Null means do not report this tag.
 */
export function violationName(tag: string): string | null {
  if (tag === "TABLE") return "table";
  if (TABLE_TAGS.includes(tag) || tag === "SOURCE") return null;
  if (IMAGE_TAGS.includes(tag)) return "image";
  if (tag === "A") return "link";
  return tag.toLowerCase();
}
