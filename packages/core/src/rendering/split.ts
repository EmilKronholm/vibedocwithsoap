import { elementAt, elementPath, isSkipped } from "../dom";

/**
 * Cuts a document into one tree per page. Page `k` holds everything between
 * break `k-1` and break `k`, wrapped in copies of the elements that contain
 * it, so a list cut in two is two lists. Style elements are on every page.
 * The elements keep their attributes, so each still says where it came from.
 */
export function splitIntoPages(source: Element, breaks: readonly Element[]): HTMLElement[] {
  const paths = breaks.map((el) => elementPath(el, source));
  const styles = Array.from(source.querySelectorAll("style"));

  return Array.from({ length: breaks.length + 1 }, (_, page) => {
    const copy = source.cloneNode(true) as HTMLElement;
    // Both ends are found before anything is cut, while the paths still lead to the right elements.
    const start = page > 0 ? elementAt(copy, paths[page - 1]) : null;
    const end = page < paths.length ? elementAt(copy, paths[page]) : null;

    copy.querySelectorAll("style").forEach((style) => style.remove());
    if (start) dropBefore(start, copy);
    if (end) dropFrom(end, copy);
    copy.prepend(...styles.map((style) => style.cloneNode(true)));
    return copy;
  });
}

/** Removes everything that comes before `start` in document order, but keeps the elements around it. */
function dropBefore(start: Element, root: Element): void {
  for (let node: Element | null = start; node && node !== root; node = node.parentElement) {
    while (node.previousSibling) node.previousSibling.remove();
  }
}

/** Removes `end` and everything after it, then any element left empty by that. */
function dropFrom(end: Element, root: Element): void {
  const emptiable = end.parentElement;
  for (let node: Element | null = end; node && node !== root; node = node.parentElement) {
    while (node.nextSibling) node.nextSibling.remove();
  }
  end.remove();
  removeEmptyUp(emptiable, root);
}

function removeEmptyUp(el: Element | null, root: Element): void {
  let node = el;
  while (node && node !== root && isEmpty(node)) {
    const parent: Element | null = node.parentElement;
    node.remove();
    node = parent;
  }
}

const isEmpty = (el: Element) => !isSkipped(el) && el.children.length === 0 && !(el.textContent ?? "").trim();
