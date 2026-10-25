# Decisions

Each is a choice made while building, with the reason. Change any of them; the reason says what would be lost.

## State and model

1. **The document is an HTML string.** The DOM is only a way to read it and to show it. A string can be saved, compared, put in history and sent anywhere; DOM nodes cannot. Cost: every command parses the string and writes it back.
2. **State is `{ html, page }`.** Versions and undo history sit beside it, not inside. The state stays small and is what rendering reads.
3. **The writer is handed out separately.** `createStateModel` returns a read-only model and a writer, and only editing gets the writer. "The model changes only through editing" is then a fact about who holds what, not a convention.
4. **Elements are addressed by path.** A command is applied right after page and model agree, so a path is good for its length. Stable ids would survive more, but need a matching step whenever the AI replaces the whole HTML. Open.

## Editing

5. **One door: `dispatch(command, actor)`.** Status check, then permission, then a cheap rules check, then apply, then sanitise and the rules, then commit. People and the AI differ only in which commands they may use.
6. **A person's change that breaks a rule is refused; the AI's output is cleaned and reported.** A person can fix their own input and be told why. The AI cannot be asked, and the rest of its revision is still worth reviewing.
7. **Commands live in their own folder below `rules`.** Rules reason about commands (who may use which), so commands cannot depend on rules.
8. **The rule engine is inside editing (`RuleGate`).** It composes rules and the sanitiser, and editing is the only place that needs both.
9. **No merging: the document is locked while the AI works or a review is open.** Simpler and safe. A long AI run costs the person waiting time.
10. **Versions are recorded before the model announces a change.** Anyone listening to the state sees versions that already include it.
11. **A version with a summary is never merged into by later typing.** The initial document and restored versions stay put; only plain consecutive human edits share one version.

## Typing

12. **Typing is native; the adapter only notices.** Each text element is `plaintext-only`. After a pause, or when focus leaves, one `setText` is sent. This keeps the caret, selection, spell-check and input methods working without rebuilding them.
13. **Enter, Backspace at an edge, undo/redo and paste are taken over.** They are the cases where the browser would change structure behind the model's back.
14. **After a render the caret is put back; a command can say where it belongs.** The editor saves the caret before drawing and restores it after, or uses the `focus` in a command's result (after a split or join). If the renderer is asynchronous, both wait for it.
15. **Where `plaintext-only` is missing, the text is read-only.** Falling back to rich text would let formatting and pasted markup in.

## Rendering

16. **Pagination cuts the document into one tree per page.** Each page is a fixed box, so printing is those boxes, with nothing left to a printer. The cost is that editing happens in pieces of the document; every element carries its path so an edit on any page finds its place.
17. **The browser measures; our code decides.** Breaks are computed from a `BoxReader`, so the rules can be tested with a fake measurer.
18. **The document is drawn into the page, without an iframe.** It is the direct reading of "populate the DOM". The cost is CSS can leak both ways; see known issues.
19. **Export reads the state, never the live editing page.** A hidden element is measured again and the pages are built from that.

## AI

20. **The AI is one function.** No prompt, tool call or model code is in the library. The request and result shapes are the contract; `describeRules` and `describePage` help a host write its own prompt.
21. **A revision is a proposal; a new document is committed at once.** A revision has something to be compared with and reviewed. A new document does not, and undo brings the old one back.
22. **The review is checked, not trusted.** The AI declares a scope and blocks; the diff is compared with them. Changes to text the person typed are flagged.

## Saving

23. **A store is anything that loads and saves one snapshot of JSON.** VibeDocWithSoap keeps nothing itself.
24. **Autosave never overlaps saves.** A change during a save is saved right after, so the store ends with the latest document. A failed save is reported and retried on the next change.

## Packaging

25. **Two packages.** `@vibedocwithsoap/core` holds everything; `@vibedocwithsoap/ui` is the `<vibedoc-editor>` web component. A React wrapper is not written.
26. **The web component draws into itself (no shadow DOM).** The document's CSS and the library's baseline would not reach into a shadow root.
