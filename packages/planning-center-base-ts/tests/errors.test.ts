import { PcoApiError, rateLimitHeadersFromResponse } from '../src/errors';
import type { RateLimitHeaders } from '../src/rate-limiter';

function makeResponse(init: { status?: number; statusText?: string; headers?: Record<string, string> } = {}): Response {
  const { status = 200, statusText = 'OK', headers = {} } = init;
  const h = new Headers(headers);
  return new Response('', { status, statusText, headers: h });
}

describe('rateLimitHeadersFromResponse', () => {
  it('extracts PCO rate limit headers from Response', () => {
    const res = makeResponse({
      headers: {
        'Retry-After': '60',
        'X-PCO-API-Request-Rate-Count': '50',
        'X-PCO-API-Request-Rate-Limit': '100',
        'X-PCO-API-Request-Rate-Period': '60',
      },
    });
    expect(rateLimitHeadersFromResponse(res)).toEqual({
      'Retry-After': '60',
      'X-PCO-API-Request-Rate-Count': '50',
      'X-PCO-API-Request-Rate-Limit': '100',
      'X-PCO-API-Request-Rate-Period': '60',
    });
  });

  it('returns undefined for missing headers', () => {
    const res = makeResponse({});
    expect(rateLimitHeadersFromResponse(res)).toEqual({
      'Retry-After': undefined,
      'X-PCO-API-Request-Rate-Count': undefined,
      'X-PCO-API-Request-Rate-Limit': undefined,
      'X-PCO-API-Request-Rate-Period': undefined,
    });
  });
});

describe('PcoApiError', () => {
  it('stores status, statusText, errors, and rateLimitHeaders', () => {
    const err = new PcoApiError('Bad request', 422, 'Unprocessable Entity', [
      { title: 'Validation', detail: 'Name is invalid' },
    ]);
    expect(err.name).toBe('PcoApiError');
    expect(err.message).toBe('Bad request');
    expect(err.status).toBe(422);
    expect(err.statusText).toBe('Unprocessable Entity');
    expect(err.errors).toHaveLength(1);
    expect(err.errors[0]?.title).toBe('Validation');
    expect(err.errors[0]?.detail).toBe('Name is invalid');
    expect(err.rateLimitHeaders).toBeUndefined();
  });

  it('includes rateLimitHeaders when provided', () => {
    const headers: RateLimitHeaders = { 'Retry-After': '60' };
    const err = new PcoApiError('Rate limited', 429, 'Too Many Requests', [], headers);
    expect(err.rateLimitHeaders).toEqual(headers);
  });

  it('is instanceof Error', () => {
    const err = new PcoApiError('x', 500, 'Error', []);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(PcoApiError);
  });
});

describe('PcoApiError.fromFetchError', () => {
  it('builds error from Response and optional body errors', () => {
    const res = makeResponse({ status: 422, statusText: 'Unprocessable Entity' });
    const err = PcoApiError.fromFetchError(res, {
      errors: [{ title: 'Invalid', detail: 'Name is required' }],
    });
    expect(err.status).toBe(422);
    expect(err.statusText).toBe('Unprocessable Entity');
    expect(err.errors).toHaveLength(1);
    expect(err.message).toContain('Name is required');
    expect(err.rateLimitHeaders).toBeDefined();
  });

  it('uses statusText when no error details', () => {
    const res = makeResponse({ status: 500, statusText: 'Internal Server Error' });
    const err = PcoApiError.fromFetchError(res);
    expect(err.message).toBe('Internal Server Error');
    expect(err.errors).toEqual([]);
  });

  it('handles empty errors array', () => {
    const res = makeResponse({ status: 400, statusText: 'Bad Request' });
    const err = PcoApiError.fromFetchError(res, { errors: [] });
    expect(err.message).toBe('Bad Request');
  });
});
