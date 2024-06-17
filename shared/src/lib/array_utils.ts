import {NonEmptyArray} from '@shared/lib/type_utils';

export function last<T>(arr: T[]): T | undefined {
  return arr.length > 0 ? arr.at(-1) : undefined;
}

export function arrayJoin<T>(arr: T[], joiner: (index: number) => T): T[] {
  const joined: T[] = [];
  for (const [i, element] of arr.entries()) {
    joined.push(element);
    if (i !== arr.length - 1) {
      joined.push(joiner(i));
    }
  }
  return joined;
}

export function splitOnce(value: string, splitter: string): [string] | [string, string] {
  const splitterIndex = value.indexOf(splitter);
  if (splitterIndex === -1) {
    return [value];
  }

  return [value.slice(0, splitterIndex), value.slice(splitterIndex + splitter.length)];
}

export function splitOnceOrThrow(value: string, splitter: string): [string, string] {
  const splitterIndex = value.indexOf(splitter);
  if (splitterIndex === -1) {
    throw new Error(`Expected two values when splitting "${value}" with "${splitter}"`);
  }
  return [value.slice(0, splitterIndex), value.slice(splitterIndex + splitter.length)];
}

export function splitLastOrThrow(value: string, splitter: string): [string, string] {
  const lastIndex = value.lastIndexOf(splitter);
  if (lastIndex === -1) {
    throw new Error(`Expected two values when splitting "${value}" with "${splitter}"`);
  }
  const first = value.slice(0, lastIndex);
  const last = value.slice(lastIndex + splitter.length);
  return [first, last];
}

export function splitLast(value: string, splitter: string): [string, string] | [string] {
  try {
    return splitLastOrThrow(value, splitter);
  } catch {
    return [value];
  }
}

export function splitBothEndOrThrow(value: string, splitter: string): [string, string, string] {
  const firstSlash = value.indexOf(splitter);
  const lastSlash = value.lastIndexOf(splitter);

  if (firstSlash === -1 || lastSlash === -1) {
    throw new Error(`Expected three values when splitting "${value}" with "${splitter}"`);
  }

  const first = value.slice(0, firstSlash);
  const middle = value.slice(firstSlash + splitter.length, lastSlash);
  const last = value.slice(lastSlash + splitter.length);

  return [first, middle, last];
}

export function halves<T>(arr: T[], isLeft: (val: T) => boolean): [T[], T[]] {
  const left: T[] = [];
  const right: T[] = [];
  for (const val of arr) {
    (isLeft(val) ? left : right).push(val);
  }
  return [left, right];
}

// type Flattened<T> = T extends NestedArray<infer U> ? U[] : T[];
// export function flattenDeep<T>(arr: NestedArray<T>): Flattened<T> {
//   const all: T[] = [];
//   for (const val of arr) {
//     if (!Array.isArray(val)) {
//       return arr as Flattened<T>;
//     }
//     all.push(...(flattenDeep(val) as T[]));
//   }
//   return all as Flattened<T>;
// }

export function flatten<T>(arr: T[][]): T[] {
  const all: T[] = [];
  for (const val of arr) {
    all.push(...val);
  }
  return all;
}

export function groupBy<T, U>(arr: T[], fn: (v: T) => U): Map<U, NonEmptyArray<T>>;
export function groupBy<T, K extends keyof T>(arr: T[], key: K): Map<T[K], NonEmptyArray<T>>;
export function groupBy<
  Value,
  Predicate,
  Key = Predicate extends (v: Value) => infer U
    ? U
    : Predicate extends keyof Value
      ? Value[Predicate]
      : never,
>(arr: Value[], predicate: Predicate): Map<Key, NonEmptyArray<Value>> {
  const groups = new Map<Key, NonEmptyArray<Value>>();
  for (const val of arr) {
    const groupKey: Key =
      typeof predicate === 'function' ? predicate(val) : val[predicate as unknown as keyof Value];
    const group = groups.get(groupKey);
    if (group === undefined) {
      groups.set(groupKey, [val]);
    } else {
      group.push(val);
    }
  }
  return groups;
}

export function chunkArray<T>(arr: T[], maxSize: number): T[][] {
  if (maxSize < 1) {
    throw new Error(`maxSize must be greater or equal to 1`);
  }

  const total = arr.length;
  const chunkCount = Math.ceil(total / maxSize);
  const chunkMinSize = Math.floor(total / chunkCount);
  const chunkMaxSize = Math.ceil(total / chunkCount);
  const lastMaxChunkIndex = chunkCount - (total - chunkCount * chunkMinSize);

  const chunks: T[][] = [];
  let elementIndex = 0;

  for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
    const chunkSize = chunkIndex > lastMaxChunkIndex ? chunkMinSize : chunkMaxSize;
    chunks.push(arr.slice(elementIndex, elementIndex + chunkSize));
    elementIndex += chunkSize;
  }
  return chunks;
}

export function sum(arr: number[] | Iterable<number>): number {
  let res = 0;
  for (const val of arr) {
    res += val;
  }
  return res;
}

export function mapSum<T>(arr: T[] | Iterable<T>, fn: (val: T) => number): number {
  let res = 0;
  for (const val of arr) {
    res += fn(val);
  }
  return res;
}

export function dedup<T>(arr: T[] | Iterable<T>, dedupAttr: (val: T) => string): T[] {
  const dedupMap = new Map<string, T>();
  for (const element of arr) {
    dedupMap.set(dedupAttr(element), element);
  }
  return [...dedupMap.values()];
}

export function every<T>(arr: T[] | Iterable<T>, condition: (val: T) => boolean): boolean {
  for (const val of arr) {
    if (!condition(val)) {
      return false;
    }
  }
  return true;
}

export function any<T>(arr: T[] | Iterable<T>, condition: (val: T) => boolean): boolean {
  for (const val of arr) {
    if (condition(val)) {
      return true;
    }
  }
  return false;
}

export function zip<T, U>(arr1: T[], arr2: U[]): [T, U][] {
  if (arr1.length !== arr2.length) {
    throw new Error(`Arrays have different sizes: ${arr1.length} and ${arr2.length}`);
  }
  const res: [T, U][] = [];
  for (const [i, element] of arr1.entries()) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    res.push([element, arr2[i]!]);
  }
  return res;
}

export function min<T>(
  arr: (T | undefined)[],
  fn: (val: T) => number | undefined
): number | undefined {
  let min: number | undefined;
  for (const element of arr) {
    if (element === undefined) {
      continue;
    }
    const val = fn(element);
    if (val === undefined) {
      continue;
    }
    min = min === undefined ? val : Math.min(min, val);
  }
  return min;
}

export function max<T>(
  arr: (T | undefined)[],
  fn: (val: T) => number | undefined
): number | undefined {
  let max: number | undefined;
  for (const element of arr) {
    if (element === undefined) {
      continue;
    }
    const val = fn(element);
    if (val === undefined) {
      continue;
    }
    max = max === undefined ? val : Math.max(max, val);
  }
  return max;
}
