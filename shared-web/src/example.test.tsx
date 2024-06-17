import assert from 'node:assert';
import {describe, it} from 'node:test';

describe('example.ts', () => {
  it('should give an example of a test', () => {
    const test = [1, 2, 3];
    assert.equal(test.length, 3);
  });
});
