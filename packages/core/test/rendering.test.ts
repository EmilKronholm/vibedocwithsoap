import { describe, expect, it } from "vitest";
import { parseHtml, stampPaths, toHtml } from "../src/dom";
import { DEFAULT_PAGE } from "../src/model";
import { buildPrintableHtml, contentSecurityPolicy, findBreaks, paginate, type BoxReader } from "../src/rendering";

/**
 * A pretend browser: elements are stacked top to bottom. A leaf is as tall as
 * its `data-h`; a container is as tall as its children together.
 */
function stacked(root: Element): BoxReader {
  const boxes = new Map<Element, { top: number; bottom: number }>();
  let y = 0;
  const lay = (el: Element) => {
    // Out of the flow: it takes no room, as in a real browser.
    if (el.hasAttribute("data-out")) {
      boxes.set(el, { top: y, bottom: y });
      return;
    }
    const children = Array.from(el.children).filter((c) => c.tagName !== "STYLE");
    const top = y;
    if (children.length === 0) y += Number(el.getAttribute("data-h") ?? 0);
    else children.forEach(lay);
    boxes.set(el, { top, bottom: y });
  };
  Array.from(root.children).forEach(lay);
  return {
    top: (el) => boxes.get(el)!.top,
    bottom: (el) => boxes.get(el)!.bottom,
    outOfFlow: (el) => el.hasAttribute("data-out"),
    isRow: (el) => el.hasAttribute("data-row"),
  };
}

const para = (h: number, text = "p") => `<p data-h="${h}">${text}</p>`;
const pagesOf = (html: string, height: number) => {
  const root = parseHtml(html);
  stampPaths(root);
  return paginate(root, height, stacked(root)).map((page) => Array.from(page.querySelectorAll("p")).map((p) => p.textContent));
};

describe("breaking into pages", () => {
  it("needs no break when everything fits", () => {
    const root = parseHtml(para(100) + para(100));
    expect(findBreaks(root, 300, stacked(root))).toEqual([]);
  });

  it("moves what does not fit to the next page", () => {
    expect(pagesOf(para(100, "a") + para(100, "b") + para(100, "c") + para(100, "d"), 250)).toEqual([["a", "b"], ["c", "d"]]);
  });

  it("gives the same pages for the same document every time", () => {
    const html = para(100, "a") + para(100, "b") + para(100, "c");
    expect(pagesOf(html, 150)).toEqual(pagesOf(html, 150));
  });

  it("cuts inside a container when it runs over the page", () => {
    const html = `<section>${para(100, "a")}${para(100, "b")}${para(100, "c")}</section>`;
    expect(pagesOf(html, 250)).toEqual([["a", "b"], ["c"]]);
  });

  it("keeps a block that fits on one page together by moving it whole", () => {
    const html = para(200, "before") + `<section data-block="x">${para(100, "x1")}${para(100, "x2")}</section>`;
    expect(pagesOf(html, 300)).toEqual([["before"], ["x1", "x2"]]);
  });

  it("cuts a block that is taller than a page", () => {
    const html = `<section data-block="x">${para(200, "x1")}${para(200, "x2")}</section>`;
    expect(pagesOf(html, 250)).toEqual([["x1"], ["x2"]]);
  });

  it("lets something taller than a page overflow instead of leaving an empty page", () => {
    expect(pagesOf(para(500, "huge") + para(50, "after"), 200)).toEqual([["huge"], ["after"]]);
  });

  it("does not tear a row apart", () => {
    const html = para(150, "a") + `<div data-row>${`<p data-h="100">c1</p>`}${`<p data-h="100">c2</p>`}</div>`;
    const pages = pagesOf(html, 200);
    expect(pages.flat()).toEqual(["a", "c1", "c2"]);
    expect(pages).toHaveLength(2);
    expect(pages[1]).toEqual(["c1", "c2"]);
  });

  it("ignores positioned elements when deciding where to break", () => {
    const root = parseHtml(para(100, "a") + `<p data-h="999" data-out>float</p>` + para(100, "b"));
    expect(findBreaks(root, 250, stacked(root))).toEqual([]);
  });
});

describe("splitting", () => {
  it("repeats the style sheets on every page", () => {
    const root = parseHtml(`<style>p{color:red}</style>${para(100, "a")}${para(100, "b")}`);
    const pages = paginate(root, 150, stacked(root));
    expect(pages).toHaveLength(2);
    for (const page of pages) expect(page.querySelectorAll("style")).toHaveLength(1);
  });

  it("cuts a list into two lists and leaves no empty one behind", () => {
    const html = `<ul><li data-h="100">one</li><li data-h="100">two</li></ul>`;
    const root = parseHtml(html);
    const pages = paginate(root, 150, stacked(root));
    expect(pages.map(toHtml)).toEqual(['<ul><li data-h="100">one</li></ul>', '<ul><li data-h="100">two</li></ul>']);
  });

  it("does not leave an empty container on the page before a break at its first child", () => {
    const html = `${para(100, "a")}<ul><li data-h="100">one</li><li data-h="100">two</li></ul>`;
    const root = parseHtml(html);
    const pages = paginate(root, 150, stacked(root));
    expect(toHtml(pages[0])).not.toContain("<ul");
  });

  it("keeps each element's path so an edit on any page finds its place", () => {
    const root = parseHtml(`<div>${para(100, "a")}${para(100, "b")}</div>`);
    stampPaths(root);
    const pages = paginate(root, 150, stacked(root));
    expect(pages[1].querySelector("p")?.getAttribute("data-vibedoc-path")).toBe("0.1");
  });
});

describe("printing", () => {
  const page = (text: string) => parseHtml(`<p>${text}</p>`);

  it("lays out one sheet per page at the paper's size", () => {
    const html = buildPrintableHtml([page("one"), page("two")], DEFAULT_PAGE, { title: "Report" });
    expect(html.match(/vibedoc-print-page vibedoc-doc/g)).toHaveLength(2);
    expect(html).toContain("@page { size: 210mm 297mm; margin: 0; }");
    expect(html).toContain("<title>Report</title>");
  });

  it("gives the paper its colour", () => {
    const html = buildPrintableHtml([page("x")], { ...DEFAULT_PAGE, background: "#faf6ee" }, { title: "t" });
    expect(html).toContain("background:#faf6ee");
  });

  it("escapes the title", () => {
    expect(buildPrintableHtml([page("x")], DEFAULT_PAGE, { title: "<b>&" })).toContain("<title>&lt;b&gt;&amp;</title>");
  });

  it("limits what a document may load to the allowed origins", () => {
    const csp = contentSecurityPolicy(["https://fonts.example"]);
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("font-src data: https://fonts.example");
  });
});
