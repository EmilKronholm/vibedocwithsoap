import { describe, expect, it, vi } from "vitest";
import { isFailure } from "../src/commands";
import { EditingCore } from "../src/editing";
import { createState } from "../src/model";
import type { DocumentRules } from "../src/rules";

const make = (html = "<p>Hello</p>", rules?: DocumentRules) => new EditingCore({ initial: createState({ html }), rules });

describe("dispatching a person's edit", () => {
  it("changes the model and can be undone", () => {
    const core = make();
    const result = core.dispatch({ kind: "setText", path: [0], text: "Bye" });
    expect(result.ok).toBe(true);
    expect(core.model.get().html).toBe("<p>Bye</p>");
    expect(core.canUndo).toBe(true);

    core.dispatch({ kind: "undo" });
    expect(core.model.get().html).toBe("<p>Hello</p>");
    expect(core.canRedo).toBe(true);
  });

  it("tells subscribers about the new state", () => {
    const core = make();
    const listener = vi.fn();
    core.model.subscribe(listener);
    core.dispatch({ kind: "setText", path: [0], text: "Bye" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("reports an unchanged document as not changed", () => {
    const result = make().dispatch({ kind: "setText", path: [0], text: "Hello" });
    expect(result.ok && result.changed).toBe(false);
  });

  it("fails on a path that leads nowhere, leaving the document alone", () => {
    const core = make();
    const result = core.dispatch({ kind: "setText", path: [9], text: "x" });
    expect(isFailure(result) && result.error.code).toBe("invalid");
    expect(core.model.get().html).toBe("<p>Hello</p>");
  });

  it("counts a burst of typing in one element as one undo step", () => {
    const core = make();
    core.dispatch({ kind: "setText", path: [0], text: "A" });
    core.dispatch({ kind: "setText", path: [0], text: "AB" });
    core.dispatch({ kind: "setText", path: [0], text: "ABC" });
    core.dispatch({ kind: "undo" });
    expect(core.model.get().html).toBe("<p>Hello</p>");
  });

  it("keeps the initial version and merges the typing into one", () => {
    const core = make();
    core.dispatch({ kind: "setText", path: [0], text: "A" });
    core.dispatch({ kind: "setText", path: [0], text: "AB" });
    expect(core.versions.map((v) => v.summary ?? v.author)).toEqual(["Initial document", "human"]);
  });
});

describe("the status lock", () => {
  it("refuses edits while the AI works", () => {
    const core = make();
    core.status.set("working");
    const result = core.dispatch({ kind: "setText", path: [0], text: "x" });
    expect(isFailure(result) && result.error.code).toBe("locked");
  });

  it("refuses review commands when there is nothing to review", () => {
    const result = make().dispatch({ kind: "finishReview" });
    expect(isFailure(result) && result.error.code).toBe("no-review");
  });
});

describe("who may do what", () => {
  it("does not let the AI edit directly", () => {
    const result = make().dispatch({ kind: "setText", path: [0], text: "x" }, "ai");
    expect(isFailure(result) && result.error.code).toBe("not-allowed");
  });

  it("uses the permissions the rules give", () => {
    const core = make("<p>Hello</p>", { permissions: { human: ["setText"] } });
    expect(core.dispatch({ kind: "setText", path: [0], text: "x" }).ok).toBe(true);
    const removal = core.dispatch({ kind: "removeElement", path: [0] });
    expect(isFailure(removal) && removal.error.code).toBe("not-allowed");
  });
});

describe("the rules", () => {
  it("refuse a person's change that breaks them and leave the document alone", () => {
    const core = make("<p>Hello</p>", { fonts: ["Inter"] });
    const result = core.dispatch({ kind: "setInlineStyle", path: [0], property: "font-family", value: "Papyrus" });
    expect(isFailure(result) && result.error.code).toBe("rule-violation");
    expect(core.model.get().html).toBe("<p>Hello</p>");
  });

  it("refuse replacing the document with content they do not allow", () => {
    const core = make("<p>Hello</p>", { content: "text" });
    const result = core.dispatch({ kind: "replaceAll", html: '<p>Hi</p><img src="https://example.com/a.png">' });
    expect(isFailure(result) && result.error.code).toBe("rule-violation");
  });

  it("clean the initial document", () => {
    const core = make('<p onclick="x()">Hi</p><script>bad()</script>');
    expect(core.model.get().html).toBe("<p>Hi</p>");
  });
});

describe("versions", () => {
  it("restores an earlier version as a new one", () => {
    const core = make();
    const first = core.versions[0];
    core.dispatch({ kind: "setText", path: [0], text: "Changed" });
    core.dispatch({ kind: "restoreVersion", id: first.id });
    expect(core.model.get().html).toBe("<p>Hello</p>");
    expect(core.versions.at(-1)?.summary).toMatch(/Restored/);
  });

  it("fails for a version that does not exist", () => {
    const result = make().dispatch({ kind: "restoreVersion", id: "nope" });
    expect(isFailure(result) && result.error.code).toBe("invalid");
  });
});
