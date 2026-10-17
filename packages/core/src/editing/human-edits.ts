import { humanEditsBetween } from "../diff";
import type { EditingContext } from "./context";

/** Text the person typed since the AI's last version. The AI is told to leave it alone, and the review flags changes to it. */
export function humanEditsSinceAi({ committer, model }: Pick<EditingContext, "committer" | "model">): string[] {
  const lastAi = committer.versions.lastBy("ai");
  const current = model.get().html;
  return lastAi && lastAi.state.html !== current ? humanEditsBetween(lastAi.state.html, current) : [];
}
