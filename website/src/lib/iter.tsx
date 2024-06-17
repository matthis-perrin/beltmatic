export function* iter<T>(values: T[]): Generator<[T, T]> {
  let x = 0;
  let y = 0;
  let maxX = 0;
  let minY = 0;
  while (true) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    yield [values[x]!, values[y]!];
    x -= 1;
    y += 1;
    if (x < 0 || y >= values.length) {
      maxX += 1;
      x = maxX;
      y = 0;
      if (maxX >= values.length) {
        maxX = values.length - 1;
        minY += 1;
        y = minY;
        x = maxX;
        if (minY >= values.length) {
          return;
        }
      }
    }
  }
}

export function* iterForDepths(
  depthPairs: [number, number][],
  searchSpace: Record<number, number[]>
): Generator<[number, number]> {
  for (const [d1, d2] of depthPairs) {
    for (const v1 of searchSpace[d1] ?? []) {
      for (const v2 of searchSpace[d2] ?? []) {
        yield [v1, v2];
      }
    }
  }
}
