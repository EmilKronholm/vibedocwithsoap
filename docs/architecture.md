# Architecture

Folio is a library for building document editors where a person and an AI work on the same page. This describes how the code in `packages/core` is arranged and why.

## Three areas

| Area | Job | Folders |
|---|---|---|
| **Model** | The state of the document: its HTML and its page setup. Subscribable. Changed only through editing. | `model/` |
| **Editing** | The one door every change goes through, whether a person or the AI makes it. | `commands/`, `editing/`, `rules/`, `sanitize/`, `diff/`, `review/`, `ai/`, `knobs/`, `fonts/` |
| **Rendering** | Turns the state into pages to see and print. Reads the state, never writes it. | `rendering/`, `presentation/` |

`dom/` is shared by everything that has to read a document's structure. `persistence/` is how a host saves and loads. `editor/` wires it all into one object a host can use.

## Layers

Folders depend only on folders above them in this list:

1. `util`, `dom`
2. `model`
3. `commands`
4. `rules`, `fonts`, `knobs`
5. `sanitize`
6. `diff`
7. `review`
8. `editing`
9. `ai`, `persistence`, `rendering`
10. `presentation`
11. `editor`

(`presentation` uses a little of `rendering`, for the CSS a page needs. `rendering` knows nothing about the presentation.)

## One way in

```
browser event
  -> presentation adapter       turns native input into a command
  -> editor.dispatch(command, actor)
  -> editing core
       status check             locked while the AI works or a review is open
       permission               who may use this command (people / the AI)
       pre-check                a refused font, a page the rules do not allow
       apply                    command + state -> next state (pure)
       gate                     sanitise, then keep inside the rules
       commit                   model, undo history, versions
  -> model subscribers
  -> editor renders the new state
  -> presentation draws it
```

The AI uses the same door. Its result is never written to the model directly. It becomes a **proposal**: cleaned, diffed against the document, checked against what the AI said it did, and held until the person decides. Only what is kept is committed, as an AI version.

## The model can only be changed through editing

`createStateModel` returns two objects: a read-only `model` and a `writer`. Only the editing core is given the writer, so nothing else can change the state. There is no rule to remember; there is just no way to do it.

## What is stored

The state is `{ html, page }`. The document is an HTML string; the DOM is only a way to read it (`dom/parse.ts`) and to show it (`presentation/`). Versions and undo history are kept beside the state, not inside it. `model/snapshot.ts` is the plain-JSON form of the state plus versions that a host saves.

Elements are addressed by **path**: the child indexes from the root, such as `[1, 0, 3]`. A command is applied right after the page and the model agree, so a path is good for the length of one command. Every element on the page carries its path as `data-folio-path`.

## Typing

Typing is native. A text element is `contenteditable="plaintext-only"` and the browser edits it. The adapter only notices:

- after a pause (400 ms) or when focus leaves the element, `TextCommitter` sends one `setText` command with the element's new text;
- Enter, Backspace and Delete at an edge, undo and redo, and paste are taken over (`KeyHandler`, `PasteHandler`), because the browser would otherwise change structure behind the model's back;
- during composition (an input method), the browser is left alone and nothing is committed until it ends.

After a render replaces the page, the editor puts the caret back (`editor/caret-keeper.ts`), or where a command says it belongs (after a split or join).

## Files and what they do

The list is in [`DESIGN.md`](../DESIGN.md#layout). Each folder has a small `index.ts` listing what it offers the folders above it. Only `packages/core/src/index.ts` is public.
