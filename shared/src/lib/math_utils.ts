export function min(values: number[]): number | undefined {
  let min: number | undefined;
  for (const value of values) {
    if (min === undefined || min > value) {
      min = value;
    }
  }
  return min;
}

export function max(values: number[]): number | undefined {
  let max: number | undefined;
  for (const value of values) {
    if (max === undefined || max < value) {
      max = value;
    }
  }
  return max;
}
