import type { DocumentRules } from "@vibedocwithsoap/core";

/** Rule sets to try. A real product usually has one, fixed by what it is for. */
export const RULES: Record<string, DocumentRules | undefined> = {
  "none (anything goes)": undefined,
  "business document": { content: "rich", fonts: ["Georgia", "Inter"], page: { sizes: ["A4", "Letter"] } },
  "text only": { content: "text", fonts: ["Georgia"], page: { sizes: ["A4"], backgrounds: ["#ffffff"] } },
  "paper locked": { page: { sizes: ["A4"], backgrounds: ["#ffffff"], margin: { min: 15, max: 25 } } },
};
