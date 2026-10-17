import type { Command, EditResult } from "../../commands";

/** Where the adapter sends the commands it makes from browser events. */
export type CommandSink = (command: Command, origin?: "typing") => EditResult;
