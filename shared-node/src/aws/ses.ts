import {SES} from '@aws-sdk/client-ses';

import {REGION} from '@shared/env';

import {credentialsProvider} from '@shared-node/aws/credentials';

const client = new SES({region: REGION, credentials: credentialsProvider()});

export async function sendEmail(opts: {
  to: string;
  source: string;
  subject: string;
  html: string;
}): Promise<void> {
  const {to, source, subject, html} = opts;
  await client.sendEmail({
    Destination: {ToAddresses: [to]},
    Source: source,
    Message: {
      Subject: {Data: subject, Charset: 'utf8'},
      Body: {Html: {Data: html, Charset: 'utf8'}},
    },
  });
}
