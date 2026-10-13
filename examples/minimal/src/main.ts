/**
 * A place to try the library. It is not part of what Folio offers.
 *
 * It gives the adapter an HTML string, then logs every `folio:*` event the
 * adapter emits, so you can see what the browser does while you edit.
 */

import { PresentationAdapter, RAW_EVENTS, type PresentationEvent } from "@folio/core";

const HTML = `
<h1>Quarterly report</h1>
<p>This quarter we shipped the new editor and moved the pipeline to the cloud.</p>
<h2>Highlights</h2>
<ul>
  <li>Launched the review flow for AI changes</li>
  <li>Cut page load time by a third</li>
  <li>Onboarded twelve new customers</li>
</ul>
<h2>Next quarter</h2>
<p>We will focus on reliability and on making the editor easier to embed.</p>
`;

const page = document.querySelector<HTMLElement>("#page")!;
const log = document.querySelector<HTMLElement>("#log")!;

const adapter = new PresentationAdapter(page);
adapter.setup(HTML);

if (!adapter.presentation.plaintextOnlySupported) {
  log.textContent = "This browser doesn't support contenteditable=\"plaintext-only\", so the text is read-only.\n";
}

const short = (text: string, max = 40) => (text.length > max ? `${text.slice(0, max)}…` : text).replace(/\n/g, "↵");

function describe(event: PresentationEvent): string {
  const { original, unit } = event.detail;
  const where = unit ? `<${unit.tagName.toLowerCase()}>` : "(outside)";
  const parts: string[] = [where];
  if (original instanceof InputEvent) {
    parts.push(original.inputType);
    if (original.data) parts.push(`"${short(original.data, 20)}"`);
    if (original.isComposing) parts.push("composing");
  } else if (original instanceof KeyboardEvent) {
    parts.push(original.key);
  } else if (original instanceof CompositionEvent) {
    parts.push(`"${short(original.data, 20)}"`);
  }
  return parts.join(" ");
}

for (const name of RAW_EVENTS) {
  adapter.on(name, (event) => {
    const time = new Date().toISOString().slice(11, 23);
    log.prepend(`${time}  ${name.padEnd(17)} ${describe(event)}\n`);
    // Keep the log from growing without limit.
    if (log.textContent && log.textContent.length > 60_000) log.textContent = log.textContent.slice(0, 40_000);
  });
}

document.querySelector("#clear")!.addEventListener("click", () => (log.textContent = ""));
