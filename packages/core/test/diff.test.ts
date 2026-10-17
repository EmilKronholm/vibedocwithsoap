import { describe, expect, it } from "vitest";
import { actualScope, checkScope, diffCss, diffDocuments, diffWords, humanEditsBetween, isEmptyDiff, similarity, splitCssRules } from "../src/diff";

const kinds = (before: string, after: string) => diffDocuments(before, after).changes.map((c) => c.kind);

describe("word diff", () => {
  it("shows an inserted and a replaced word", () => {
    const ops = diffWords("the quick fox", "the slow fox jumps");
    expect(ops.map((o) => o.op)).toContain("insert");
    expect(ops.map((o) => o.op)).toContain("delete");
    expect(ops.filter((o) => o.op === "equal").map((o) => o.text).join("")).toContain("the");
  });

  it("is one equal run for identical text", () => {
    expect(diffWords("same", "same")).toEqual([{ op: "equal", text: "same" }]);
  });

  it("rebuilds both texts from its parts", () => {
    const before = "one two three four";
    const after = "one 2 three four five";
    const ops = diffWords(before, after);
    expect(ops.filter((o) => o.op !== "insert").map((o) => o.text).join("")).toBe(before);
    expect(ops.filter((o) => o.op !== "delete").map((o) => o.text).join("")).toBe(after);
  });
});

describe("similarity", () => {
  it("is 1 for equal text and 0 for text with nothing in common", () => {
    expect(similarity("a b c", "a b c")).toBe(1);
    expect(similarity("a b c", "x y z")).toBe(0);
  });

  it("ignores case and order", () => {
    expect(similarity("Hello World", "world hello")).toBe(1);
  });
});

describe("css diff", () => {
  it("splits top-level rules and drops comments", () => {
    expect(splitCssRules("/* x */ p { color: red; } @import url(a); h1 { margin: 0 }")).toEqual([
      "p{color:red;}",
      "@import url(a);",
      "h1{margin:0}",
    ]);
  });

  it("reports added and removed rules", () => {
    const diff = diffCss("p { color: red }", "p { color: blue }");
    expect(diff.changed).toBe(true);
    expect(diff.added).toEqual(["p{color:blue}"]);
    expect(diff.removed).toEqual(["p{color:red}"]);
  });

  it("reports nothing for the same rules written differently", () => {
    expect(diffCss("p{color:red}", "p {\n color : red \n}").changed).toBe(false);
  });
});

describe("document diff", () => {
  it("finds nothing when nothing changed", () => {
    const diff = diffDocuments("<p>One</p><p>Two</p>", "<p>One</p><p>Two</p>");
    expect(isEmptyDiff(diff)).toBe(true);
    expect(diff.unchangedCount).toBe(2);
  });

  it("finds an edit inside a paragraph", () => {
    const [change] = diffDocuments("<p>The cat sat on the mat today</p>", "<p>The cat sat on the sofa today</p>").changes;
    expect(change.kind).toBe("modified");
    if (change.kind === "modified") {
      expect(change.markupOnly).toBe(false);
      expect(change.words.some((w) => w.op === "insert" && w.text.includes("sofa"))).toBe(true);
    }
  });

  it("finds an added and a removed unit", () => {
    expect(kinds("<p>One</p><p>Two</p>", "<p>One</p>")).toEqual(["removed"]);
    expect(kinds("<p>One</p>", "<p>One</p><p>Brand new text here</p>")).toEqual(["added"]);
  });

  it("finds a unit that moved", () => {
    expect(kinds("<p>Alpha text</p><p>Beta text</p><p>Gamma text</p>", "<p>Beta text</p><p>Gamma text</p><p>Alpha text</p>")).toEqual(["moved"]);
  });

  it("finds a change that is only markup", () => {
    const [change] = diffDocuments("<p>Hi</p>", '<p class="x">Hi</p>').changes;
    expect(change.kind === "modified" && change.markupOnly).toBe(true);
  });

  it("finds a changed style sheet", () => {
    expect(diffDocuments("<style>p{color:red}</style><p>A</p>", "<style>p{color:blue}</style><p>A</p>").css.changed).toBe(true);
  });

  it("keeps changes in the order of the new document", () => {
    const diff = diffDocuments("<p>One</p><p>Two</p><p>Three</p>", "<p>One</p><p>Two changed a lot here</p><p>Three</p><p>Four</p>");
    const indexes = diff.changes.map((c) => ("newIndex" in c ? c.newIndex : -1));
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
  });
});

describe("scope check", () => {
  it("calls a wording change text", () => {
    expect(actualScope(diffDocuments("<p>One two three four</p><p>Keep me</p><p>And me</p>", "<p>One two three five</p><p>Keep me</p><p>And me</p>"))).toBe("text");
  });

  it("calls added content a section change and a style change layout", () => {
    expect(actualScope(diffDocuments("<p>A</p><p>B</p><p>C</p>", "<p>A</p><p>B</p><p>C</p><p>D new</p>"))).toBe("section");
    expect(actualScope(diffDocuments("<style>p{color:red}</style><p>A</p><p>B</p>", "<style>p{color:blue}</style><p>A</p><p>B</p>"))).toBe("layout");
  });

  it("warns when the AI changed more than it said", () => {
    const diff = diffDocuments("<p>A</p><p>B</p><p>C</p><p>D</p>", "<p>A</p><p>B</p><p>X</p><p>Y</p>");
    const report = checkScope(diff, { scope: "text" });
    expect(report.broaderThanDeclared).toBe(true);
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it("flags changes outside the blocks the AI named", () => {
    const diff = diffDocuments('<p data-block="a">One two three four</p><p data-block="b">Five six seven eight</p>', '<p data-block="a">One two three CHANGED</p><p data-block="b">Five six seven CHANGED</p>');
    const report = checkScope(diff, { scope: "text", targets: ["a"] });
    expect(report.outsideTargets).toHaveLength(1);
  });

  it("flags a change to text the person wrote", () => {
    const edits = humanEditsBetween("<p>The original wording of this paragraph</p>", "<p>My own careful rewrite of this paragraph</p>");
    const diff = diffDocuments("<p>My own careful rewrite of this paragraph</p>", "<p>Something completely different</p>");
    expect(checkScope(diff, { scope: "text" }, edits).touchedHumanEdits).toHaveLength(1);
  });
});
