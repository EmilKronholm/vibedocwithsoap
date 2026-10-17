import { describe, expect, it } from "vitest";
import {
  cleanModelHtml,
  collectUnits,
  elementAt,
  elementPath,
  isTextUnit,
  normalizeTextElements,
  normalizedText,
  parseHtml,
  parsePathKey,
  pathKey,
  pathOfStamped,
  setUnitText,
  stampPaths,
  toHtml,
  unitText,
} from "../src/dom";

describe("parseHtml and toHtml", () => {
  it("keeps the markup it was given", () => {
    const html = "<h1>Title</h1><p>Body</p>";
    expect(toHtml(parseHtml(html))).toBe(html);
  });

  it("keeps a top-level list item", () => {
    expect(toHtml(parseHtml("<li>One</li>"))).toBe("<li>One</li>");
  });

  it("strips a code fence and a doctype", () => {
    expect(cleanModelHtml("```html\n<p>Hi</p>\n```")).toBe("<p>Hi</p>");
    expect(cleanModelHtml("<!doctype html><p>Hi</p>")).toBe("<p>Hi</p>");
  });
});

describe("paths", () => {
  it("finds an element again from its path", () => {
    const root = parseHtml("<div><p>a</p><section><p>b</p><p>c</p></section></div>");
    const target = root.querySelectorAll("p")[2];
    const path = elementPath(target, root);
    expect(path).toEqual([0, 1, 1]);
    expect(elementAt(root, path)).toBe(target);
  });

  it("returns null for a path that leads nowhere", () => {
    expect(elementAt(parseHtml("<p>a</p>"), [3])).toBeNull();
  });

  it("converts to and from a key", () => {
    expect(pathKey([1, 0, 3])).toBe("1.0.3");
    expect(parsePathKey("1.0.3")).toEqual([1, 0, 3]);
    expect(parsePathKey("")).toEqual([]);
  });

  it("stamps every element with its own path", () => {
    const root = parseHtml("<div><p>a</p><p>b</p></div>");
    stampPaths(root);
    expect(pathOfStamped(root.querySelectorAll("p")[1])).toEqual([0, 1]);
  });
});

describe("units", () => {
  it("treats an element with only text and line breaks as a unit", () => {
    const root = parseHtml("<p>One<br>Two</p>");
    expect(isTextUnit(root.firstElementChild!)).toBe(true);
  });

  it("does not treat an element holding another element as a unit", () => {
    const root = parseHtml("<p>One <b>two</b></p>");
    expect(isTextUnit(root.firstElementChild!)).toBe(false);
  });

  it("keeps an empty paragraph as a unit but not an empty div", () => {
    const root = parseHtml("<p></p><div></div>");
    const [p, div] = Array.from(root.children);
    expect(isTextUnit(p)).toBe(true);
    expect(isTextUnit(div)).toBe(false);
  });

  it("collects the innermost text elements and images, in order", () => {
    const root = parseHtml("<section><h1>A</h1><ul><li>B</li><li>C</li></ul><img src='x.png'></section>");
    const units = collectUnits(root).map((el) => el.tagName.toLowerCase());
    expect(units).toEqual(["h1", "li", "li", "img"]);
  });

  it("skips style elements", () => {
    const root = parseHtml("<style>p{color:red}</style><p>A</p>");
    expect(collectUnits(root)).toHaveLength(1);
  });
});

describe("unit text", () => {
  it("reads a line break as a newline", () => {
    expect(unitText(parseHtml("<p>One<br>Two</p>").firstElementChild!)).toBe("One\nTwo");
  });

  it("writes newlines back as line breaks", () => {
    const root = parseHtml("<p>x</p>");
    const p = root.firstElementChild!;
    setUnitText(p, "One\nTwo");
    expect(p.innerHTML).toBe("One<br>Two");
  });

  it("collapses whitespace for comparison", () => {
    expect(normalizedText(parseHtml("<p>  a   b\n c </p>").firstElementChild!)).toBe("a b c");
  });
});

describe("normalizeTextElements", () => {
  it("wraps loose text next to an element so each piece stands alone", () => {
    const root = parseHtml("<p>Hello <b>there</b> friend</p>");
    normalizeTextElements(root);
    expect(toHtml(root)).toBe("<p><span>Hello</span> <b>there</b> <span>friend</span></p>");
  });

  it("leaves a plain text element alone", () => {
    const root = parseHtml("<p>Just text<br>and more</p>");
    normalizeTextElements(root);
    expect(toHtml(root)).toBe("<p>Just text<br>and more</p>");
  });
});
