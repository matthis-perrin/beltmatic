export function padNumber(value: number, padding: number): string {
  let valueStr = String(value);
  while (valueStr.length < padding) {
    valueStr = `0${valueStr}`;
  }
  return valueStr;
}

interface PadOptions {
  right: boolean;
  pad: string;
}

const defaultPadOptions: PadOptions = {right: false, pad: ' '};

export function padString(value: string, padding: number, options?: Partial<PadOptions>): string {
  const {right, pad} = {...defaultPadOptions, ...options};
  let valueStr = value;
  while (valueStr.length < padding) {
    valueStr = `${right ? '' : pad}${valueStr}${right ? pad : ''}`;
  }
  return valueStr;
}

export function capitalize(value: string): string {
  const [firstChar] = value;
  return firstChar === undefined ? '' : firstChar.toUpperCase() + value.slice(1);
}

export function uncapitalize(value: string): string {
  const [firstChar] = value;
  return firstChar === undefined ? '' : firstChar.toLowerCase() + value.slice(1);
}

export function snakeCaseToCamelCase(snake: string): string {
  const [first = '', ...rest] = snake.split('_');
  return [first, ...rest.map(v => capitalize(v))].join('');
}

export function camelCaseToSnakeCase(camelCase: string): string {
  return camelCase
    .replace(/(?<letter>[A-Z])/gu, ' $1')
    .split(' ')
    .join('_')
    .toLowerCase();
}

export function snakeCaseToPascalCase(snake: string): string {
  return snake
    .split('_')
    .map(v => capitalize(v))
    .join('');
}
