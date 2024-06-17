import {createCipheriv, createDecipheriv, randomBytes} from 'node:crypto';

import {splitOnce} from '@shared/lib/array_utils';

const ALGORITHM = 'aes-256-cbc';
const INPUT_ENCODING = 'utf8';
const OUTPUT_ENCODING = 'hex';
const IV_LENGTH = 16;

export function encrypt(data: string, key: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let ciphered = cipher.update(data, INPUT_ENCODING);
  ciphered = Buffer.concat([ciphered, cipher.final()]);
  return `${iv.toString(OUTPUT_ENCODING)}:${ciphered.toString(OUTPUT_ENCODING)}`;
}

export function decrypt(data: string, key: string): string {
  const [ivRaw, ciphered] = splitOnce(data, ':');
  if (ciphered === undefined) {
    throw new Error('Cipher is empty');
  }
  const iv = Buffer.from(ivRaw, OUTPUT_ENCODING);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  let deciphered = decipher.update(ciphered, OUTPUT_ENCODING);
  deciphered = Buffer.concat([deciphered, decipher.final()]);
  return deciphered.toString(INPUT_ENCODING);
}
