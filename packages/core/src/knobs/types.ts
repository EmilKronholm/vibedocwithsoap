/** A control a document declares for itself: a CSS variable on `:root` with a `@knob` comment. */
export type Knob =
  | { kind: "number"; name: string; label: string; value: number; unit: string; min: number; max: number; step: number }
  | { kind: "color"; name: string; label: string; value: string }
  | { kind: "options"; name: string; label: string; value: string; options: string[] };
