import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PAGE,
  UndoHistory,
  VersionLog,
  createSnapshot,
  createState,
  createStateModel,
  pageGeometry,
  parseSnapshot,
  safeColor,
} from "../src/model";

describe("state model", () => {
  it("tells subscribers what changed", () => {
    const { model, writer } = createStateModel(createState({ html: "a" }));
    const listener = vi.fn();
    model.subscribe(listener);
    writer.commit(createState({ html: "b" }));
    expect(listener).toHaveBeenCalledWith(createState({ html: "b" }), createState({ html: "a" }));
    expect(model.get().html).toBe("b");
  });

  it("stays quiet when nothing changed", () => {
    const { model, writer } = createStateModel(createState({ html: "a" }));
    const listener = vi.fn();
    model.subscribe(listener);
    writer.commit(createState({ html: "a" }));
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops telling a subscriber that unsubscribed", () => {
    const { model, writer } = createStateModel(createState());
    const listener = vi.fn();
    model.subscribe(listener)();
    writer.commit(createState({ html: "x" }));
    expect(listener).not.toHaveBeenCalled();
  });

  it("gives readers no way to write", () => {
    const { model } = createStateModel(createState());
    expect("commit" in model).toBe(false);
  });
});

describe("undo history", () => {
  const at = (html: string) => createState({ html });

  it("goes back and forward", () => {
    const history = new UndoHistory();
    history.record(at("1"));
    history.record(at("2"));
    expect(history.undo(at("3"))).toEqual(at("2"));
    expect(history.undo(at("2"))).toEqual(at("1"));
    expect(history.redo(at("1"))).toEqual(at("2"));
  });

  it("returns null when there is nothing to undo or redo", () => {
    const history = new UndoHistory();
    expect(history.undo(at("1"))).toBeNull();
    expect(history.redo(at("1"))).toBeNull();
  });

  it("forgets the future after a new edit", () => {
    const history = new UndoHistory();
    history.record(at("1"));
    history.undo(at("2"));
    history.record(at("1"));
    expect(history.canRedo).toBe(false);
  });

  it("counts a quick burst with the same key as one step", () => {
    let now = 0;
    const history = new UndoHistory({ now: () => now });
    history.record(at("a"), "typing");
    now = 100;
    history.record(at("ab"), "typing");
    now = 200;
    history.record(at("abc"), "typing");
    expect(history.undo(at("abcd"))).toEqual(at("a"));
    expect(history.canUndo).toBe(false);
  });

  it("starts a new step once the burst is over", () => {
    let now = 0;
    const history = new UndoHistory({ now: () => now });
    history.record(at("a"), "typing");
    now = 5000;
    history.record(at("ab"), "typing");
    expect(history.undo(at("abc"))).toEqual(at("ab"));
    expect(history.undo(at("ab"))).toEqual(at("a"));
  });
});

describe("version log", () => {
  const make = () => {
    let n = 0;
    return new VersionLog([], { newId: () => `v${++n}`, now: () => new Date("2026-01-01T00:00:00Z") });
  };

  it("merges consecutive human edits into one version", () => {
    const log = make();
    log.record(createState({ html: "a" }), "ai", "first");
    log.record(createState({ html: "b" }), "human");
    log.record(createState({ html: "c" }), "human");
    expect(log.list().map((v) => v.author)).toEqual(["ai", "human"]);
    expect(log.head()?.state.html).toBe("c");
  });

  it("keeps every AI version", () => {
    const log = make();
    log.record(createState({ html: "a" }), "ai");
    log.record(createState({ html: "b" }), "ai");
    expect(log.list()).toHaveLength(2);
    expect(log.head()?.parentId).toBe("v1");
  });

  it("finds the last version by an author", () => {
    const log = make();
    log.record(createState({ html: "a" }), "ai", "x");
    log.record(createState({ html: "b" }), "human");
    expect(log.lastBy("ai")?.summary).toBe("x");
  });
});

describe("snapshot", () => {
  it("round-trips through JSON", () => {
    const snapshot = createSnapshot(createState({ html: "<p>x</p>" }), []);
    expect(parseSnapshot(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  it("rejects something that is not a snapshot", () => {
    expect(() => parseSnapshot({ schemaVersion: 9 })).toThrow();
    expect(() => parseSnapshot(null)).toThrow();
  });

  it("fills in a missing page", () => {
    const parsed = parseSnapshot({ schemaVersion: 1, state: { html: "x" } });
    expect(parsed.state.page).toEqual(DEFAULT_PAGE);
  });
});

describe("page", () => {
  it("computes the content area", () => {
    const g = pageGeometry(DEFAULT_PAGE);
    expect(g.contentHeight).toBeCloseTo(g.height - g.margin.top - g.margin.bottom);
    expect(g.contentWidth).toBeCloseTo(g.width - g.margin.left - g.margin.right);
  });

  it("falls back to white for a colour that could carry CSS", () => {
    expect(safeColor("#faf6ee")).toBe("#faf6ee");
    expect(safeColor("red; background: url(x)")).toBe("#fff");
    expect(safeColor(undefined)).toBe("#fff");
  });
});
