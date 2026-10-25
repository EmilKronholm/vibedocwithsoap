# VibeDocWithSoap design

VibeDocWithSoap is a library for building document editors where a person and an AI work on the same page. It is not an editor: it owns everything drawn on the page and everything that decides what may happen to the document. The chat, toolbar and panels belong to whoever embeds it.

This file is the map. Details are in `docs/`; the long walk through every folder is [`docs/onboarding.md`](docs/onboarding.md).

## The three areas

| Area | Job | Lives in |
|---|---|---|
| **Model** | The state of the document: its HTML and its page setup. Subscribable. Can only be changed through editing. | `model/` |
| **Editing** | The one door every change goes through, human or AI. Decides whether a change is allowed, applies it, records history. | `commands/`, `editing/`, `rules/`, `sanitize/`, `diff/`, `review/`, `ai/` |
| **Rendering** | Turns the state into pages you can see and print, and into exports. Reads the state, never writes it. | `rendering/`, `presentation/` |

`persistence/` lets the host save and load; `editor/` wires everything into one object.

## The flow

```
browser event
  -> presentation adapter (translates native events into commands)
  -> editing: dispatch(command, actor)
       status -> permission -> apply -> rules and sanitiser -> commit
  -> state model (subscribe)
  -> rendering (pages) -> presentation (draws)
```

The AI uses the same door. It does not write to the model: it makes a proposal, the person reviews the diff, and only what is kept is committed through the same path as a human edit.

## Settled (from the original design and the discussion)

- State is `{ html, page }`. History and versions are kept beside it.
- The model changes only through editing, enforced by who is handed the writer.
- Humans edit existing text elements. The browser types natively inside a `plaintext-only` unit; the adapter only watches.
- The AI returns the whole HTML. The same door accepts it, as a proposal.
- Export uses the browser, from the state, never from the live editing DOM.
- Chromium is the reference engine. Where `plaintext-only` is missing, editing is refused rather than degraded.

## Decided while building (change any of these)

Each is explained in [`docs/decisions.md`](docs/decisions.md). The short list:

1. The document is an HTML **string**; DOM is only a parse/render step.
2. Elements are addressed by **path**, not ids.
3. A human edit that breaks a rule is **rejected**. AI output that breaks a rule is **cleaned and reported**.
4. Human typing is committed per text element (debounced) as `setText`. Structure changes are commands.
5. While the AI works or a review is open, the document is **locked**. There is no merging.
6. Pagination **splits the DOM into one tree per page**. The browser only measures; breaking is decided in testable code.
7. After a render the **caret is put back**, or where a command says it belongs.
8. The document is drawn into the page **without an iframe**.

## Open

- Notes and comments on text or areas are not part of this rewrite yet.
- Provenance (`data-source`) and compose-from-sources are not ported.
- Word export is dropped. PDF is the print path.
- A React wrapper is not written.
- Whether stable ids should replace paths.
- Whether an iframe or shadow DOM should isolate the document's CSS.

## State of the work

Everything is written and nothing has been run. See [`docs/known-issues.md`](docs/known-issues.md) for where to start and what to expect.

## Layout

```
packages/core   everything: model, editing, rules, rendering, presentation, ai, persistence, editor
packages/ui     <vibedoc-editor> web component over core
examples/*      throwaway apps for trying things; not part of what VibeDocWithSoap offers
docs/           architecture, commands, rules, review and AI, rendering, decisions, known issues
```

Inside `packages/core/src`:

| Folder | What it holds |
|---|---|
| `util` | An emitter, a typed event bus, ids |
| `dom` | Parsing, paths, text units, one-style normalisation |
| `model` | Page, state, state model, undo history, versions, snapshots |
| `commands` | Every command, who may use which, results |
| `rules` | Content levels, fonts, paper, permissions, CSS filter, `describeRules` |
| `sanitize` | The allowlist, then the rules |
| `knobs`, `fonts` | Settings a document declares; web font imports |
| `diff` | Units, word diff, CSS diff, matching, scope check |
| `review` | Review session, applying decisions, marking changes on the page |
| `editing` | The core, status, rule gate, committer, appliers, handlers |
| `ai` | Request and result contract, commander, HTTP provider |
| `persistence` | Stores and autosave |
| `rendering` | Pagination, baseline CSS, print HTML |
| `presentation` | The view, the sheets, the adapter and its input translators |
| `editor` | `createEditor` and the facade |

See `docs/conventions.md` for how code and comments are written here.
