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

export function chooseRandomItemsInArray<T>(arr: T[], {qty}: {qty: number}): T[] {
  const pool = [...arr]; // clone so we can splice without changing the original array
  const chosen: T[] = [];
  for (let counter = 0; counter < qty; counter++) {
    const [element] = pool.splice(Math.floor(Math.random() * pool.length), 1);
    if (element === undefined) {
      break;
    }
    chosen.push(element);
  }
  return chosen;
}

export function shuffleArray<T>(arr: T[]): T[] {
  return chooseRandomItemsInArray(arr, {qty: arr.length});
}
