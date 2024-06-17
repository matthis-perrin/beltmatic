import {gunzip, gzip} from 'node:zlib';

export async function compress(content: Buffer | string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    gzip(content, (err, res) => {
      if (!err) {
        resolve(res);
      } else {
        reject(err);
      }
    });
  });
}

export async function decompress(content: ArrayBuffer | Buffer | string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    gunzip(content, (err, res) => {
      if (!err) {
        resolve(res);
      } else {
        reject(err);
      }
    });
  });
}
