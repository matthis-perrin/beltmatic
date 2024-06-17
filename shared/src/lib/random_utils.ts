const DEFAULT_SET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export function randomStringUnsafe(length: number, set?: string): string {
  let result = '';
  const characters = set ?? DEFAULT_SET;
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function randomInt(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}
