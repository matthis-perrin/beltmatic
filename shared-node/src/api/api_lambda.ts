import {NODE_ENV} from '@shared/env';

import {ApiRequest, ApiResponse} from '@shared-node/api/api_interface';

export interface LambdaEvent {
  headers: Record<string, string | string[]>;
  queryStringParameters?: Record<string, string>;
  requestContext: {
    http: {
      method: string;
      path: string;
    };
    timeEpoch: number;
  };
  body?: string;
}

export interface LambdaResponse {
  headers?: Record<string, string | undefined>;
  statusCode: number;
  body: string | Buffer;
}

function getHeader(headers: Record<string, string | string[]>, name: string): string | undefined {
  const headerValue = headers[name];
  return Array.isArray(headerValue) ? headerValue[0] : headerValue;
}

export function lambdaEventToApiRequest(event: LambdaEvent): ApiRequest {
  const {headers, requestContext, queryStringParameters, body} = event;
  const {http} = requestContext;
  const method = http.method.toUpperCase();
  const path = normalizePath(http.path);
  const parsedBody = method === 'GET' ? queryStringParameters ?? {} : parseBody(body);
  return {method, path, headers, body: parsedBody};
}

export function apiResponseToLambdaResonse(opts: {
  req: ApiRequest;
  frontendDomain?: string;
}): (res: ApiResponse) => LambdaResponse {
  const {req, frontendDomain} = opts;
  const origin = getHeader(req.headers, 'origin') ?? '';
  return apiResponse => {
    const {body: rawBody, opts} = apiResponse;

    let body = rawBody;
    let isBase64Encoded = opts?.isBase64Encoded;
    if (Buffer.isBuffer(rawBody)) {
      body = rawBody.toString('base64');
      isBase64Encoded = true;
    }

    const {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      statusCode = 200,
      contentType = 'application/json',
      extraHeaders = {},
    } = opts ?? {};

    // Add cors headers to restrict to the frontend domain if there is one
    let corsHeaders: Record<string, string | undefined> = {};
    if (frontendDomain !== undefined) {
      const httpProtocol = `http${NODE_ENV === 'development' ? '' : 's'}://`;
      const frontendUrl = `${httpProtocol}${frontendDomain}`;
      const allowedOrigin = new Set([frontendUrl]);
      corsHeaders = allowedOrigin.has(origin)
        ? {
            'Access-Control-Allow-Origin': allowedOrigin.has(origin) ? origin : undefined,
            'Access-Control-Allow-Headers': 'content-type',
          }
        : {};
    }

    return {
      statusCode,
      headers: {
        'Content-Type': contentType,
        ...corsHeaders,
        ...extraHeaders,
      },
      body: body ?? '',
      isBase64Encoded,
    };
  };
}

function normalizePath(path: string): string {
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailing = withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
  return withoutTrailing;
}

function parseBody(body?: string | null): Record<string, unknown> {
  let jsonBody = {};
  if (typeof body === 'string') {
    try {
      jsonBody = JSON.parse(body);
    } catch {
      // leave jsonBody as an empty object
    }
  }
  return jsonBody;
}
