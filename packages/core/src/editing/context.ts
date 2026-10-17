import type { Command, EditResult, Notice } from "../commands";
import type { Actor, ReadonlyStateModel } from "../model";
import type { Committer } from "./committer";
import type { ReviewStore } from "./review-store";
import type { RuleGate } from "./rule-gate";
import type { StatusMachine } from "./status";

/** What a handler may use. Handlers are given this and nothing else. */
export interface EditingContext {
  model: ReadonlyStateModel;
  committer: Committer;
  gate: RuleGate;
  status: StatusMachine;
  review: ReviewStore;
}

/** Knows how to run one group of commands. */
export interface CommandHandler {
  handles(kind: Command["kind"]): boolean;
  run(command: Command, actor: Actor): EditResult;
}

export type NoticeListener = (notice: Notice) => void;
