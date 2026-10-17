import { failed } from "../../commands";
import { addFontImport } from "../../fonts";
import { formatKnobValue, readKnobs, setKnobs } from "../../knobs";
import type { DocumentState } from "../../model";
import type { ApplyOutcome, StateCommand } from "./types";

/** Runs a command that works on the whole state rather than on a parsed tree. */
export function runStateCommand(state: DocumentState, command: StateCommand): ApplyOutcome {
  switch (command.kind) {
    case "replaceAll":
      return { state: { ...state, html: command.html } };
    case "setPage":
      return { state: { ...state, page: command.page } };
    case "addFontImport":
      return { state: { ...state, html: addFontImport(state.html, command.url) } };
    case "setKnob":
      return setKnob(state, command.name, command.value);
  }
}

function setKnob(state: DocumentState, name: string, value: string | number): ApplyOutcome {
  const knob = readKnobs(state.html).find((k) => k.name === name);
  if (!knob) return failed("invalid", `The document has no setting called ${name}.`);
  return { state: { ...state, html: setKnobs(state.html, { [name]: formatKnobValue(knob, value) }) } };
}
