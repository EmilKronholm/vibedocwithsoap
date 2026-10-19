import type { AiProvider } from "@folio/core";
import { claudeAi } from "./claude";
import { friendlyAi } from "./friendly";
import { misbehavingAi } from "./misbehaving";

export interface ProviderChoice {
  name: string;
  /** What to expect from it. */
  about: string;
  provider: AiProvider;
}

export const PROVIDERS: ProviderChoice[] = [
  { name: "Friendly mock", about: "Does what it says and declares it honestly. Try the instruction buttons.", provider: friendlyAi() },
  {
    name: "Misbehaving mock",
    about: "Says it fixed a typo, then rewrites other text, removes a section, restyles, and adds things a document may not contain. The review and the rules catch it.",
    provider: misbehavingAi(),
  },
  { name: "Claude (key in this browser, demo only)", about: "A real model. The key is typed into the page, which is only acceptable for a demo.", provider: claudeAi() },
];
