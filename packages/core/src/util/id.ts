/** A short unique id with a readable prefix, e.g. `v1k3x9a2b`. */
export function createId(prefix = ""): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}${Date.now().toString(36)}${random}`;
}
