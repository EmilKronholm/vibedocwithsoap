# Known issues and what is not done

## Nothing has been run

Everything in this repository was written without running it: no `npm install`, no type check, no tests, no browser. Expect type errors and failing tests on the first run. The tests were written to describe intended behaviour, and several were traced by hand against the code, but none has been executed. Start here:

```bash
npm install
npm run typecheck
npm test
npm run dev
```

Then try each example by hand. The most fragile places are the ones that depend on a real browser: caret handling after a render, `execCommand`, pagination against real layout, and the print dialog.

## Browser behaviour

- **`execCommand` is deprecated.** It is used for inserting a line break (Enter where a new element does not apply) and for pasting plain text. It still works in current browsers.
- **`contenteditable="plaintext-only"`** is the foundation. Where a browser does not support it, text is read-only (`editor.plaintextOnlySupported` is false). Check the browsers you care about.
- **Input methods** (Japanese, Chinese, Korean) are left alone during composition and nothing is committed until it ends. Not tested.
- **Mobile** editing is untested and probably rough.
- **The caret after a render** is restored by path and character offset. A selection that is not collapsed is not restored.

## Rendering

- **No iframe.** The document's CSS applies in the page, so it can leak into the host page and the host's CSS can reach the document. The baseline is scoped and has no weight, but a document that styles `body` or very general selectors will affect more than itself. An iframe or shadow DOM would isolate it, at a cost to selection, the document's `:root` variables, and printing.
- **Pages do not scale to a narrow container.** Sheets are the paper's size in pixels and the container scrolls.
- **A heading can be left at the bottom of a page** away from the text it introduces. There is no "keep with next".
- **`break-inside`, `break-before` and similar CSS are not read.** Use `data-block` to keep things together.
- **Tables** are cut between rows only, and a header row is not repeated on the next page.
- **A margin at the top of a page** is applied again where content continues, so it can sit a little lower than the break measured.
- **Positioned (free-floating) elements** take no room and stay on the page where their container ends up.
- **Measuring waits at most 4 seconds** for fonts and images. After that it measures with what has loaded.
- **System fonts differ between machines**, so a PDF made elsewhere can break pages differently. Bundle web fonts.

## Editing

- **Paths are not stable across structural changes**, but they are used for the length of one command only. Stable ids are an open question.
- **Every command parses the document three times** (apply, sanitise, normalise). Fine for ordinary documents; large ones will feel it.
- **Undo history keeps whole states**, and versions are never pruned. Autosave saves all of them.
- **A rule change does not re-clean a stored document.**
- **Loading content through `replaceAll` as a person is refused if it breaks the rules.** Give initial content to `createEditor` instead.

## Review

- Clicking a change on the page does nothing yet; decisions are made from the host's list.
- Provenance (every block citing its source) is not ported.

## Not ported from the earlier version

Notes and comments on text or areas of the page, compose from named sources and templates, provenance, Word export, a standalone HTML export other than the print document, the React wrapper, the viewer element, theming through CSS variables beyond the sheet gap and shadow, and labels for translating built-in text (there is almost no built-in text now).

## The examples

- `examples/minimal` has an AI section with a mock provider and a Claude provider that calls the API **directly from the browser** with a key typed into the page. That is only acceptable for a demo on your own machine; the file says so, and it belongs on a server.
- `examples/web-component` is the smallest use of `<folio-editor>`.
