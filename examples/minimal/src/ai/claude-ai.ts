/*
 * !!! THIS BELONGS ON A BACKEND SERVER. !!!
 * The browser calls Anthropic directly with a key the person types in. That is
 * only acceptable for a demo on your own machine: anyone who can open this page
 * can read the key. In a real app the browser calls YOUR route
 * (`httpProvider("/api/vibedoc")`) and your server holds the key, checks who is
 * asking, and makes this same call.
 */

import { describePage, describeRules, readAiResult, type AiProvider, type AiRequest } from "@vibedocwithsoap/core";

const MODEL = "claude-sonnet-5-5";
const KEY_STORAGE = "vibedoc-example-key";

const SYSTEM = `You write and revise documents for VibeDocWithSoap, an editor where a person reviews every change you make.
Deliver the document by calling write_document exactly once.
The document is an HTML fragment: a <style> element, then content. No <html>, <head> or <body>.
- Every element that holds text holds plain text in one style: no <strong>, <em> or <a> inside a sentence. Use separate elements instead.
- Mark each section and self-contained entry with data-block="short-id", and keep the ids when revising.
- Never set page size, @page, or margin/padding/background on html or body.
When revising, change only what was asked and return everything else exactly as it was. Text listed under human_edits was typed by the person: leave it alone.
Never invent facts. Use bracketed gaps like [Date] where something is missing.`;

const TOOL = {
  name: "write_document",
  description: "Deliver the complete document.",
  input_schema: {
    type: "object",
    properties: {
      html: { type: "string", description: "The whole document." },
      summary: { type: "string", description: "One or two sentences on what you did." },
      scope: { type: "string", enum: ["text", "section", "layout", "whole"], description: "How much you changed." },
      targets: { type: "array", items: { type: "string" }, description: "data-block ids you changed." },
    },
    required: ["html", "summary", "scope"],
  },
};

function message(request: AiRequest): string {
  const parts = [`<page>${describePage(request.page)}</page>`];
  if (request.rules) parts.push(`<document_rules>\n${describeRules(request.rules)}\n</document_rules>`);
  if (request.kind === "revise") parts.push(`<document>\n${request.html}\n</document>`);
  if (request.humanEdits?.length) parts.push(`<human_edits>\n${request.humanEdits.map((t) => `- ${t}`).join("\n")}\n</human_edits>`);
  if (request.instruction) parts.push(`<instruction>\n${request.instruction}\n</instruction>`);
  return parts.join("\n\n");
}

function apiKey(): string {
  const saved = sessionStorage.getItem(KEY_STORAGE) ?? prompt("Anthropic API key (kept in this tab only; demo, see claude-ai.ts):");
  if (!saved) throw new Error("No API key.");
  sessionStorage.setItem(KEY_STORAGE, saved);
  return saved;
}

export function claudeAi(): AiProvider {
  return async (request, { signal }) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey(),
        "anthropic-version": "2023-06-01",
        // Lets a browser call the API directly. The name is a warning: do not ship this.
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM,
        tools: [TOOL],
        tool_choice: { type: "tool", name: TOOL.name },
        messages: [{ role: "user", content: message(request) }],
      }),
    });
    if (!response.ok) throw new Error(`Anthropic returned ${response.status}: ${await response.text()}`);

    const body = (await response.json()) as { content: Array<{ type: string; input?: unknown }> };
    const result = readAiResult(body.content.find((block) => block.type === "tool_use")?.input);
    if (!result) throw new Error("The model did not return a document.");
    return result;
  };
}
