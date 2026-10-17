import { describe, expect, it } from "vitest";
import { DEFAULT_PAGE } from "../src/model";
import { canPerform, checkCommand, checkPage, describeRules, filterCss, fitPage, resolveRules, type DocumentRules } from "../src/rules";
import { sanitizeHtml } from "../src/sanitize";

const sample =
  '<style>.a{color:red}</style><h1>Title</h1><p>Hello <a href="https://example.com">link</a></p>' +
  '<table><tr><td>Cell</td></tr></table><img src="https://example.com/x.png" alt="x">' +
  '<svg viewBox="0 0 1 1"><rect width="1" height="1"/></svg>';

const clean = (html: string, rules?: DocumentRules) => sanitizeHtml(html, rules);

describe("content levels", () => {
  it("text keeps words and drops everything else, reporting what it removed", () => {
    const { html, violations } = clean(sample, { content: "text" });
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("Cell");
    expect(html).not.toMatch(/<(a|table|td|img|svg|rect)\b/);
    expect(violations.map((v) => v.detail).sort()).toEqual(["image", "link", "svg", "table"]);
  });

  it("rich keeps tables, images and links but not svg", () => {
    const { html, violations } = clean(sample, { content: "rich" });
    expect(html).toMatch(/<table/);
    expect(html).toMatch(/<img/);
    expect(html).toMatch(/<a /);
    expect(html).not.toMatch(/<svg/);
    expect(violations).toEqual([{ rule: "content", detail: "svg", count: 1 }]);
  });

  it("free changes nothing", () => {
    const { html, violations } = clean(sample, { content: "free" });
    expect(html).toMatch(/<svg/);
    expect(violations).toEqual([]);
  });

  it("allow switches single capabilities on top of a level", () => {
    expect(clean(sample, { content: "text", allow: { images: true } }).html).toMatch(/<img/);
    expect(clean(sample, { content: "rich", allow: { images: false } }).html).not.toMatch(/<img/);
  });

  it("tags replaces the level with an exact list", () => {
    expect(clean("<h1>A</h1><h2>B</h2><p>C</p><ul><li>D</li></ul>", { tags: ["h1", "p"] }).html).toBe("<h1>A</h1>B<p>C</p>D");
  });

  it("with no rules reports nothing", () => {
    expect(clean(sample).violations).toEqual([]);
  });

  it("removes unsafe content under any rules", () => {
    expect(clean('<p onclick="x()">Hi</p><script>bad()</script>', { content: "free" }).html).toBe("<p>Hi</p>");
  });
});

describe("freeform", () => {
  const positioned = '<style>.deco { position: absolute; top: 0; color: red; }</style><div style="position:fixed;left:0">x</div>';

  it("is removed unless allowed", () => {
    const { html, violations } = clean(positioned, { content: "rich" });
    expect(html).not.toMatch(/position\s*:\s*(absolute|fixed)/);
    expect(html).toContain("color: red");
    expect(violations.every((v) => v.rule === "freeform")).toBe(true);
  });

  it("is kept in free, or when allowed", () => {
    expect(clean(positioned, { content: "free" }).html).toMatch(/position: ?absolute/);
    expect(clean(positioned, { content: "rich", allow: { freeform: true } }).html).toMatch(/position: ?absolute/);
  });

  it("leaves relative positioning alone", () => {
    expect(clean('<p style="position: relative">x</p>', { content: "text" }).html).toContain("position: relative");
  });
});

describe("fonts", () => {
  const rules = resolveRules({ fonts: ["Inter", "Playfair Display"] });

  it("drops a font-family naming a font that is not allowed", () => {
    const { css, removed } = filterCss("h1 { font-family: 'Comic Sans MS', cursive; color: red; } p { font-family: Inter, sans-serif; }", rules);
    expect(css).not.toContain("Comic");
    expect(css).toContain("color: red");
    expect(css).toContain("font-family: Inter, sans-serif");
    expect(removed).toHaveLength(1);
  });

  it("always allows generic families", () => {
    expect(filterCss("p { font-family: serif; }", rules).removed).toEqual([]);
  });

  it("checks the font shorthand and font variables but not sizes", () => {
    const { css } = filterCss(":root { --font: Georgia, serif; --font-size: 12pt; } p { font: italic 12px/1.4 Georgia, serif; } q { font: 12px Inter; }", rules);
    expect(css).not.toContain("Georgia");
    expect(css).toContain("--font-size: 12pt");
    expect(css).toContain("font: 12px Inter");
  });

  it("keeps imports of allowed families and drops the rest", () => {
    const keep = "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700');";
    const drop = '@import url("https://fonts.googleapis.com/css2?family=Lobster&display=swap");';
    const { css, removed } = filterCss(`${keep}\n${drop}\nbody { color: red; }`, rules);
    expect(css).toContain("Playfair");
    expect(css).not.toContain("Lobster");
    expect(removed[0].reason).toBe("import");
  });

  it("applies in style sheets and inline styles through the sanitiser", () => {
    const { html, violations } = clean('<style>p{font-family:Papyrus}</style><p style="font-family: Papyrus; color: blue">x</p>', { fonts: ["Inter"] });
    expect(html).not.toContain("Papyrus");
    expect(html).toContain("color: blue");
    expect(violations.every((v) => v.rule === "fonts")).toBe(true);
  });
});

describe("page rules", () => {
  const rules: DocumentRules = { page: { sizes: ["A4"], backgrounds: ["#ffffff", "#f5f0e6"], margin: { min: 10, max: 30 } } };

  it("passes a page that fits", () => {
    expect(checkPage(DEFAULT_PAGE, rules)).toEqual([]);
  });

  it("reports size, colour and margin", () => {
    const problems = checkPage({ size: "Letter", background: "#000", margin: { top: 5, right: 18, bottom: 18, left: 18 } }, rules);
    expect(problems.map((p) => p.field).sort()).toEqual(["background", "margin", "size"]);
  });

  it("treats a sized page as the same size however it is written", () => {
    expect(checkPage({ ...DEFAULT_PAGE, size: { width: 210, height: 297 } }, rules)).toEqual([]);
  });

  it("moves a page onto the rules", () => {
    const fitted = fitPage({ size: "Letter", background: "#000", margin: { top: 5, right: 40, bottom: 18, left: 18 } }, rules);
    expect(checkPage(fitted, rules)).toEqual([]);
    expect(fitted.size).toBe("A4");
  });

  it("with no rules has no problems", () => {
    expect(checkPage({ ...DEFAULT_PAGE, background: "#123456" }, null)).toEqual([]);
  });
});

describe("permissions", () => {
  it("lets people do everything except hand in AI work", () => {
    expect(canPerform("human", "setText", undefined)).toBe(true);
    expect(canPerform("human", "proposeAi", undefined)).toBe(false);
  });

  it("lets the AI only hand in work", () => {
    expect(canPerform("ai", "proposeAi", undefined)).toBe(true);
    expect(canPerform("ai", "setText", undefined)).toBe(false);
  });

  it("uses the lists the rules give", () => {
    const rules: DocumentRules = { permissions: { human: ["setText", "undo"] } };
    expect(canPerform("human", "setText", rules)).toBe(true);
    expect(canPerform("human", "removeElement", rules)).toBe(false);
  });
});

describe("command checks", () => {
  const rules: DocumentRules = { fonts: ["Inter"], content: "rich", page: { sizes: ["A4"] } };

  it("refuses a font that is not allowed", () => {
    const failure = checkCommand({ kind: "setInlineStyle", path: [0], property: "font-family", value: "Papyrus" }, rules);
    expect(failure?.error.code).toBe("rule-violation");
  });

  it("lets an allowed value through, and a reset", () => {
    expect(checkCommand({ kind: "setInlineStyle", path: [0], property: "font-family", value: "Inter" }, rules)).toBeNull();
    expect(checkCommand({ kind: "setInlineStyle", path: [0], property: "font-family", value: null }, rules)).toBeNull();
  });

  it("refuses a page the rules do not allow", () => {
    const failure = checkCommand({ kind: "setPage", page: { ...DEFAULT_PAGE, size: "Letter" } }, rules);
    expect(failure?.error.code).toBe("rule-violation");
  });

  it("refuses a positioned element when freeform is off", () => {
    const failure = checkCommand({ kind: "setInlineStyle", path: [0], property: "position", value: "absolute" }, rules);
    expect(failure?.error.violations?.[0].rule).toBe("freeform");
  });
});

describe("describeRules", () => {
  it("says what the model must not do", () => {
    const text = describeRules({ content: "text", fonts: ["Inter"], page: { sizes: ["A4"], backgrounds: ["#ffffff"] } });
    expect(text).toMatch(/headings, paragraphs/);
    expect(text).toMatch(/Inter/);
    expect(text).toMatch(/A4/);
    expect(text).toMatch(/position: absolute/);
  });

  it("is short when nothing is restricted", () => {
    expect(describeRules({})).toBe("Any document content.");
  });
});
