/** The longest common subsequence of two lists of keys, as pairs of indexes. */
export function lcsPairs(a: readonly string[], b: readonly string[]): Array<[number, number]> {
  const width = b.length + 1;
  const table = buildTable(a, b, width);
  const pairs: Array<[number, number]> = [];
  let i = 0;
  let j = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) pairs.push([i++, j++]);
    else if (table[(i + 1) * width + j] >= table[i * width + j + 1]) i++;
    else j++;
  }
  return pairs;
}

// table[i * width + j] is the length of the common subsequence of a[i..] and b[j..].
function buildTable(a: readonly string[], b: readonly string[], width: number): Uint32Array {
  const table = new Uint32Array((a.length + 1) * width);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i * width + j] =
        a[i] === b[j] ? table[(i + 1) * width + j + 1] + 1 : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    }
  }
  return table;
}
