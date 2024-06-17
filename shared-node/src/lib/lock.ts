import {ConditionalCheckFailedException} from '@aws-sdk/client-dynamodb';

import {Brand} from '@shared/lib/type_utils';

import {marshall, putItem, updateItem} from '@shared-node/aws/dynamodb';
import {uidSafe} from '@shared-node/lib/rand_safe';

type Issuer = Brand<'Issuer', string>;

// Take a lock and run a function.
// Automatically extends the lock while the function is running.
// Automatically releases the lock after the function is done running if something unexpeced happens
export async function withLock<T>(
  tableName: string,
  lockName: string,
  fn: () => Promise<T>
): Promise<{lockStatus: 'available'; res: T} | {lockStatus: 'taken'}> {
  const lockTimeout = 10 * 1000;

  // Try to take the lock
  console.log(`takeLock(${lockName})`);
  const issuer = uidSafe() as Issuer;
  try {
    await takeLock({tableName, lockName, issuer, durationMs: lockTimeout});
  } catch (err: unknown) {
    if (err instanceof ConditionalCheckFailedException) {
      console.log(`lockAlreadyTaken(${lockName})`);
      return {lockStatus: 'taken'};
    }
    throw err;
  }

  // Start a loop to automatically extent the lock
  const extendLockInterval = setInterval(() => {
    console.log(`extendLock(${lockName})`);
    extendLock({tableName, lockName, issuer, durationMs: lockTimeout}).catch(err => {
      throw new Error(`Failure to extendLock(${lockName}): ${String(err)}`);
    });
  }, lockTimeout - 1000);

  // Prepare a "cleanup" function that will run once we're done with the processing or
  // if something unexpected happens
  let cleanupFunction: (() => Promise<void>) | undefined;
  function executeCleanupFunction(): void {
    console.log('Emergency cleanup');
    cleanupFunction?.().catch(err => {
      console.error('Cleanup failure');
      console.error(err);
    });
    cleanupFunction = undefined;
  }

  // Register handlers to run the cleanup function in case something unexpected happens
  const sigintHandler = (): void => {
    console.log('Received SIGINT');
    executeCleanupFunction();
  };
  process.on('SIGINT', sigintHandler);
  const sigtermHandler = (): void => {
    console.log('Received SIGTERM');
    executeCleanupFunction();
  };
  process.on('SIGTERM', sigtermHandler);
  const uncaughtExceptionHandler = (err: Error): void => {
    console.error('Uncaught Exception');
    console.error(err);
    executeCleanupFunction();
  };
  process.on('uncaughtException', uncaughtExceptionHandler);
  const unhandledRejectionHandler = (err: Error): void => {
    console.error('Unhandled Rejection');
    console.error(err);
    executeCleanupFunction();
  };
  process.on('unhandledRejection', unhandledRejectionHandler);

  // Implement the cleanup function to release the lock, stop the lock loop and remove the process handlers
  cleanupFunction = async () => {
    process.removeListener('SIGINT', sigintHandler);
    process.removeListener('SIGTERM', sigtermHandler);
    process.removeListener('uncaughtException', uncaughtExceptionHandler);
    process.removeListener('unhandledRejection', unhandledRejectionHandler);
    clearTimeout(extendLockInterval);
    console.log(`releaseLock(${lockName})`);
    await releaseLock({tableName, lockName, issuer});
  };

  // We are ready to run the code
  try {
    const res = await fn();
    await cleanupFunction?.(); // eslint-disable-line @typescript-eslint/no-unnecessary-condition
    return {lockStatus: 'available', res};
  } catch (err: unknown) {
    await cleanupFunction?.(); // eslint-disable-line @typescript-eslint/no-unnecessary-condition
    cleanupFunction = undefined; // eslint-disable-line require-atomic-updates
    throw err;
  }
}

async function takeLock(opts: {
  tableName: string;
  lockName: string;
  issuer: Issuer;
  durationMs: number;
}): Promise<void> {
  const {tableName, lockName, issuer, durationMs} = opts;
  const now = Date.now();
  await putItem({
    tableName,
    item: {name: lockName, issuer, expiresAt: now + durationMs},
    additionalParams: {
      ConditionExpression: 'attribute_not_exists(#name) OR #expiresAt < :now',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#expiresAt': 'expiresAt',
      },
      ExpressionAttributeValues: marshall({
        ':now': now,
      }),
    },
  });
}

async function extendLock(opts: {
  tableName: string;
  lockName: string;
  issuer: string;
  durationMs: number;
}): Promise<void> {
  const {tableName, lockName, issuer, durationMs} = opts;
  await updateLock({tableName, lockName, issuer, expiresAt: Date.now() + durationMs});
}

async function releaseLock(opts: {
  tableName: string;
  lockName: string;
  issuer: string;
}): Promise<void> {
  const {tableName, lockName, issuer} = opts;
  await updateLock({tableName, lockName, issuer, expiresAt: 0});
}

async function updateLock(opts: {
  tableName: string;
  lockName: string;
  issuer: string;
  expiresAt: number;
}): Promise<void> {
  const {tableName, lockName, issuer, expiresAt} = opts;
  await updateItem({
    tableName,
    key: {name: lockName},
    updateExpression: {
      set: ['#expiresAt = :expiresAt'],
    },
    additionalParams: {
      ConditionExpression: '#issuer = :issuer',
    },
    expressionAttributeNames: {
      '#expiresAt': 'expiresAt',
      '#issuer': 'issuer',
    },
    expressionAttributeValues: {
      ':expiresAt': expiresAt,
      ':issuer': issuer,
    },
  });
}
