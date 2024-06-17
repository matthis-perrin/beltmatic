import {sleep} from '@shared-node/lib/time_utils';

interface RetryOptions {
  /**
   * Max number of times the function will be called and the promise awaited.
   * Default is 3.
   */
  maxTries: number;
  /**
   * By how much the wait time is multiplied for every failure.
   * Default is 2.
   */
  factor: number;
  /**
   * The wait time in ms after the initial failure.
   * Default is 500ms.
   */
  minTimeout: number;
  /**
   * Maximum wait time in ms after a failure.
   * Default is 10000ms.
   */
  maxTimeout: number;
  /**
   * Increase the wait time by a random value between 0 and `randomPercent` percent.
   * Default is 0 (wait time is never modified).
   */
  randomPercent: number;
  /**
   * Handler called everytime the promise fails.
   * @param err The error from the rejected promise.
   * @param count How many time we've failed so far.
   * @param left How many tries are left.
   */
  errorHandler?: (err: unknown, count: number, left: number) => void;
}

const defaultRetryOptions: RetryOptions = {
  maxTries: 3,
  factor: 2,
  minTimeout: 500,
  maxTimeout: 10000,
  randomPercent: 0,
};

async function retryInternal<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
  currentAttempt: number
): Promise<T> {
  try {
    // We need to await the function otherwise promise won't be catched
    const res = await fn();
    return res;
  } catch (err: unknown) {
    const {maxTries, factor, maxTimeout, minTimeout, randomPercent, errorHandler} = options;
    if (errorHandler) {
      const count = currentAttempt + 1;
      errorHandler(err, count, maxTries - count);
    }
    if (currentAttempt >= maxTries - 1) {
      throw err;
    }
    const random = 1 + (randomPercent / 100) * Math.random();
    const timeout = Math.min(random * minTimeout * factor ** currentAttempt, maxTimeout);
    console.log(`retrying in ${timeout} ms...`, {options, currentAttempt, timeout});
    await sleep(timeout);
    return retryInternal(fn, options, currentAttempt + 1);
  }
}

export async function retry<T>(fn: () => Promise<T>, options?: Partial<RetryOptions>): Promise<T> {
  const optionsWithDefault = {...defaultRetryOptions, ...options};
  return retryInternal(fn, optionsWithDefault, 0);
}
