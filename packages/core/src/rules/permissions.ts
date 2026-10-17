import type { CommandKind } from "../commands";
import type { Actor } from "../model";
import { resolveRules } from "./resolve";
import type { DocumentRules } from "./types";

/** Whether `actor` may use a command of this kind under the rules. */
export function canPerform(actor: Actor, kind: CommandKind, rules: DocumentRules | null | undefined): boolean {
  return resolveRules(rules).permissions[actor].has(kind);
}
