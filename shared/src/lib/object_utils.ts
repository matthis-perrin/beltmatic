import {DeepPartial} from '@shared/lib/type_utils';

function isObject(val: unknown): val is Record<string, unknown> {
  return (
    typeof val === 'object' &&
    val !== null &&
    !Array.isArray(val) &&
    !(
      '$$typeof' in val &&
      typeof val.$$typeof === 'symbol' &&
      val.$$typeof.toString() === 'Symbol(react.element)'
    )
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>
): Record<string, any> {
  const res = {...target};
  /* eslint-enable @typescript-eslint/no-explicit-any */
  for (const key of Object.keys(source)) {
    const targetValue = res[key];
    const sourceValue = source[key];
    res[key] =
      isObject(targetValue) && isObject(sourceValue)
        ? deepMerge(targetValue, sourceValue)
        : sourceValue;
  }
  return res;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extendObject<T extends Record<string, any>>(target: T, source: DeepPartial<T>): T {
  return deepMerge(target, source) as T;
}

export function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (typeof obj1 !== typeof obj2) {
    return false;
  }
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }

  if (obj1 === null && obj2 === null) {
    return true;
  }
  if (obj1 === null || obj2 === null) {
    return false;
  }

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    for (const [i, element] of obj1.entries()) {
      if (!deepEqual(element, obj2[i])) {
        return false;
      }
    }
    return true;
  }

  if (Array.isArray(obj1) || Array.isArray(obj2)) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    if (
      !deepEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key])
    ) {
      return false;
    }
  }
  return true;
}
