import type { WordOp } from "../diff";
import { CHANGE_ATTR } from "./attrs";

function textNodes(el: Element): Text[] {
  const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const out: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n as Text);
  return out;
}

/** Collapses whitespace in place so the element's text equals its normalised text: the coordinate system the word diff is in. */
function collapseWhitespace(el: Element): void {
  const nodes = textNodes(el);
  let lastWasSpace = true; // trims the start
  for (const node of nodes) {
    let text = node.data.replace(/\s+/g, " ");
    if (lastWasSpace && text.startsWith(" ")) text = text.slice(1);
    node.data = text;
    if (text) lastWasSpace = text.endsWith(" ");
  }
  const lastWithText = [...nodes].reverse().find((n) => n.data);
  if (lastWithText) lastWithText.data = lastWithText.data.replace(/ $/, "");
}

/** The place in the element at a character position, splitting a text node so the position is a boundary. */
function boundaryAt(el: Element, position: number): { parent: Node; before: Node | null } {
  let seen = 0;
  for (const node of textNodes(el)) {
    if (position <= seen + node.length) {
      const offset = position - seen;
      if (offset === 0) return { parent: node.parentNode!, before: node };
      if (offset === node.length) return { parent: node.parentNode!, before: node.nextSibling };
      const rest = node.splitText(offset);
      return { parent: rest.parentNode!, before: rest };
    }
    seen += node.length;
  }
  return { parent: el, before: null };
}

/**
 * Marks a word diff inside an element without disturbing its markup. Inserted
 * text is wrapped where it sits, split per text node so spans survive, and
 * deleted text is put back as `<del>` at the point it was removed.
 */
export function markWordDiff(el: Element, words: WordOp[], changeId: string): void {
  collapseWhitespace(el);
  const { inserts, deletes } = positions(words);
  // Back to front, so earlier positions stay valid.
  for (const [start, end] of inserts.reverse()) wrapInsertion(el, start, end, changeId);
  for (const [at, text] of deletes.reverse()) putBackDeletion(el, at, text, changeId);
}

function positions(words: WordOp[]): { inserts: Array<[number, number]>; deletes: Array<[number, string]> } {
  const inserts: Array<[number, number]> = [];
  const deletes: Array<[number, string]> = [];
  let position = 0;
  for (const w of words) {
    if (w.op === "delete") {
      deletes.push([position, w.text]);
      continue;
    }
    if (w.op === "insert") inserts.push([position, position + w.text.length]);
    position += w.text.length;
  }
  return { inserts, deletes };
}

function wrapInsertion(el: Element, start: number, end: number, changeId: string): void {
  const pieces: Array<[Text, number, number]> = [];
  let seen = 0;
  for (const node of textNodes(el)) {
    const from = Math.max(start, seen);
    const to = Math.min(end, seen + node.length);
    if (from < to) pieces.push([node, from - seen, to - seen]);
    seen += node.length;
  }
  for (const [node, from, to] of pieces.reverse()) wrapPiece(el.ownerDocument, node, from, to, changeId);
}

function wrapPiece(doc: Document, node: Text, from: number, to: number, changeId: string): void {
  let target = node;
  if (to < target.length) target.splitText(to);
  if (from > 0) target = target.splitText(from);
  const ins = doc.createElement("ins");
  ins.setAttribute(CHANGE_ATTR, changeId);
  target.replaceWith(ins);
  ins.append(target);
}

// Text inside an <ins> counts toward positions, so the live text is walked each time.
function putBackDeletion(el: Element, at: number, text: string, changeId: string): void {
  const { parent, before } = boundaryAt(el, at);
  const del = el.ownerDocument.createElement("del");
  del.setAttribute(CHANGE_ATTR, changeId);
  del.textContent = text;

  // Never nest a deletion inside an insertion.
  const host = parent.nodeType === Node.ELEMENT_NODE ? (parent as Element).closest("ins") : null;
  if (host?.parentNode) host.parentNode.insertBefore(del, before === host.firstChild ? host : host.nextSibling);
  else parent.insertBefore(del, before);
}
