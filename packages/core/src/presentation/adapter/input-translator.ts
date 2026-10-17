import { KeyHandler } from "./key-handler";
import { PasteHandler } from "./paste-handler";
import type { PresentationAdapter } from "./presentation-adapter";
import { SelectionTracker } from "./selection-tracker";
import type { CommandSink } from "./sink";
import { TextCommitter } from "./text-committer";

/** Turns native browser input into commands. Owns the handlers for typing, keys, paste and selection. */
export class InputTranslator {
  readonly text: TextCommitter;
  readonly selection: SelectionTracker;

  constructor(adapter: PresentationAdapter, sink: CommandSink) {
    this.text = new TextCommitter(adapter, sink);
    this.selection = new SelectionTracker(adapter);
    new KeyHandler(adapter, sink, () => this.text.flush());
    new PasteHandler(adapter);
  }

  destroy(): void {
    this.text.destroy();
  }
}
