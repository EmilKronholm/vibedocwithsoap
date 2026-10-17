# Commands

Everything that can happen to a document is a command, passed to `editor.dispatch(command, actor)`. It returns an `EditResult`: either `{ ok: true, changed, focus?, notices }` or `{ ok: false, error: { code, message, violations? } }`. Use `isFailure(result)` to tell them apart.

## Document commands

| Command | Does |
|---|---|
| `replaceAll { html }` | Replaces the whole document. |
| `setText { path, text }` | Sets the text of a text element. `\n` becomes a line break. |
| `splitUnit { path, offset }` | Enter: moves the text after `offset` into a new element below. Paragraph-like elements only. |
| `mergeUnits { path, direction }` | Backspace or Delete at an edge: joins with the previous or next element if it is the same kind. An empty element of another kind simply goes away. |
| `moveElement { path, direction }` | Swaps with the neighbour, skipping style elements. |
| `duplicateElement { path }` | Copies an element and keeps block ids unique. |
| `removeElement { path }` | Deletes an element. |
| `insertElement { after, element }` | Adds an element after the one at `after`, or at the end. `paragraph()`, `heading()` and `textBox()` make the `element`. |
| `setInlineStyle { path, property, value }` | Sets one CSS property on an element, or clears it with `null`. |
| `setInlineCss { path, css }` | Replaces an element's whole inline CSS. |
| `setStylesheet { index, css }` | Replaces the text of a style element. |
| `setKnob { name, value }` | Changes a setting the document declares (see below). |
| `addFontImport { url }` | Adds a web font to the document's own CSS. |
| `setPage { page }` | Changes paper size, margins or paper colour. |

## History

`undo`, `redo`, `restoreVersion { id }`. Restoring adds a new version; history is never rewritten.

## Review

While an AI revision is open: `decideChange { id, accepted }`, `decideCss { accepted }`, `decideAll { accepted }`, then `finishReview` or `discardReview`.

## AI

`proposeAi` and `applyAiDocument` are what the AI is allowed to hand in. You do not send them yourself: `editor.compose()` and `editor.revise()` run the provider and send them with the AI as the actor.

## Who may do what

By default a person may use everything except the AI commands, and the AI may use only the AI commands. A document's rules can replace either list (`permissions` in the rules). A command from someone who may not use it fails with `not-allowed`.

## Locking

While the AI works (`working`) or a revision is open (`reviewing`), document and history commands fail with `locked`. There is no merging: the person waits. Review commands work only while reviewing.

## Undo

Edits to the same element in quick succession, and a slider being dragged, share one undo step (`editing/history-key.ts`). Everything else is its own step.

## Document settings (knobs)

A document can declare what is worth adjusting as CSS variables on `:root` with a `@knob` comment:

```css
:root {
  --font-size: 10.5pt;  /* @knob "Font size" 8..14 step 0.25 */
  --accent: #1f3d63;    /* @knob "Accent colour" color */
  --density: cozy;      /* @knob "Density" options compact|cozy|airy */
}
```

`readKnobs(html)` lists them for a host to draw as sliders, colour pickers and dropdowns. `setKnob` writes the value back into the CSS, clamped to the range.
