import { Emitter } from "./emitter";

/** Named events with typed arguments. `Events` maps each name to its argument list. */
export class EventBus<Events extends { [K in keyof Events]: unknown[] }> {
  readonly #emitters = new Map<keyof Events, Emitter<unknown[]>>();

  on<K extends keyof Events>(name: K, listener: (...args: Events[K]) => void): () => void {
    return this.#emitter(name).on(listener as (...args: unknown[]) => void);
  }

  emit<K extends keyof Events>(name: K, ...args: Events[K]): void {
    this.#emitters.get(name)?.emit(...args);
  }

  clear(): void {
    this.#emitters.forEach((emitter) => emitter.clear());
    this.#emitters.clear();
  }

  #emitter(name: keyof Events): Emitter<unknown[]> {
    let emitter = this.#emitters.get(name);
    if (!emitter) {
      emitter = new Emitter<unknown[]>();
      this.#emitters.set(name, emitter);
    }
    return emitter;
  }
}
