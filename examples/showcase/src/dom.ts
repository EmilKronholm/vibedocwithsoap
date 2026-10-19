export type Child = Node | string | number | null | false | undefined;

/** A tiny element builder, so the tab code reads like the tab. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    else if (key === "class") el.className = String(value);
    else if (key in el) (el as unknown as Record<string, unknown>)[key] = value;
    else el.setAttribute(key, String(value));
  }
  for (const child of children) {
    if (child !== null && child !== false && child !== undefined) el.append(child instanceof Node ? child : String(child));
  }
  return el;
}

export const button = (label: string, onClick: () => void, options: { disabled?: boolean; primary?: boolean } = {}) =>
  h("button", { type: "button", class: `act${options.primary ? " try" : ""}`, onClick, disabled: options.disabled }, label);

export const row = (...children: Child[]) => h("div", { class: "row" }, ...children);
export const hint = (text: string) => h("p", { class: "hint" }, text);
export const warn = (text: string) => h("p", { class: "warn" }, text);
export const field = (label: string, input: Node) => h("label", { class: "field" }, h("span", {}, label), input);

/** A titled box that groups controls. */
export const group = (title: string, ...children: Child[]) => h("div", { class: "group" }, h("h3", {}, title), ...children);

export function select(options: string[], value: string, onChange: (value: string) => void): HTMLSelectElement {
  const el = h("select", { onChange: () => onChange(el.value) }, ...options.map((o) => h("option", { value: o, selected: o === value }, o)));
  return el;
}

/** `rgb(31, 61, 99)` as `#1f3d63`, for a colour input. */
export function hex(color: string): string {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(color);
  if (m) return `#${[m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "#000000";
}
