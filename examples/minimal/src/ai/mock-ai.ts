import type { AiProvider, AiRequest, AiResult } from "@folio/core";

/** A pretend AI, so the whole flow can be tried without a key or a server. */
export function mockAi(): AiProvider {
  return async (request, { signal }) => {
    await wait(600, signal);
    return request.kind === "compose" ? compose(request) : revise(request);
  };
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    });
  });
}

function compose(request: AiRequest): AiResult {
  const title = request.instruction || "Untitled document";
  const html = `<style>.doc { font-family: Georgia, serif; line-height: 1.5 } .doc h1 { font-size: 24pt }</style>
<article class="doc">
  <h1 data-block="title">${escape(title)}</h1>
  <p data-block="intro">This document was written by the mock AI from your instruction.</p>
  <p data-block="body">Replace it with a real model by choosing the other provider.</p>
</article>`;
  return { html, summary: "Wrote a short document.", scope: "whole" };
}

// Makes a few edits that depend on the instruction, so there is something to review.
function revise(request: AiRequest): AiResult {
  const root = document.createElement("div");
  root.innerHTML = request.html;
  const asked = (request.instruction ?? "").toLowerCase();

  const first = root.querySelector("p");
  if (first) first.textContent = `${first.textContent} This sentence was added by the mock AI.`;
  if (asked.includes("shorter")) root.querySelectorAll("p").forEach((p) => (p.textContent = (p.textContent ?? "").split(". ")[0] + "."));
  if (asked.includes("remove")) root.querySelector("li:last-child")?.remove();
  if (asked.includes("add")) root.querySelector("article, div")?.insertAdjacentHTML("beforeend", '<p data-block="added">A new paragraph the mock AI added at the end.</p>');
  if (asked.includes("color") || asked.includes("colour")) root.querySelectorAll("style").forEach((s) => (s.textContent += " h1 { color: #b45309; }"));

  return { html: root.innerHTML, summary: "Reworded the first paragraph.", scope: asked.includes("add") || asked.includes("remove") ? "section" : "text" };
}

const escape = (text: string) => text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
