import type { AiProvider, AiRequest, AiResult } from "@folio/core";
import { escape, parse, wait } from "./wait";

/** The instructions the friendly mock understands, shown as buttons in the AI tab. */
export const FRIENDLY_PRESETS = ["Make it shorter", "Add a section about support", "Use a warmer tone", "Change the accent colour"];

/** A pretend AI that does what it says. Honest about its scope, so the review has nothing to warn about. */
export function friendlyAi(): AiProvider {
  return async (request, { signal }) => {
    await wait(700, signal);
    return request.kind === "compose" ? compose(request) : revise(request);
  };
}

function compose(request: AiRequest): AiResult {
  const title = request.instruction?.trim() || "Untitled document";
  const html = `<style>.doc { font-family: Georgia, serif; line-height: 1.5 } .doc h1 { font-size: 26pt } .doc h2 { font-size: 15pt; margin-top: 16pt }</style>
<article class="doc">
  <h1 data-block="title">${escape(title)}</h1>
  <section data-block="intro"><h2>Introduction</h2><p>This document was written by the mock AI from your instruction.</p></section>
  <section data-block="details"><h2>Details</h2><p>Switch to the Claude provider in the AI tab to have a real model write it.</p></section>
</article>`;
  return { html, summary: "Wrote a short document.", scope: "whole" };
}

function revise(request: AiRequest): AiResult {
  const root = parse(request.html);
  const asked = (request.instruction ?? "").toLowerCase();

  if (asked.includes("shorter")) return shorter(root);
  if (asked.includes("support")) return addSection(root);
  if (asked.includes("warm")) return warmer(root);
  if (asked.includes("colour") || asked.includes("color")) return recolour(root);
  return polish(root);
}

function shorter(root: HTMLElement): AiResult {
  root.querySelectorAll("p:not(.note, .lead)").forEach((p) => (p.textContent = `${(p.textContent ?? "").split(". ")[0].replace(/\.$/, "")}.`));
  return { html: root.innerHTML, summary: "Kept the first sentence of each paragraph.", scope: "text" };
}

function addSection(root: HTMLElement): AiResult {
  const section = `<section data-block="support"><h2>Support</h2><p>After launch, our team stays on call for four weeks to fix anything that comes up.</p><p>Longer support agreements are available if you want one.</p></section>`;
  const before = root.querySelector('[data-block="pricing"]');
  if (before) before.insertAdjacentHTML("beforebegin", section);
  else root.querySelector("article, div")?.insertAdjacentHTML("beforeend", section);
  return { html: root.innerHTML, summary: "Added a Support section before Pricing.", scope: "section", targets: ["support"] };
}

function warmer(root: HTMLElement): AiResult {
  const swaps: Array<[RegExp, string]> = [[/We will/g, "We would love to"], [/This proposal describes/g, "This proposal shows you"], [/Tell us/g, "Just tell us"]];
  root.querySelectorAll("p").forEach((p) => (p.textContent = swaps.reduce((text, [from, to]) => text.replace(from, to), p.textContent ?? "")));
  return { html: root.innerHTML, summary: "Made the tone friendlier.", scope: "text" };
}

function recolour(root: HTMLElement): AiResult {
  root.querySelectorAll("style").forEach((style) => (style.textContent = (style.textContent ?? "").replace(/--accent:\s*#[0-9a-f]{3,8}/i, "--accent: #b45309")));
  return { html: root.innerHTML, summary: "Changed the accent colour to amber.", scope: "layout" };
}

function polish(root: HTMLElement): AiResult {
  const first = root.querySelector("p:not(.lead)");
  if (first) first.textContent = `${first.textContent} We keep the process simple and transparent.`;
  return { html: root.innerHTML, summary: "Added a sentence to the first paragraph.", scope: "text" };
}
