# VibeDocWithSoap

A library for building document editors where a person and an AI work on the same page.

The AI writes and designs. The person checks and refines. Every AI change arrives as a revision to keep or undo, and what is on the page is exactly what prints. VibeDocWithSoap is not an editor: it owns everything drawn on the page and everything that decides what may happen to the document. The chat, toolbar and panels are yours.

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

Everything here was written without being run. Read [docs/known-issues.md](docs/known-issues.md) first.

## Where to read

| | |
|---|---|
| [docs/onboarding.md](docs/onboarding.md) | **Start here.** A chapter per folder: the problems, the alternatives, how it works, with diagrams |
| [DESIGN.md](DESIGN.md) | The map: areas, flow, what is settled, decided and open |
| [docs/architecture.md](docs/architecture.md) | How the code is arranged and why |
| [docs/commands.md](docs/commands.md) | Every command |
| [docs/rules.md](docs/rules.md) | What a document may contain, and who may do what |
| [docs/review-and-ai.md](docs/review-and-ai.md) | The AI contract, proposals, the diff |
| [docs/rendering.md](docs/rendering.md) | Pages, printing, fonts |
| [docs/decisions.md](docs/decisions.md) | Each decision and its reason |
| [docs/known-issues.md](docs/known-issues.md) | What is risky or missing |
| [docs/conventions.md](docs/conventions.md) | How code and comments are written |

## Packages

- `@vibedocwithsoap/core`: the editor and everything under it.
- `@vibedocwithsoap/ui`: the `<vibedoc-editor>` web component.

The examples in `examples/` are for trying things out. They are not what VibeDocWithSoap offers.

## License

MIT
