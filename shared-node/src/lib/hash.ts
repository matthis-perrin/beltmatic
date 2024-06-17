import {createHash} from 'node:crypto';

export function md5(data: string | Buffer): string {
  const content = typeof data === 'string' ? data : data.toString();
  return createHash('md5').update(content).digest('hex');
}

export function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${password}${salt}`).digest('base64');
}
