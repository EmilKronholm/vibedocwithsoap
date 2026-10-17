import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InputTranslator, PresentationAdapter, UNIT_ATTR } from "../src/presentation";

function setup(html: string) {
  const container = document.createElement("div");
  document.body.append(container);
  const adapter = new PresentationAdapter(container);
  adapter.setup(html);
  return { container, adapter };
}

describe("presentation", () => {
  it("stamps every element with its path", () => {
    const { container } = setup("<div><p>a</p><p>b</p></div>");
    expect(container.querySelectorAll("p")[1].getAttribute("data-folio-path")).toBe("0.1");
  });

  it("marks the innermost text elements as units, not their containers", () => {
    const { container } = setup("<ul><li><p>one</p></li></ul>");
    expect(container.querySelector("p")?.hasAttribute(UNIT_ATTR)).toBe(true);
    expect(container.querySelector("li")?.hasAttribute(UNIT_ATTR)).toBe(false);
  });

  it("does not mark an element that holds other elements", () => {
    const { container } = setup("<p>Hello <b>there</b></p>");
    expect(container.querySelector("p")?.hasAttribute(UNIT_ATTR)).toBe(false);
  });

  it("finds an element again from its path", () => {
    const { adapter, container } = setup("<div><p>a</p><p>b</p></div>");
    expect(adapter.presentation.byPath([0, 1])).toBe(container.querySelectorAll("p")[1]);
  });

  it("finds the unit that contains a node", () => {
    const { adapter, container } = setup("<p>text</p>");
    const text = container.querySelector("p")!.firstChild!;
    expect(adapter.presentation.unitOf(text)).toBe(container.querySelector("p"));
  });
});

describe("adapter events", () => {
  it("reports a raw event as a folio event with the unit it happened in", () => {
    const { adapter, container } = setup("<p>x</p>");
    const handler = vi.fn();
    adapter.on("click", handler);
    container.querySelector("p")!.dispatchEvent(new Event("click", { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.unit).toBe(container.querySelector("p"));
  });

  it("stops reporting after destroy", () => {
    const { adapter, container } = setup("<p>x</p>");
    const handler = vi.fn();
    adapter.on("click", handler);
    adapter.destroy();
    container.querySelector("p")!.dispatchEvent(new Event("click", { bubbles: true }));
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("typing", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("sends the new text once typing pauses", () => {
    const { adapter, container } = setup("<p>Hello</p>");
    const sink = vi.fn().mockReturnValue({ ok: true, changed: true, notices: [] });
    new InputTranslator(adapter, adapter.presentation, sink);

    const p = container.querySelector("p")!;
    p.textContent = "Hello!";
    p.dispatchEvent(new Event("input", { bubbles: true }));
    expect(sink).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(sink).toHaveBeenCalledWith({ kind: "setText", path: [0], text: "Hello!" }, "typing");
  });

  it("sends one command for a burst of typing", () => {
    const { adapter, container } = setup("<p>a</p>");
    const sink = vi.fn().mockReturnValue({ ok: true, changed: true, notices: [] });
    new InputTranslator(adapter, adapter.presentation, sink);

    const p = container.querySelector("p")!;
    for (const text of ["ab", "abc", "abcd"]) {
      p.textContent = text;
      p.dispatchEvent(new Event("input", { bubbles: true }));
      vi.advanceTimersByTime(100);
    }
    vi.advanceTimersByTime(500);
    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink.mock.calls[0][0].text).toBe("abcd");
  });

  it("sends the text at once when focus leaves the element", () => {
    const { adapter, container } = setup("<p>a</p>");
    const sink = vi.fn().mockReturnValue({ ok: true, changed: true, notices: [] });
    new InputTranslator(adapter, adapter.presentation, sink);

    const p = container.querySelector("p")!;
    p.textContent = "b";
    p.dispatchEvent(new Event("input", { bubbles: true }));
    p.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(sink).toHaveBeenCalledTimes(1);
  });
});
