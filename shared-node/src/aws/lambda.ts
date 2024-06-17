import {InvokeCommand, LambdaClient} from '@aws-sdk/client-lambda';

import {REGION} from '@shared/env';

import {credentialsProvider} from '@shared-node/aws/credentials';

export interface LambdaContext {
  getRemainingTimeInMillis: () => number;
}

const client = new LambdaClient({region: REGION, credentials: credentialsProvider()});

export async function invokeFunctionAsync(opts: {functionName: string}): Promise<void> {
  const {functionName} = opts;
  await client.send(new InvokeCommand({FunctionName: functionName, InvocationType: 'Event'}));
}
