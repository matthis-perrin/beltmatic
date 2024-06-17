export function capitalize(value: string): string {
  const [firstChar] = value;
  return firstChar === undefined ? '' : firstChar.toUpperCase() + value.slice(1);
}

export function uncapitalize(value: string): string {
  const [firstChar] = value;
  return firstChar === undefined ? '' : firstChar.toLowerCase() + value.slice(1);
}
