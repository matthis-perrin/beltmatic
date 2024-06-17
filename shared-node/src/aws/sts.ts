import {AssumeRoleCommand, Credentials, STSClient} from '@aws-sdk/client-sts';

import {REGION} from '@shared/env';

import {getAdminCredentials} from '@shared-node/aws/credentials';

const client = new STSClient({region: REGION, credentials: getAdminCredentials()});

export async function assumeRole(role: string): Promise<Credentials | undefined> {
  const res = await client.send(
    new AssumeRoleCommand({RoleArn: role, RoleSessionName: 'local_dev'})
  );
  return res.Credentials;
}
