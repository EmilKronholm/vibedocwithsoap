import { failed, type Command, type EditFailure } from "../commands";
import type { PageSetup } from "../model";
import { filterCss } from "./css-filter";
import { checkPage } from "./page-rules";
import { resolveRules, type ResolvedRules } from "./resolve";
import type { DocumentRules } from "./types";

/**
 * Checks that can be made before a command is applied: a refused font, a
 * positioned element, a page the rules do not allow. Returns the failure, or
 * null when the command may go on.
 */
export function checkCommand(command: Command, rules: DocumentRules | null | undefined): EditFailure | null {
  switch (command.kind) {
    case "setPage":
      return pageProblem(command.page, rules);
    case "setInlineStyle":
      return command.value === null ? null : cssProblem(`${command.property}: ${command.value}`, rules);
    case "setInlineCss":
    case "setStylesheet":
      return cssProblem(command.css, rules);
    case "addFontImport":
      return cssProblem(`@import url("${command.url}");`, rules);
    default:
      return null;
  }
}

function pageProblem(page: PageSetup, rules: DocumentRules | null | undefined): EditFailure | null {
  const problems = checkPage(page, rules);
  return problems.length > 0 ? failed("rule-violation", problems.map((p) => p.message).join(" ")) : null;
}

function cssProblem(css: string, rules: DocumentRules | null | undefined): EditFailure | null {
  const resolved: ResolvedRules = resolveRules(rules);
  const { removed } = filterCss(css, resolved);
  if (removed.length === 0) return null;

  const first = removed[0];
  const rule = first.reason === "freeform" ? "freeform" : "fonts";
  const message =
    rule === "fonts" ? "That font is not allowed in this document." : "Positioned elements are not allowed in this document.";
  return failed("rule-violation", message, [{ rule, detail: `${first.property}: ${first.value}`, count: removed.length }]);
}
