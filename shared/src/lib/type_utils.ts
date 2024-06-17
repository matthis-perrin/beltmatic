function notUndefined<T>(val: T | undefined): val is T {
  return val !== undefined;
}

export function isString(val: unknown): val is string {
  return typeof val === 'string';
}

export function isNumber(val: unknown): val is number {
  return typeof val === 'number';
}

export function iterNumberEnum<T extends Record<string, string | number>>(e: T): T[keyof T][] {
  return Object.values(e).filter(isNumber) as unknown as T[keyof T][];
}

export function iterStringEnum<T extends Record<string, string>>(e: T): T[keyof T][] {
  return Object.values(e).filter(isString) as unknown as T[keyof T][];
}

export function removeUndefined<T>(arr: (T | undefined)[]): T[] {
  return arr.filter(notUndefined);
}

export function removeUndefinedOrNullProps<T extends Record<string, unknown>>(obj: T): {} {
  return Object.fromEntries(
    Object.entries(obj).filter(e => e[1] !== undefined && e[1] !== null)
  ) as T;
}

export function neverHappens(value: never, errorMessage?: string): never {
  throw new Error(errorMessage);
}

export type AnyInterface<T> = {[K in keyof T]: unknown};

export function asMap(value: unknown): Record<string, unknown> | undefined;
export function asMap(
  value: unknown,
  defaultValue: Record<string, unknown>
): Record<string, unknown>;
export function asMap(
  value: unknown,
  defaultValue?: Record<string, unknown>
): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : defaultValue;
}
export function asMapOrThrow(value: unknown): Record<string, unknown> {
  const valueAsMap = asMap(value);
  if (valueAsMap === undefined) {
    throw new Error(`Invalid value: \`${value}\` is not a map`);
  }
  return valueAsMap;
}

export function asJson(value: string): Record<string, unknown> | undefined;
export function asJson(
  value: string,
  defaultValue: Record<string, unknown>
): Record<string, unknown>;
export function asJson(
  value: string,
  defaultValue?: Record<string, unknown>
): Record<string, unknown> | undefined {
  try {
    const json = JSON.parse(value);
    const res = asMap(json);
    return res ?? defaultValue;
  } catch {
    return defaultValue;
  }
}
export function asJsonOrThrow(value: string): Record<string, unknown> {
  const valueAsJson = asJson(value);
  if (valueAsJson === undefined) {
    throw new Error(`Invalid value: \`${value}\` is not a valid JSON string of a map`);
  }
  return valueAsJson;
}

export function asJsonString(value: unknown): Record<string, unknown> | undefined;
export function asJsonString(
  value: unknown,
  defaultValue: Record<string, unknown>
): Record<string, unknown>;
export function asJsonString(
  value: unknown,
  defaultValue?: Record<string, unknown>
): Record<string, unknown> | undefined {
  const str = asString(value);
  return str === undefined
    ? defaultValue
    : defaultValue === undefined
      ? asJson(str)
      : asJson(str, defaultValue);
}
export function asJsonStringOrThrow(value: unknown): Record<string, unknown> {
  return asJsonOrThrow(asStringOrThrow(value));
}

export function asString<T extends string = string>(value: unknown): T | undefined;
export function asString<T extends string = string>(value: unknown, defaultValue: string): T;
export function asString<T extends string = string>(
  value: unknown,
  defaultValue?: string
): T | undefined {
  return (typeof value === 'string' ? value : defaultValue) as T;
}
export function asStringOrThrow<T extends string = string>(value: unknown): T {
  const valueAsString = asString<T>(value);
  if (valueAsString === undefined) {
    throw new Error(`Invalid value: \`${value}\` is not a string`);
  }
  return valueAsString;
}

export function asArray<T = unknown>(value: unknown): T[] | undefined;
export function asArray<T = unknown>(value: unknown, defaultValue: unknown[]): T[];
export function asArray<T = unknown>(value: unknown, defaultValue?: unknown[]): T[] | undefined {
  return (Array.isArray(value) ? value : defaultValue) as T[];
}
export function asArrayOrThrow<T = unknown>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid value: \`${value}\` is not an array`);
  }
  return value as T[];
}

export function asStringArray<T extends string = string>(value: unknown): T[] | undefined;
export function asStringArray<T extends string = string>(
  value: unknown,
  defaultValue: string[]
): T[];
export function asStringArray<T extends string = string>(
  value: unknown,
  defaultValue?: string[]
): T[] | undefined {
  const arr = asArray(value);
  if (arr === undefined) {
    return defaultValue as T[];
  }
  return removeUndefined(arr.map(s => asString<T>(s)));
}

export function asStringArrayOrThrow<T extends string = string>(value: unknown): T[] {
  const arr = asArrayOrThrow(value);
  return arr.map(s => asStringOrThrow<T>(s));
}

export function asMapArray(value: unknown): Record<string, unknown>[] | undefined;
export function asMapArray(
  value: unknown,
  defaultValue: Record<string, unknown>[]
): Record<string, unknown>[];
export function asMapArray(
  value: unknown,
  defaultValue?: Record<string, unknown>[]
): Record<string, unknown>[] | undefined {
  const arr = asArray(value);
  if (arr === undefined) {
    return defaultValue;
  }
  return removeUndefined(arr.map(s => asMap(s)));
}
export function asMapArrayOrThrow(value: unknown): Record<string, unknown>[] {
  const arr = asArrayOrThrow(value);
  return arr.map(s => asMapOrThrow(s));
}

export function asNumber<T extends number = number>(value: unknown): T | undefined;
export function asNumber<T extends number = number>(value: unknown, defaultValue: number): T;
export function asNumber<T extends number = number>(
  value: unknown,
  defaultValue?: number
): T | undefined {
  if (typeof value === 'number') {
    return (!isNaN(value) ? value : defaultValue) as T;
  }
  if (typeof value === 'string') {
    try {
      const parsedValue = parseFloat(value);
      return (!isNaN(parsedValue) ? parsedValue : defaultValue) as T;
    } catch {
      return defaultValue as T;
    }
  }
  return defaultValue as T;
}
export function asNumberOrThrow<T extends number = number>(value: unknown): T {
  const valueAsNumber = asNumber(value);
  if (valueAsNumber === undefined) {
    throw new Error(`Invalid value: \`${value}\` is not a number`);
  }
  return valueAsNumber as T;
}

export function asBoolean(value: unknown): boolean | undefined;
export function asBoolean(value: unknown, defaultValue: boolean): boolean;
export function asBoolean(value: unknown, defaultValue?: boolean): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return !isNaN(value) ? value !== 0 : false;
  }
  if (typeof value === 'string') {
    if (value === '0' || value === 'false') {
      return false;
    } else if (value === '1' || value === 'true') {
      return true;
    }
    return defaultValue;
  }
  return defaultValue;
}

export function asBooleanOrThrow(value: unknown): boolean {
  const valueAsBoolean = asBoolean(value);
  if (valueAsBoolean === undefined) {
    throw new Error(`Invalid value: \`${value}\` is not a boolean`);
  }
  return valueAsBoolean;
}

const TIMESTAMP_REGEX = /^[0-9]{1,15}$/u;
export function asDate(value: unknown): Date | undefined;
export function asDate(value: unknown, defaultValue: Date): Date;
export function asDate(value: unknown, defaultValue?: Date): Date | undefined {
  const date =
    value instanceof Date
      ? value
      : new Date(
          typeof value === 'string' && TIMESTAMP_REGEX.test(value)
            ? parseFloat(value)
            : String(value)
        );
  return isNaN(date.getTime()) ? defaultValue : date;
}

export function asDateOrThrow(value: unknown): Date {
  const valueAsDate = asDate(value);
  if (valueAsDate === undefined) {
    throw new Error(`Invalid value: \`${value}\` cannot be parsed as a Date`);
  }
  return valueAsDate;
}

// export function asDate(value: unknown): Date | undefined;
// export function asDate(value: unknown, defaultValue: Date): Date;
// export function asDate(value: unknown, defaultValue?: Date): Date | undefined {
//   if (typeof value === 'number') {
//     return new Date(value);
//   }
//   return value instanceof Date ? value : defaultValue;
// }

export function isNull<T>(val: T | null): val is null {
  return val === null;
}

export function asError(err: unknown): Error {
  return err instanceof Error ? err : new Error(typeof err === 'string' ? err : String(err));
}

export function errorAsString(err: unknown): string {
  const errorMap = asMap(err);
  if (errorMap === undefined) {
    return asString(err) ?? String(err);
  }

  const errorMessage = asString(errorMap['message']);
  if (errorMessage === undefined) {
    return String(err);
  }
  return errorMessage;
}

export function errorAndStackAsString(err: unknown): string {
  const errorMap = asMap(err);
  if (errorMap === undefined) {
    return asString(err) ?? String(err);
  }

  const stack = asString(errorMap['stack']);
  if (stack === undefined) {
    return String(err);
  }
  return stack;
}

export function asConstantOrThrow<T>(value: unknown, expected: T): T {
  if (value !== expected) {
    throw new Error(`Invalid value: \`${value}\`, expected \`${expected}\``);
  }
  return value as T;
}

// export function asParsedJson<T>(json: string): T {
//   try {
//     return JSON.parse(json) as T;
//   } catch {
//     const defaultValue = {};
//     return defaultValue as T;
//   }
// }
export function parseJson(
  json: string
): {res: unknown; err: undefined} | {res: undefined; err: unknown} {
  try {
    return {res: JSON.parse(json), err: undefined};
  } catch (err: unknown) {
    return {err, res: undefined};
  }
}
export type Brand<Type, Name> = Type & {__brand: Name};
export type StringBrand = string & {__brand: string};
export type NumberBrand = number & {__brand: number};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyBrand = (string | number) & {__brand: any};

export type Untrusted<T> = T extends
  | Function
  | Date
  | boolean
  | number
  | string
  | undefined
  | null
  | unknown[]
  ? unknown
  : {[P in keyof T]?: Untrusted<T[P]>};

export type DeepPartial<T> = T extends
  | Function
  | Date
  | boolean
  | number
  | string
  | undefined
  | null
  | unknown[]
  ? T
  : {[P in keyof T]?: DeepPartial<T[P]>};

export type MapInterface<I, Type> = {[Key in keyof I]: Type};
// Get all the keys of a type including the optional attributes
type NonHomomorphicKeys<T> = ({[P in keyof T]: P} & None)[keyof T];
export type MapInterfaceStrict<I, Type> = {[Key in NonHomomorphicKeys<I>]: Type};

type KeysOfType<T, Type> = {[Key in keyof T]: T[Key] extends Type ? Key : never}[keyof T];
export type RestrictInterface<T, Type> = Pick<T, KeysOfType<T, Type>>;

interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> {}
export type NestedArray<T> = (T | RecursiveArray<T>)[];

// Type for an empty object (ie: {})
export type None = Record<string, never>;

export type NonEmptyArray<T> = [T, ...T[]];
export function isNonEmptyArray<T>(val: T[]): val is NonEmptyArray<T> {
  return val.length > 0;
}
export function nonEmptyArray<T>(val: T[]): NonEmptyArray<T> | undefined {
  return val.length === 0 ? undefined : (val as NonEmptyArray<T>);
}

export type AddPrefix<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K];
};
export function addPrefix<T extends Record<string, unknown>, Prefix extends string>(
  attr: T,
  prefix: Prefix
): AddPrefix<T, Prefix> {
  return Object.fromEntries(
    Object.entries(attr).map(([key, value]) => [`${prefix}${key}`, value])
  ) as AddPrefix<T, Prefix>;
}

export type WithNull<T> = {
  [Key in keyof T]: T[Key] extends Exclude<T[Key], undefined> ? T[Key] : T[Key] | null;
};
type Id<T> = T;
export type Flatten<T> = Id<{[k in keyof T]: T[k]}>;

export type Defined<T> = Exclude<T, undefined>;
