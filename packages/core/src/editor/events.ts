import type { Notice } from "../commands";
import type { ElementPath } from "../dom";
import type { EditorStatus } from "../editing";
import type { DocumentState } from "../model";

/** Everything an editor tells the host. */
export interface EditorEvents {
  /** The document changed. Save it. */
  state: [state: DocumentState, previous: DocumentState];
  status: [status: EditorStatus];
  /** Something worth showing that is not an error, such as content removed by the rules. */
  notice: [notice: Notice];
  /** The person clicked or typed in another element of the document. */
  selection: [path: ElementPath | null];
}

export type EditorEventName = keyof EditorEvents;
