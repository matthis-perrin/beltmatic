import {errorAsString} from '@shared/lib/type_utils';

import {showAlert} from '@shared-web/components/core/notifications';

interface NotifyErrorOptions {
  extra?: unknown;
  message?: string;
  duration?: number;
  silent?: boolean;
}

export function notifyError(err: unknown, options: NotifyErrorOptions = {}): void {
  const {extra, message, duration, silent} = options;
  const alertMessage = message ?? errorAsString(err);
  if (!silent) {
    showAlert(alertMessage, {duration});
  }

  // // TODO: Send to the sourcemap server to convert the error stack and log to s3
  // // eslint-disable-next-line no-console
  // console.error('Should send error log to backend', errorJson);

  console.error(err);
  if (extra !== undefined) {
    console.log(extra);
  }
}
