# Review and the AI

## What the AI is

A function you give the editor:

```ts
editor.ai = async (request, { signal }) => ({ html, summary, scope, targets });
```

It receives an `AiRequest` (the document, the instruction, the page, the rules, text the person typed since the AI's last version) and returns the whole document with a summary and what it says it changed. It can also return an async stream of `AiEvent`s to report progress. `httpProvider(url)` is one that talks to your own backend. What is behind the function is not Folio's business, and no prompt or model call ships in the library.

## compose and revise

- `editor.compose(instruction)` writes a new document. The result replaces the current one and is committed at once as an AI version. There is nothing to compare it with, and undo brings the old one back.
- `editor.revise(instruction)` asks for a revision. The result becomes a proposal to review.

Both lock the page while the AI works. `editor.cancel()` stops it and leaves the document as it was.

## A proposal

1. The result is cleaned under the rules; what the rules removed is kept for the review.
2. It is diffed against the document (`diff/`).
3. The diff is compared with what the AI said it did (`diff/scope.ts`).
4. The page shows the document with the changes marked, and the host shows `editor.review`.
5. The person keeps or undoes each change (review commands), then finishes.
6. What was kept is committed as an AI version. Nothing else was ever written.

## The diff

The AI rewrites the whole document, so nothing about an element's identity survives reliably. Units (text elements and images) are matched by their text, in three passes:

1. Identical text in the same order (longest common subsequence). If only the markup differs, that is a formatting change.
2. Between those anchors, units with alike text are paired: those are edits, shown word by word.
3. What is left with identical text on both sides moved; the rest was removed or added.

CSS is compared by top-level rule and reviewed as one group, because a rule rarely affects only the element it was aimed at.

## Checking the AI

The AI declares a scope (`text`, `section`, `layout`, `whole`) and the blocks it changed. The diff is the truth. The review warns when:

- the diff is broader than the declared scope;
- a change is outside the declared blocks (`outside-targets`);
- a change touches text the person typed since the AI's last version (`touched-human-edit`).

## Putting rejected changes back

Rejecting a change means restoring old content into the new document (`review/apply-decisions.ts`). Edits and additions are undone in place. Removed content goes back next to its nearest surviving neighbour, as a whole section if every removal in it was rejected (`review/placement.ts`).
