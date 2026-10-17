import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSnapshot, createState } from "../src/model";
import { Autosave, LocalStorageStore, MemoryStore, type SnapshotSource } from "../src/persistence";

const snapshot = (html: string) => createSnapshot(createState({ html }), []);

function source(initial = "a") {
  let html = initial;
  const listeners = new Set<() => void>();
  const api: SnapshotSource & { change(next: string): void } = {
    onChange: (listener) => (listeners.add(listener), () => listeners.delete(listener)),
    snapshot: () => snapshot(html),
    change(next) {
      html = next;
      listeners.forEach((l) => l());
    },
  };
  return api;
}

describe("stores", () => {
  it("returns nothing when nothing was saved", async () => {
    expect(await new MemoryStore().load()).toBeNull();
  });

  it("returns what was saved", async () => {
    const store = new MemoryStore();
    await store.save(snapshot("<p>x</p>"));
    expect((await store.load())?.state.html).toBe("<p>x</p>");
  });

  it("keeps a document in local storage and treats a damaged save as none", async () => {
    const data = new Map<string, string>();
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
    const store = new LocalStorageStore("doc", storage);
    expect(await store.load()).toBeNull();
    await store.save(snapshot("<p>x</p>"));
    expect((await store.load())?.state.html).toBe("<p>x</p>");
    data.set("doc", "{not json");
    expect(await store.load()).toBeNull();
  });
});

describe("autosave", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("saves once after a burst of changes", async () => {
    const store = new MemoryStore();
    const save = vi.spyOn(store, "save");
    const src = source();
    new Autosave(src, store, { delayMs: 100 });

    src.change("b");
    src.change("c");
    await vi.advanceTimersByTimeAsync(150);
    expect(save).toHaveBeenCalledTimes(1);
    expect((await store.load())?.state.html).toBe("c");
  });

  it("reports saving and saved", async () => {
    const src = source();
    const autosave = new Autosave(src, new MemoryStore(), { delayMs: 10 });
    const states: string[] = [];
    autosave.onStatus((s) => states.push(s.state));
    src.change("b");
    await vi.advanceTimersByTimeAsync(50);
    expect(states).toEqual(["saving", "saved"]);
  });

  it("saves a change made during a save once the save finishes", async () => {
    let release!: () => void;
    const saved: string[] = [];
    const store = {
      load: async () => null,
      save: vi.fn(async (s) => {
        saved.push(s.state.html);
        if (saved.length === 1) await new Promise<void>((resolve) => (release = resolve));
      }),
    };
    const src = source();
    const autosave = new Autosave(src, store, { delayMs: 10 });

    src.change("b");
    await vi.advanceTimersByTimeAsync(20);
    src.change("c");
    await vi.advanceTimersByTimeAsync(20);
    expect(store.save).toHaveBeenCalledTimes(1);

    release();
    await autosave.flush();
    expect(saved).toEqual(["b", "c"]);
  });

  it("reports an error and tries again on the next change", async () => {
    let fail = true;
    const store = {
      load: async () => null,
      save: vi.fn(async () => {
        if (fail) throw new Error("offline");
      }),
    };
    const src = source();
    const autosave = new Autosave(src, store, { delayMs: 10 });
    const states: string[] = [];
    autosave.onStatus((s) => states.push(s.state));

    src.change("b");
    await vi.advanceTimersByTimeAsync(20);
    expect(states).toEqual(["saving", "error"]);

    fail = false;
    src.change("c");
    await vi.advanceTimersByTimeAsync(20);
    expect(states.at(-1)).toBe("saved");
  });

  it("flush saves at once", async () => {
    const store = new MemoryStore();
    const src = source();
    const autosave = new Autosave(src, store, { delayMs: 10_000 });
    src.change("b");
    await autosave.flush();
    expect((await store.load())?.state.html).toBe("b");
  });
});
