import type { Notice, RuleViolation } from "../commands";

/** The notice for content the rules removed, or none if nothing was removed. */
export function removedNotices(violations: RuleViolation[]): Notice[] {
  if (violations.length === 0) return [];
  return [{ code: "rules-removed", message: "Some content was removed because this document's rules do not allow it.", violations }];
}
