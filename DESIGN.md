# Folio design

Folio is a library for building document editors where a person and an AI work on the same page. It is not an editor: it owns everything drawn on the page and everything that decides what may happen to the document. The chat, toolbar and panels belong to whoever embeds it.

This file is the map. Details are in `docs/`.

## The three areas

| Area | Job | Lives in |
|---|---|---|
| **Model** | The state of the document: its HTML and its page setup. Subscribable. Can only be changed through editing. | `model/` |
| **Editing** | The one door every change goes through, human or AI. Decides whether a change is allowed, applies it, records history. | `editing/`, `rules/`, `sanitize/`, `diff/`, `review/`, `ai/` |
| **Rendering** | Turns the state into pages you can see and print, and into exports. Reads the state, never writes it. | `rendering/`, `presentation/` |

`persistence/` lets the host save and load; `editor/` wires everything into one object.

## The flow

```
browser event
  -> presentation adapter (translates native events into commands)
  -> editing: dispatch(command, actor)
       permission -> status lock -> apply -> rules/sanitise -> commit
  -> state model (subscribe)
  -> rendering (pages) -> presentation (draws)
```

The AI uses the same door. It does not write to the model: it makes a proposal, the person reviews the diff, and only what is kept is committed through the same path as a human edit.

## Settled (from the original design and the discussion)

- State is `{ html, page }`. Everything else (history, versions) is kept beside it.
- The model changes only through editing. This is enforced by capability: only editing is handed the writer.
- Humans edit existing text elements. The browser types natively inside a `plaintext-only` unit; the adapter only watches.
- The AI returns the whole HTML. The same door accepts it, as a proposal.
- Export uses the browser, from the state, never from the live editing DOM.
- Chromium is the reference engine. Where `plaintext-only` is missing, editing is refused rather than degraded.

## Decided while building (change any of these)

Each is explained in `docs/decisions.md`.

1. The document is an HTML **string**; DOM is only a parse/render step. Core uses standard DOM APIs (`DOMParser`, `template`), which exist in browsers and in happy-dom for tests.
2. Elements are addressed by **path** (child indexes), not ids. A command is applied immediately after the view and model agree, so paths are stable for its lifetime.
3. A human edit that breaks a rule is **rejected**. AI output that breaks a rule is **cleaned and reported**.
4. Human typing is committed per text element (debounced), as a `setText` command. Structure changes (Enter, Backspace at the edge, move, delete) are commands the adapter creates.
5. While the AI works or a review is open, the document is **locked**. There is no merging.
6. Pagination **splits the DOM into one tree per page**. The browser only measures; breaking decisions are ours and testable with a fake measurer.
7. Rendering after native typing is **deferred** until the text element loses focus, so the caret is never disturbed.

## Open

- Notes and comments on text or areas are not part of this rewrite yet.
- Provenance (`data-source`) is not ported yet.
- Word export is dropped. PDF is the print path.
- A React wrapper is not written. The web component in `packages/ui` is the framework-neutral entry.
- Whether stable ids should replace paths.

## Layout

```
packages/core   model, editing, rules, rendering, presentation, ai, persistence, editor facade
packages/ui     <folio-editor> web component over core
examples/*      throwaway apps for trying things; not part of what Folio offers
docs/           architecture, commands, rules, review, rendering, decisions
```

See `docs/conventions.md` for how code and comments are written here.
