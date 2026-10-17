const isText = (node: Node): node is Text => node.nodeType === Node.TEXT_NODE;

// A line break counts as one character, matching how unit text is read.
const lengthOf = (node: Node): number => (isText(node) ? node.data.length : node.nodeName === "BR" ? 1 : 0);

/** How many characters of the unit's text lie before the caret. Null if there is no caret inside the unit. */
export function caretOffset(unit: Element): number | null {
  const selection = unit.ownerDocument.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return null;

  const { startContainer, startOffset } = selection.getRangeAt(0);
  if (!unit.contains(startContainer)) return null;

  const children = Array.from(unit.childNodes);
  const upTo = startContainer === unit ? startOffset : children.indexOf(startContainer as ChildNode);
  if (upTo < 0) return null;

  const before = children.slice(0, upTo).reduce((sum, node) => sum + lengthOf(node), 0);
  return startContainer === unit ? before : before + startOffset;
}

/** Puts the caret `offset` characters into a unit's text. */
export function placeCaret(unit: HTMLElement, offset: number): void {
  const doc = unit.ownerDocument;
  const range = doc.createRange();
  unit.focus();

  let remaining = offset;
  for (const node of Array.from(unit.childNodes)) {
    if (isText(node) && remaining <= node.data.length) {
      range.setStart(node, remaining);
      range.collapse(true);
      return select(doc, range);
    }
    remaining -= lengthOf(node);
  }
  range.selectNodeContents(unit);
  range.collapse(false);
  select(doc, range);
}

function select(doc: Document, range: Range): void {
  const selection = doc.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}
