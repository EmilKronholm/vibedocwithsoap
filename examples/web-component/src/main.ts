import "@folio/ui";

const SAMPLE = `
<style>.doc { font-family: Georgia, serif; line-height: 1.5 } .doc h1 { font-size: 24pt; margin: 0 0 8pt }</style>
<article class="doc">
  <h1>A document in an HTML element</h1>
  <p>Folio is used here as <b>&lt;folio-editor&gt;</b>. Click and type; Enter and Backspace work as in any editor.</p>
</article>`;

const status = document.querySelector<HTMLElement>("#status")!;

// Properties set before the element is attached are its starting configuration.
const element = document.createElement("folio-editor");
element.html = SAMPLE;
element.rules = { content: "rich", fonts: ["Georgia"] };
document.querySelector("#slot")!.append(element);

element.addEventListener("folio-state", ({ detail }) => (status.textContent = `${detail.state.html.length} characters`));
element.addEventListener("folio-notice", ({ detail }) => (status.textContent = detail.notice.message));

document.querySelector("#undo")!.addEventListener("click", () => element.editor?.dispatch({ kind: "undo" }));
document.querySelector("#redo")!.addEventListener("click", () => element.editor?.dispatch({ kind: "redo" }));
document.querySelector("#print")!.addEventListener("click", () => void element.editor?.print());
