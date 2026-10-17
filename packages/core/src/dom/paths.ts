/** Child-element indexes from a root down to an element: `[1, 0, 3]`. */
export type ElementPath = readonly number[];

export const PATH_ATTR = "data-folio-path";

export function elementPath(el: Element, root: Element): ElementPath {
  const steps: number[] = [];
  let node: Element | null = el;
  while (node && node !== root) {
    const parent: Element | null = node.parentElement;
    if (!parent) break;
    steps.unshift(Array.from(parent.children).indexOf(node));
    node = parent;
  }
  return steps;
}

export function elementAt(root: Element, path: ElementPath): Element | null {
  let node: Element | null = root;
  for (const step of path) {
    if (!node) return null;
    node = node.children[step] ?? null;
  }
  return node;
}

/** `[1, 0, 3]` as `"1.0.3"`, for attributes and map keys. */
export function pathKey(path: ElementPath): string {
  return path.join(".");
}

export function parsePathKey(key: string): ElementPath {
  return key === "" ? [] : key.split(".").map(Number);
}

/**
 * Writes each element's path (from `root`) onto it. A copy of the element,
 * such as one on a page, can then still say where it came from.
 */
export function stampPaths(root: Element): void {
  const visit = (el: Element, path: number[]) => {
    Array.from(el.children).forEach((child, index) => {
      const childPath = [...path, index];
      child.setAttribute(PATH_ATTR, pathKey(childPath));
      visit(child, childPath);
    });
  };
  visit(root, []);
}

export function pathOfStamped(el: Element): ElementPath | null {
  const key = el.getAttribute(PATH_ATTR);
  return key === null ? null : parsePathKey(key);
}
