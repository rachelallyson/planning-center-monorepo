/**
 * API error from non-2xx responses.
 */

import type { ErrorObject as JsonApiError } from './json-api';
import type { RateLimitHeaders } from './rate-limiter';

function parseErrors(data?: { errors?: JsonApiError[] }): JsonApiError[] {
  const raw = data?.errors;
  return Array.isArray(raw) ? raw : [];
}

function messageFromErrors(errors: JsonApiError[], statusText: string): string {
  return errors.length > 0
    ? errors.map((e) => e.detail ?? e.title ?? 'Unknown error').join('; ')
    : statusText;
}

/**
 * Extract PCO rate-limit headers from a fetch Response. Use when handling 429 or when
 * you need to read limits from a raw Response (e.g. before throwing PcoApiError).
 */
export function rateLimitHeadersFromResponse(response: Response): RateLimitHeaders {
  const h = response.headers;
  return {
    'Retry-After': h.get('retry-after') ?? undefined,
    'X-PCO-API-Request-Rate-Count': h.get('x-pco-api-request-rate-count') ?? undefined,
    'X-PCO-API-Request-Rate-Limit': h.get('x-pco-api-request-rate-limit') ?? undefined,
    'X-PCO-API-Request-Rate-Period': h.get('x-pco-api-request-rate-period') ?? undefined,
  };
}

/**
 * Error thrown for non-2xx API responses. Use in catch blocks to read status, message,
 * and optional rate-limit headers. Not thrown for 429 after retries (separate error).
 */
export class PcoApiError extends Error {
  /** HTTP status code (e.g. 404, 422). */
  readonly status: number;
  /** HTTP status text. */
  readonly statusText: string;
  /** JSON:API error objects from the response body. */
  readonly errors: JsonApiError[];
  /** PCO rate-limit headers when present (e.g. Retry-After, X-PCO-API-Request-Rate-*). */
  readonly rateLimitHeaders?: RateLimitHeaders;

  constructor(
    message: string,
    status: number,
    statusText: string,
    errors: JsonApiError[],
    rateLimitHeaders?: RateLimitHeaders,
  ) {
    super(message);
    this.name = 'PcoApiError';
    this.status = status;
    this.statusText = statusText;
    this.errors = errors;
    this.rateLimitHeaders = rateLimitHeaders;
  }

  /** Build a PcoApiError from a fetch Response and optional parsed body (e.g. from response.json()). */
  static fromFetchError(response: Response, data?: { errors?: JsonApiError[] }): PcoApiError {
    const apiErrors = parseErrors(data);
    const message = messageFromErrors(apiErrors, response.statusText);
    return new PcoApiError(
      message,
      response.status,
      response.statusText,
      apiErrors,
      rateLimitHeadersFromResponse(response),
    );
  }
}
