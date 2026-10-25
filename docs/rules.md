# Rules

Rules say what a document may contain, which fonts and paper it may use, and who may do what. They are one plain object, passed as `rules` to `createEditor` or set on `editor.rules`. Unset means no restriction.

```ts
const rules: DocumentRules = {
  content: "rich",                       // "text" | "rich" | "free"
  allow: { svg: false },                 // switch single things on or off on top of the level
  fonts: ["Inter", "Georgia"],           // generic families (serif, sans-serif…) are always fine
  page: {
    sizes: ["A4", "Letter"],             // one entry locks it
    backgrounds: ["#ffffff", "#faf6ee"], // the colours of the paper
    margin: { min: 10, max: 30 },        // millimetres
  },
  permissions: { human: ["setText", "undo"] },
};
```

## Content levels

| Level | Contains |
|---|---|
| `text` | Headings, paragraphs, lists and plain wrappers. No images, tables, links or SVG. |
| `rich` | Text, plus tables, images, links and rules. No SVG, no positioned elements. |
| `free` | Everything the sanitiser allows, including SVG and positioned decorations. |

`allow` adjusts a level one capability at a time: `images`, `links`, `tables`, `svg`, `freeform`. `tags: ["h1", "p", "ul", "li"]` replaces the level with an exact list. `<style>` is always allowed.

## Where they are enforced

Everything goes through `editing/rule-gate.ts`.

- **A person's change that breaks a rule is refused.** The command fails with `rule-violation`, the document is unchanged, and `error.violations` says what. Cheap checks (a font, a positioned element, a page) run before the command is applied; the rest is found by sanitising the result.
- **The AI's output that breaks a rule is cleaned and reported.** There is no one to ask "did you mean that?", and the rest of the revision is still worth reviewing. What was removed arrives as a `rules-removed` notice and in `review.violations`.
- **The document you start with is cleaned silently.**
- **A stored document is not changed when rules change.** Rules apply to what changes from now on.

## What the sanitiser always does

Independent of the rules, `sanitize/` removes everything unsafe: scripts, forms, frames, event handler attributes, links that are not `https:`, `mailto:`, `tel:` or `#`, images that are not `https:` or inline raster data. Then it enforces one style per text element (see below).

## Fonts

Font checking works on the declarations a document writes: `font-family`, the `font` shorthand, custom properties such as `--font` and `--heading-font`, and `@import`ed web fonts. It is best effort, not a CSS engine: a font set through `var()` is checked where the variable is set. The Content Security Policy used when printing is the hard limit on what loads.

## One style per text element

A text element holds plain text in one style: no bold word inside a sentence. Mixed formatting is separate elements. `dom/normalize.ts` enforces this on any HTML by wrapping loose text next to elements in its own `<span>`. The look does not change, and it means typing can never bleed one style into another.

## Telling a model

`describeRules(rules)` returns the rules as plain sentences for a prompt. VibeDocWithSoap does not send it anywhere; the rules are enforced on whatever comes back either way. Every `AiRequest` also carries `rules`.
