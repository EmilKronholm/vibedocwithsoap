import type { NewElement } from "./commands";

export const paragraph = (text = ""): NewElement => ({ tag: "p", text });

export const heading = (level: 1 | 2 | 3 | 4 | 5 | 6, text = ""): NewElement => ({ tag: `h${level}`, text });

export interface TextBoxInit {
  text?: string;
  /** Pixels from the left edge of the page's content area. */
  left: number;
  /** Pixels from the top of the page's content area. */
  top: number;
  width?: number;
}

/**
 * A text box that sits at a fixed place on the page. It is a positioned
 * element, so a document whose rules do not allow `freeform` will refuse it.
 */
export function textBox({ text = "Text", left, top, width = 200 }: TextBoxInit): NewElement {
  return { tag: "div", text, style: `position: absolute; left: ${left}px; top: ${top}px; width: ${width}px;` };
}
