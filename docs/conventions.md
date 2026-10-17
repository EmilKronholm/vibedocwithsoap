# Conventions

## Structure
- Files stay short. If a file passes about 150 lines, split it by responsibility.
- Functions stay short. If a function needs a comment to separate its steps, those steps are functions.
- Dependencies point one way: `dom` and `model` know nothing above them; `rules` and `sanitize` use `dom`; `editing` uses all of those; `rendering`, `presentation` and `editor` sit on top. Lower layers never import higher ones.
- One export per concept. `index.ts` lists the public API by name; internals are not re-exported.

## Comments
- No essays at the top of files. Explanations of how things fit together live in `docs/*.md`.
- JSDoc on exported types and functions that someone using the library will call: what it is for, what it returns, what can go wrong.
- Inline comments only where the logic would confuse someone new to the code: a non-obvious reason, a browser quirk, an invariant. Say why, not what.

## Tests
- Each pure module has a test file next to the others in `packages/core/test/`, named after the module.
- Test names are sentences that read as the specification.

## Example apps
- `examples/*` exist to try the library quickly. They are never part of what is offered, and may be rough.
