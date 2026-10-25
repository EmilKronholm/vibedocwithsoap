/** Marks an element or inserted text that belongs to a change, so the page can show it and a click can find it. */
export const CHANGE_ATTR = "data-vibedoc-change";

/** The kind of a change on an element: modified, added, moved, removed or restyled. */
export const KIND_ATTR = "data-vibedoc-kind";

/** Set on a marked element or inserted text whose change the person has undone. */
export const REJECTED_ATTR = "data-vibedoc-rejected";

/** Marks removed content shown again as a struck-through ghost. */
export const GHOST_ATTR = "data-vibedoc-ghost";
