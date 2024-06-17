export function optional(prop: string, val: string | number | undefined): string | false {
  return val === undefined ? false : `${prop}: ${val};`;
}

export function optionalPx(prop: string, val: string | number | undefined): string | false {
  return optional(prop, val === undefined ? undefined : cssPx(val));
}

export function optionalRaw<T extends string | number>(
  val: T | undefined,
  transform: (val: T) => string
): string | false {
  return val === undefined ? false : transform(val);
}

export function cssPx(val: string | number): string {
  return typeof val === 'string' ? val : `${val}px`;
}
