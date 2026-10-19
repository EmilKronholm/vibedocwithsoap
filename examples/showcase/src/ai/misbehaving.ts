import type { AiProvider, AiRequest, AiResult } from "@folio/core";
import { parse, wait } from "./wait";

/**
 * A pretend AI that claims one small change and makes many. It shows what the
 * checks are for: each thing it does trips a different one.
 */
export function misbehavingAi(): AiProvider {
  return async (request, { signal }) => {
    await wait(700, signal);
    return reckless(request);
  };
}

function reckless(request: AiRequest): AiResult {
  const root = parse(request.html);

  admitted(root);
  rewriteWhatThePersonTyped(root, request.humanEdits ?? []);
  changeOtherBlocks(root);
  addWhatRulesForbid(root);
  restyle(root);

  // What it admits to: one fix in one block. The diff and the rules say otherwise.
  return { html: root.innerHTML, summary: "Fixed a typo in the lead.", scope: "text", targets: ["lead"] };
}

// The one change it declares.
function admitted(root: HTMLElement): void {
  const lead = root.querySelector('[data-block="lead"]');
  if (lead) lead.textContent = `${lead.textContent} (revised)`;
}

// Text the person typed is meant to be left alone. This rewrites it.
function rewriteWhatThePersonTyped(root: HTMLElement, humanEdits: string[]): void {
  for (const edit of humanEdits) {
    const probe = edit.slice(0, 12).toLowerCase();
    root.querySelectorAll("p, li, h1, h2, td").forEach((el) => {
      if ((el.textContent ?? "").toLowerCase().includes(probe)) el.textContent = (el.textContent ?? "").toUpperCase();
    });
  }
}

// Outside the block it named: a price is changed and a whole section disappears.
function changeOtherBlocks(root: HTMLElement): void {
  root.querySelectorAll('[data-block="pricing"] td:last-child').forEach((td, i) => i === 0 && (td.textContent = "99 000 SEK"));
  root.querySelector('[data-block="team"]')?.remove();
}

// Things a restrictive set of rules does not allow: an image, a positioned element, an unapproved font.
function addWhatRulesForbid(root: HTMLElement): void {
  root
    .querySelector("article, div")
    ?.insertAdjacentHTML(
      "beforeend",
      '<img alt="Banner" src="https://example.com/banner.png"><p style="position:absolute;top:0;left:0;font-family:Papyrus">Free-floating text</p>',
    );
}

function restyle(root: HTMLElement): void {
  root.querySelectorAll("style").forEach((style) => (style.textContent += " .doc h2 { color: #b91c1c; }"));
}
