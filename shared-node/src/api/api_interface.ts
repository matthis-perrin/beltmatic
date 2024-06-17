export interface ApiRequest {
  method: string;
  path: string;
  body: Record<string, unknown>;
  headers: Record<string, string | string[]>;
}

export interface ApiResponse {
  body?: string;
  opts?: {
    statusCode?: number;
    contentType?: string;
    extraHeaders?: Record<string, string>;
    isBase64Encoded?: boolean;
  };
}
