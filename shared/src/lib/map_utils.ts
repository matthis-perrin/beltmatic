export type RecordKey = string | number | symbol;

export function zip<Key extends RecordKey, Value1, Value2>(
  record1: Record<Key, Value1>,
  record2: Record<Key, Value2>
): [Key, Value1, Value2][] {
  const res: [Key, Value1, Value2][] = [];
  for (const [key, val1] of entries(record1)) {
    if (key in record2) {
      res.push([key, val1, record2[key]]);
    }
  }
  return res;
}

export class NiceMap<Key, Val> extends Map<Key, Val> {
  public getOrSet(key: Key, defaultValue: Val): Val {
    if (!this.has(key)) {
      this.set(key, defaultValue);
      return defaultValue;
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.get(key)!;
  }

  public toJson(): string {
    return `{${[...this.entries()]
      .map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`)
      .join(',')}}`;
  }
}

type RecursiveMap<T> = Map<unknown, T | RecursiveMap<T>>;
export function flatten<T>(map: RecursiveMap<T>): T[] {
  const elements: T[] = [];
  for (const val of map.values()) {
    if (val instanceof Map) {
      elements.push(...flatten(val));
    } else {
      elements.push(val);
    }
  }
  return elements;
}

type Entries<T> = Exclude<{[K in keyof T]: [K, T[K]]}[keyof T], undefined>[];
export function entries<Obj extends {}>(record: Obj): Entries<Obj> {
  return Object.entries(record) as Entries<Obj>;
}

export function keys<Obj extends {}>(record: Obj): (keyof Obj)[] {
  return Object.keys(record) as (keyof Obj)[];
}

export function values<Obj extends {}>(record: Obj): Obj[keyof Obj][] {
  return Object.values(record);
}

export function mapValues<Key, T, U>(map: Map<Key, T>, fn: (val: T) => U): Map<Key, U> {
  const res = new Map<Key, U>();
  for (const [key, val] of map) {
    res.set(key, fn(val));
  }
  return res;
}

type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
type DeepWriteable<T> = {-readonly [P in keyof T]: DeepWriteable<T[P]>};
type Cast<X, Y> = X extends Y ? X : Y;
type FromEntries<T> = T extends [infer Key, unknown][]
  ? {[K in Cast<Key, string>]: Extract<ArrayElement<T>, [K, unknown]>[1]}
  : {[key in string]: unknown};

type FromEntriesWithReadOnly<T> = FromEntries<DeepWriteable<T>>;

export function fromEntries<T extends Iterable<readonly unknown[]>>(
  entries: T
): FromEntriesWithReadOnly<T> {
  return Object.fromEntries(entries) as FromEntriesWithReadOnly<T>;
}

export function reverseMap<K extends string | number, V extends string | number>(
  map: Record<K, V>
): Record<V, K> {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as unknown as Record<V, K>;
}

export function partOfMap<K, V>(map: Map<K, V>, count: number): [K, V][] {
  const res: [K, V][] = [];
  for (const entry of map.entries()) {
    if (res.length === count) {
      break;
    }
    res.push(entry);
  }
  return res;
}
