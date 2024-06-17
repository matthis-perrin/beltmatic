import {randomBytes} from 'node:crypto';

const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export function randomStringSafe(length: number, set?: string): string {
  let result = '';
  const characters = set ?? ALPHANUM;
  const bytes = randomBytes(length);
  for (const byte of bytes) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    result += characters[Math.floor((byte / 255) * (characters.length - 1))];
  }
  return result;
}

const UID_LENGTH = 16;
export function uidSafe(prefix?: string): string {
  const id = randomStringSafe(UID_LENGTH);
  return prefix === undefined ? id : `${prefix}${id}`;
}

const NONCE_BYTE_SIZE = 16;
export function generateNonce(): string {
  return randomBytes(NONCE_BYTE_SIZE).toString('base64');
}
