// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<This, Args extends any[]>(
  fn: (this: This, ...args: Args) => void,
  ms: number
): (this: This, ...args: Args) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  function debounced(this: This, ...args: Args): void {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  }
  return debounced;
}
