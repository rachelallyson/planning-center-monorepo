import type { JsonValue } from './json-api';

/** Options for PcoHttpClient.request (method, endpoint, optional data/params/headers/timeout). */
export interface HttpRequestOptions {
  method: string;
  endpoint: string;
  data?: Record<string, JsonValue> | object;
  params?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  timeout?: number;
}

/** Success response from PcoHttpClient.request. */
export interface HttpResponse<T = Record<string, JsonValue>> {
  data: T;
  status: number;
  headers: Record<string, string>;
  requestId: string;
  duration: number;
}
