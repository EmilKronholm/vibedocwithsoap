# VibeDocWithSoap

A library for building document editors where a person and an AI work on the same page.

The AI writes and designs. The person checks and refines. Every AI change arrives as a revision to keep or undo, and what is on the page is exactly what prints. VibeDocWithSoap is not an editor: it owns everything drawn on the page and everything that decides what may happen to the document. The chat, toolbar and panels are yours.

It is not a general-purpose document engine. It is made for vibecoding documents and then refining the content and word choices by hand.

It was originally built for a CV generator, but it might also fit:

- Invitation cards
- Contracts
- Brochures
- Document formatting, once the content is already done

## How it works

The AI outputs HTML and CSS, so the design is limited only by its imagination. The person edits the allowed HTML tags through `contenteditable`. The result is an AI-made document that is easy for a human to edit.

## Example

```ts
import { createEditor } from "@vibedocwithsoap/core";

const editor = createEditor({ container: document.querySelector("#page")!, html: "<h1>Hello</h1><p>Type here.</p>" });

editor.ai = async (request, { signal }) => ({ html, summary: "Reworded", scope: "text" }); // your model, your backend
await editor.revise("Make it shorter");          // ends in a revision to review: editor.review
editor.dispatch({ kind: "decideAll", accepted: true });
editor.dispatch({ kind: "finishReview" });

editor.dispatch({ kind: "setInlineStyle", path: [0], property: "color", value: "#1f3d63" });
editor.on("state", (state) => save(state));
await editor.print();                            // the same pages as on screen
```

Or as an element:

```html
<vibedoc-editor></vibedoc-editor>
<script type="module">
  import "@vibedocwithsoap/ui";
  const el = document.querySelector("vibedoc-editor");
  el.html = "<h1>Hello</h1>";
  el.addEventListener("vibedoc-state", (e) => save(e.detail.state));
</script>
```

## Try it

```bash
npm install
npm run dev          # the control-panel example
npm run dev:showcase # every feature, one tab each, with scenarios to try
npm run dev:web      # the <vibedoc-editor> example
npm test
```

## Packages

- `@vibedocwithsoap/core`: the editor and everything under it.
- `@vibedocwithsoap/ui`: the `<vibedoc-editor>` web component.

The examples in `examples/` are for trying things out. They are not what VibeDocWithSoap offers.

## License

MIT
