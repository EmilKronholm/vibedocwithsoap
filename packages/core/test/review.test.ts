import { describe, expect, it, vi } from "vitest";
import { AiCommander, readAiResult, type AiProvider, type AiResult } from "../src/ai";
import { isFailure, type Notice } from "../src/commands";
import { EditingCore } from "../src/editing";
import { createState } from "../src/model";
import type { DocumentRules } from "../src/rules";

const BASE = "<p>The quick brown fox jumps over the lazy dog today</p><p>Second paragraph stays right here</p>";
const EDITED = "<p>The quick brown fox leaps over the sleepy dog today</p><p>Second paragraph stays right here now</p>";

const make = (html = BASE, rules?: DocumentRules) => new EditingCore({ initial: createState({ html }), rules });

// What the AI commander does before handing in a revision.
function propose(core: EditingCore, html: string, extra: Partial<AiResult> = {}) {
  core.status.set("working");
  return core.dispatch({ kind: "proposeAi", html, summary: "Reworded", scope: "text", ...extra }, "ai");
}

describe("an AI revision", () => {
  it("waits for review instead of changing the document", () => {
    const core = make();
    propose(core, EDITED);
    expect(core.status.current).toBe("reviewing");
    expect(core.model.get().html).toBe(BASE);
    expect(core.review?.changes).toHaveLength(2);
  });

  it("is kept in full when every change is accepted", () => {
    const core = make();
    propose(core, EDITED);
    core.dispatch({ kind: "finishReview" });
    expect(core.model.get().html).toBe(EDITED);
    expect(core.status.current).toBe("idle");
    expect(core.versions.at(-1)?.author).toBe("ai");
  });

  it("leaves the document alone when every change is undone", () => {
    const core = make();
    propose(core, EDITED);
    core.dispatch({ kind: "decideAll", accepted: false });
    core.dispatch({ kind: "finishReview" });
    expect(core.model.get().html).toBe(BASE);
  });

  it("keeps some changes and undoes others", () => {
    const core = make();
    propose(core, EDITED);
    const [first] = core.review!.changes;
    core.dispatch({ kind: "decideChange", id: first.id, accepted: false });
    core.dispatch({ kind: "finishReview" });
    expect(core.model.get().html).toBe("<p>The quick brown fox jumps over the lazy dog today</p><p>Second paragraph stays right here now</p>");
    expect(core.versions.at(-1)?.summary).toMatch(/partly kept/);
  });

  it("can be discarded", () => {
    const core = make();
    propose(core, EDITED);
    core.dispatch({ kind: "discardReview" });
    expect(core.model.get().html).toBe(BASE);
    expect(core.status.current).toBe("idle");
    expect(core.review).toBeNull();
  });

  it("brings back a removed paragraph in its place when the removal is undone", () => {
    const core = make("<p>First paragraph of the text</p><p>Middle paragraph that goes away</p><p>Last paragraph of the text</p>");
    propose(core, "<p>First paragraph of the text</p><p>Last paragraph of the text</p>");
    core.dispatch({ kind: "decideAll", accepted: false });
    core.dispatch({ kind: "finishReview" });
    expect(core.model.get().html).toBe("<p>First paragraph of the text</p><p>Middle paragraph that goes away</p><p>Last paragraph of the text</p>");
  });

  it("is dropped without a review when it changes nothing", () => {
    const core = make();
    const notices: Notice[] = [];
    core.onNotice((n) => notices.push(n));
    const result = propose(core, BASE);
    expect(result.ok && result.changed).toBe(false);
    expect(core.status.current).toBe("idle");
    expect(notices[0].code).toBe("unchanged");
  });

  it("is cleaned under the rules and the removal is reported", () => {
    const core = make("<p>Hello there friend</p>", { content: "text" });
    propose(core, '<p>Hello there dear friend</p><img src="https://example.com/a.png">');
    expect(core.review?.violations.map((v) => v.detail)).toEqual(["image"]);
    core.dispatch({ kind: "finishReview" });
    expect(core.model.get().html).not.toContain("<img");
  });

  it("flags a change outside the blocks the AI named", () => {
    const core = make('<p data-block="a">One two three four five</p><p data-block="b">Six seven eight nine ten</p>');
    propose(core, '<p data-block="a">One two three four SIX</p><p data-block="b">Six seven eight nine TEN</p>', { targets: ["a"] });
    expect(core.review?.changes.filter((c) => c.flags.includes("outside-targets"))).toHaveLength(1);
  });
});

describe("who may do what in a review", () => {
  it("does not let a person hand in AI work", () => {
    const result = make().dispatch({ kind: "proposeAi", html: EDITED, summary: "", scope: "text" }, "human");
    expect(isFailure(result) && result.error.code).toBe("not-allowed");
  });

  it("does not let the AI decide on its own revision", () => {
    const core = make();
    propose(core, EDITED);
    const result = core.dispatch({ kind: "finishReview" }, "ai");
    expect(isFailure(result) && result.error.code).toBe("not-allowed");
  });

  it("locks editing while a revision is open", () => {
    const core = make();
    propose(core, EDITED);
    const result = core.dispatch({ kind: "setText", path: [0], text: "x" });
    expect(isFailure(result) && result.error.code).toBe("locked");
  });
});

describe("a whole new document from the AI", () => {
  it("replaces the document at once and can be undone", () => {
    const core = make();
    core.status.set("working");
    core.dispatch({ kind: "applyAiDocument", html: "<h1>New</h1>", summary: "Wrote it", scope: "whole" }, "ai");
    expect(core.model.get().html).toBe("<h1>New</h1>");
    expect(core.status.current).toBe("idle");
    core.dispatch({ kind: "undo" });
    expect(core.model.get().html).toBe(BASE);
  });
});

describe("the AI commander", () => {
  const result = (html: string): AiResult => ({ html, summary: "Done", scope: "whole" });
  const run = (core: EditingCore, provider: AiProvider | null) => new AiCommander(core, () => provider);

  it("composes a document", async () => {
    const core = make("");
    const outcome = await run(core, async () => result("<p>Written</p>")).compose("Write something");
    expect(outcome.ok).toBe(true);
    expect(core.model.get().html).toBe("<p>Written</p>");
  });

  it("revises into a review", async () => {
    const core = make();
    await run(core, async () => result(EDITED)).revise("Reword");
    expect(core.status.current).toBe("reviewing");
  });

  it("sends the document, the page and the rules in the request", async () => {
    const core = make(BASE, { content: "rich" });
    const provider = vi.fn(async () => result(EDITED));
    await run(core, provider).revise("Reword");
    const [request] = provider.mock.calls[0];
    expect(request).toMatchObject({ kind: "revise", html: BASE, instruction: "Reword", rules: { content: "rich" } });
  });

  it("tells the AI which text the person wrote", async () => {
    const core = make();
    core.status.set("working");
    core.dispatch({ kind: "applyAiDocument", html: "<p>An AI paragraph that was written first</p>", summary: "", scope: "whole" }, "ai");
    core.dispatch({ kind: "setText", path: [0], text: "A paragraph the person rewrote completely themselves" });
    const provider = vi.fn(async () => result("<p>x</p>"));
    await run(core, provider).revise();
    expect(provider.mock.calls[0][0].humanEdits).toEqual(["A paragraph the person rewrote completely themselves"]);
  });

  it("goes back to idle when the provider fails", async () => {
    const core = make();
    const outcome = await run(core, async () => {
      throw new Error("boom");
    }).revise();
    expect(isFailure(outcome) && outcome.error.code).toBe("ai-error");
    expect(core.status.current).toBe("idle");
  });

  it("can be cancelled", async () => {
    const core = make();
    const commander = run(core, (_request, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted")))));
    const pending = commander.revise();
    commander.cancel();
    const outcome = await pending;
    expect(isFailure(outcome) && outcome.error.code).toBe("cancelled");
    expect(core.status.current).toBe("idle");
  });

  it("says so when there is no provider", async () => {
    const outcome = await run(make(), null).revise();
    expect(isFailure(outcome) && outcome.error.code).toBe("no-provider");
  });

  it("refuses to start while something else is open", async () => {
    const core = make();
    core.status.set("reviewing");
    const outcome = await run(core, async () => result(EDITED)).revise();
    expect(isFailure(outcome) && outcome.error.code).toBe("locked");
  });

  it("reads a usable result and rejects an empty one", () => {
    expect(readAiResult({ html: "<p>x</p>", summary: "s", scope: "text" })?.scope).toBe("text");
    expect(readAiResult({ html: "  " })).toBeNull();
    expect(readAiResult({ html: "<p>x</p>", scope: "nonsense" })?.scope).toBe("whole");
  });
});
