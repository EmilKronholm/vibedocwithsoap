import { describe, expect, it } from "vitest";
import { textBox, type DocumentCommand } from "../src/commands";
import { applyDocumentCommand, isFailure } from "../src/editing/apply";
import { DEFAULT_PAGE, createState } from "../src/model";

function run(html: string, command: DocumentCommand) {
  return applyDocumentCommand(createState({ html }), command);
}

function htmlAfter(html: string, command: DocumentCommand): string {
  const outcome = run(html, command);
  if (isFailure(outcome)) throw new Error(`expected success, got ${outcome.error.code}: ${outcome.error.message}`);
  return outcome.state.html;
}

function failureOf(html: string, command: DocumentCommand) {
  const outcome = run(html, command);
  if (!isFailure(outcome)) throw new Error("expected a failure");
  return outcome.error;
}

describe("setText", () => {
  it("replaces the text of a text element and turns newlines into line breaks", () => {
    expect(htmlAfter("<p>Hello</p>", { kind: "setText", path: [0], text: "Bye\nthere" })).toBe("<p>Bye<br>there</p>");
  });

  it("refuses an element that holds other elements", () => {
    expect(failureOf("<div><p>x</p></div>", { kind: "setText", path: [0], text: "y" }).code).toBe("invalid");
  });

  it("refuses a path that leads nowhere", () => {
    expect(failureOf("<p>x</p>", { kind: "setText", path: [4], text: "y" }).code).toBe("invalid");
  });
});

describe("splitUnit", () => {
  it("moves the text after the caret into a new element below", () => {
    const outcome = run('<p data-block="a">Hello world</p>', { kind: "splitUnit", path: [0], offset: 5 });
    if (isFailure(outcome)) throw new Error("failed");
    expect(outcome.state.html).toBe('<p data-block="a">Hello</p><p> world</p>');
    expect(outcome.focus).toEqual({ path: [1], offset: 0 });
  });

  it("clamps an offset past the end", () => {
    expect(htmlAfter("<p>Hi</p>", { kind: "splitUnit", path: [0], offset: 99 })).toBe("<p>Hi</p><p></p>");
  });

  it("refuses where Enter should break the line instead", () => {
    expect(failureOf("<div>Hi</div>", { kind: "splitUnit", path: [0], offset: 1 }).code).toBe("invalid");
  });
});

describe("mergeUnits", () => {
  it("joins an element with the one before it", () => {
    const outcome = run("<p>One</p><p>Two</p>", { kind: "mergeUnits", path: [1], direction: "previous" });
    if (isFailure(outcome)) throw new Error("failed");
    expect(outcome.state.html).toBe("<p>OneTwo</p>");
    expect(outcome.focus).toEqual({ path: [0], offset: 3 });
  });

  it("joins an element with the one after it", () => {
    expect(htmlAfter("<p>One</p><p>Two</p>", { kind: "mergeUnits", path: [0], direction: "next" })).toBe("<p>OneTwo</p>");
  });

  it("does not let one kind of element swallow another", () => {
    expect(failureOf("<h1>A</h1><p>B</p>", { kind: "mergeUnits", path: [1], direction: "previous" }).code).toBe("nothing-to-do");
  });

  it("removes an empty element of a different kind", () => {
    expect(htmlAfter("<h1>A</h1><p></p>", { kind: "mergeUnits", path: [1], direction: "previous" })).toBe("<h1>A</h1>");
  });

  it("does nothing at the edge of the document", () => {
    expect(failureOf("<p>A</p>", { kind: "mergeUnits", path: [0], direction: "previous" }).code).toBe("nothing-to-do");
  });
});

describe("structure", () => {
  it("moves an element up", () => {
    expect(htmlAfter("<p>1</p><p>2</p>", { kind: "moveElement", path: [1], direction: "up" })).toBe("<p>2</p><p>1</p>");
  });

  it("does not move past a style element as if it were content", () => {
    expect(failureOf("<style>x</style><p>1</p>", { kind: "moveElement", path: [1], direction: "up" }).code).toBe("nothing-to-do");
  });

  it("duplicates an element and keeps block ids unique", () => {
    const html = htmlAfter('<section data-block="a"><p>x</p></section>', { kind: "duplicateElement", path: [0] });
    expect(html).toContain('data-block="a"');
    expect(html).toContain('data-block="a-copy"');
  });

  it("removes an element", () => {
    expect(htmlAfter("<p>1</p><p>2</p>", { kind: "removeElement", path: [0] })).toBe("<p>2</p>");
  });

  it("inserts an element after another and puts the caret at the end of its text", () => {
    const outcome = run("<p>a</p>", { kind: "insertElement", after: [0], element: { tag: "p", text: "b" } });
    if (isFailure(outcome)) throw new Error("failed");
    expect(outcome.state.html).toBe("<p>a</p><p>b</p>");
    expect(outcome.focus).toEqual({ path: [1], offset: 1 });
  });

  it("inserts at the end", () => {
    expect(htmlAfter("<p>a</p>", { kind: "insertElement", after: "end", element: { tag: "h2", text: "T" } })).toBe("<p>a</p><h2>T</h2>");
  });

  it("refuses something that is not a tag name", () => {
    expect(failureOf("<p>a</p>", { kind: "insertElement", after: "end", element: { tag: "p onclick=x" } }).code).toBe("invalid");
  });

  it("inserts a positioned text box", () => {
    const html = htmlAfter("<p>a</p>", { kind: "insertElement", after: "end", element: textBox({ left: 10, top: 20 }) });
    expect(html).toContain("position: absolute");
    expect(html).toContain("left: 10px");
  });
});

describe("styles", () => {
  it("sets and clears an inline style property", () => {
    const set = htmlAfter("<p>x</p>", { kind: "setInlineStyle", path: [0], property: "color", value: "red" });
    expect(set).toContain("color: red");
    const cleared = htmlAfter(set, { kind: "setInlineStyle", path: [0], property: "color", value: null });
    expect(cleared).toBe("<p>x</p>");
  });

  it("replaces an element's whole inline CSS", () => {
    expect(htmlAfter('<p style="color:red">x</p>', { kind: "setInlineCss", path: [0], css: "margin: 0" })).toContain("margin: 0");
  });

  it("edits a style sheet", () => {
    expect(htmlAfter("<style>a{}</style><p>x</p>", { kind: "setStylesheet", index: 0, css: "p{color:blue}" })).toContain("p{color:blue}");
  });

  it("refuses a style sheet that does not exist", () => {
    expect(failureOf("<p>x</p>", { kind: "setStylesheet", index: 0, css: "" }).code).toBe("invalid");
  });
});

describe("whole-state commands", () => {
  const withKnob = "<style>:root { --size: 11pt; /* @knob \"Size\" 8..16 step 1 */ }</style><p>x</p>";

  it("sets a knob, clamped to its range and with its unit", () => {
    expect(htmlAfter(withKnob, { kind: "setKnob", name: "--size", value: 99 })).toContain("--size: 16pt;");
  });

  it("refuses a knob the document does not declare", () => {
    expect(failureOf("<p>x</p>", { kind: "setKnob", name: "--nope", value: 1 }).code).toBe("invalid");
  });

  it("replaces the whole document", () => {
    expect(htmlAfter("<p>a</p>", { kind: "replaceAll", html: "<p>b</p>" })).toBe("<p>b</p>");
  });

  it("changes the page", () => {
    const outcome = run("<p>a</p>", { kind: "setPage", page: { ...DEFAULT_PAGE, size: "Letter" } });
    if (isFailure(outcome)) throw new Error("failed");
    expect(outcome.state.page.size).toBe("Letter");
  });

  it("adds a font import once", () => {
    const url = "https://fonts.googleapis.com/css2?family=Inter";
    const once = htmlAfter("<style>p{}</style><p>a</p>", { kind: "addFontImport", url });
    expect(once).toContain(`@import url("${url}")`);
    expect(htmlAfter(once, { kind: "addFontImport", url }).split("@import").length).toBe(2);
  });
});
