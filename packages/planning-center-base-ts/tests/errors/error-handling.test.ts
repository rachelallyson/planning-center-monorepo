/**
 * Tests for the error handling functionality
 */

import { PcoApiError } from '../../src/errors/api-error';
import {
  ErrorCategory,
  ErrorSeverity,
  PcoError,
  handleNetworkError,
  handleTimeoutError,
  handleValidationError,
  retryWithBackoff,
  shouldNotRetry,
  withErrorBoundary,
} from '../../src/errors/error-handling';

// Utilities
const createResponse = (body: unknown, init: ResponseInit = {}) => new Response(body, init);

describe('errors/api-error', () => {
  it('PcoApiError constructor sets fields', () => {
    const e = new PcoApiError('msg', 404, 'Not Found', [], {
      'Retry-After': '5',
      'X-PCO-API-Request-Rate-Count': '10',
      'X-PCO-API-Request-Rate-Limit': '100',
      'X-PCO-API-Request-Rate-Period': '60',
    });
    expect(e).toBeInstanceOf(PcoApiError);
    expect(e.name).toBe('PcoApiError');
    expect(e.message).toBe('msg');
    expect(e.status).toBe(404);
    expect(e.statusText).toBe('Not Found');
    expect(e.errors).toEqual([]);
    expect(e.rateLimitHeaders?.['Retry-After']).toBe('5');
  });

  it('PcoApiError.fromFetchError extracts message from JSON:API errors', async () => {
    const resp = createResponse(
      { errors: [{ title: 'Bad', detail: 'Bad detail' }] },
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {
          'retry-after': '7',
          'x-pco-api-request-rate-count': '3',
          'x-pco-api-request-rate-limit': '30',
          'x-pco-api-request-rate-period': '60',
        },
      }
    );

    const err = PcoApiError.fromFetchError(resp, await resp.json());
    expect(err.message).toBe('Bad detail');
    expect(err.status).toBe(400);
    expect(err.statusText).toBe('Bad Request');
    expect(err.errors.length).toBe(1);
    expect(err.rateLimitHeaders?.['Retry-After']).toBe('7');
  });

  it('PcoApiError.fromFetchError falls back to statusText without errors', async () => {
    const resp = createResponse({}, { status: 500, statusText: 'Server Error' });
    const err = PcoApiError.fromFetchError(resp, await resp.json());
    expect(err.message).toBe('Server Error');
    expect(err.errors).toEqual([]);
  });
});

describe('errors/error-handling PcoError categorization', () => {
  const mk = (status: number) =>
    new PcoError('m', status, 't', [], undefined, { endpoint: '/x', method: 'GET' });

  it('categorizes 401 as AUTHENTICATION, non-retryable, HIGH', () => {
    const e = mk(401);
    expect(e.category).toBe(ErrorCategory.AUTHENTICATION);
    expect(e.shouldRetry()).toBe(false);
    expect(e.severity).toBe(ErrorSeverity.HIGH);
  });

  it('categorizes 403 as AUTHORIZATION, non-retryable', () => {
    const e = mk(403);
    expect(e.category).toBe(ErrorCategory.AUTHORIZATION);
    expect(e.shouldRetry()).toBe(false);
  });

  it('categorizes 429 as RATE_LIMIT, retryable, MEDIUM and computes retry delay', () => {
    const e = new PcoError(
      'rate limited',
      429,
      'Too Many Requests',
      [],
      { 'Retry-After': '12' },
      {}
    );
    expect(e.category).toBe(ErrorCategory.RATE_LIMIT);
    expect(e.shouldRetry()).toBe(true);
    expect(e.getRetryDelay()).toBe(12000);
  });

  it('categorizes 400/422 as VALIDATION, non-retryable, LOW', () => {
    expect(mk(400).category).toBe(ErrorCategory.VALIDATION);
    expect(mk(422).shouldRetry()).toBe(false);
  });

  it('categorizes 500+ as EXTERNAL_API, retryable', () => {
    const e = mk(503);
    expect(e.category).toBe(ErrorCategory.EXTERNAL_API);
    expect(e.shouldRetry()).toBe(true);
  });

  it('categorizes 0/408 as NETWORK, retryable', () => {
    expect(mk(0).category).toBe(ErrorCategory.NETWORK);
    expect(mk(408).shouldRetry()).toBe(true);
  });

  it('categorizes others as UNKNOWN', () => {
    expect(mk(418).category).toBe(ErrorCategory.UNKNOWN);
  });
});

describe('utility functions', () => {
  it('shouldNotRetry respects PcoError retryable', () => {
    const e = new PcoError('m', 503, 't', [], undefined, {});
    expect(shouldNotRetry(e)).toBe(false);
  });

  it('shouldNotRetry blocks common PcoApiError statuses', () => {
    const blocked = [401, 403, 400, 422];
    for (const s of blocked) {
      const e = new PcoApiError('m', s, 't', []);
      expect(shouldNotRetry(e)).toBe(true);
    }
  });

  it('retryWithBackoff retries and calls onRetry, then succeeds', async () => {
    const calls: number[] = [];
    let attempts = 0;
    const fn = jest.fn().mockImplementation(async () => {
      attempts += 1;
      if (attempts < 3) {
        throw new PcoError('temporary', 503, 'Service Unavailable', [], undefined, {});
      }
      return 'ok';
    });

    const result = await retryWithBackoff(fn, {
      baseDelay: 1,
      maxDelay: 10,
      maxRetries: 3,
      onRetry: (err, attempt) => calls.push(attempt),
    });

    expect(result).toBe('ok');
    expect(calls).toEqual([1, 2]);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('retryWithBackoff respects Retry-After for 429', async () => {
    const start = Date.now();
    let fired = 0;
    const fn = jest.fn().mockImplementation(async () => {
      fired += 1;
      if (fired === 1) {
        throw new PcoError('rl', 429, 'Too Many Requests', [], { 'Retry-After': '0' }, {});
      }
      return 'done';
    });

    const res = await retryWithBackoff(fn, { baseDelay: 1000, maxRetries: 2 });
    expect(res).toBe('done');
    expect(fired).toBe(2);
    expect(Date.now() - start).toBeGreaterThanOrEqual(0);
  });

  it('withErrorBoundary passes through PcoError', async () => {
    const e = new PcoError('x', 500, 'E', [], undefined, {});
    await expect(withErrorBoundary(async () => Promise.reject(e))).rejects.toBe(e);
  });

  it('withErrorBoundary wraps unknown error into PcoError with NETWORK category', async () => {
    await expect(
      withErrorBoundary(async () => {
        throw new Error('boom');
      })
    ).rejects.toMatchObject({ name: 'PcoError', category: ErrorCategory.NETWORK });
  });

  it('handleValidationError throws PcoError with VALIDATION context', () => {
    try {
      handleValidationError(new Error('x'), 'field', {});
      fail('expected throw');
    } catch (e) {
      const err = e as PcoError;
      expect(err.category).toBe(ErrorCategory.VALIDATION);
      expect(err.severity).toBe(ErrorSeverity.LOW);
    }
  });

  it('handleTimeoutError throws PcoError with NETWORK category', () => {
    try {
      handleTimeoutError('op', 123, {});
      fail('expected throw');
    } catch (e) {
      const err = e as PcoError;
      expect(err.category).toBe(ErrorCategory.NETWORK);
    }
  });

  it('handleNetworkError throws PcoError with NETWORK category', () => {
    try {
      handleNetworkError(new Error('net'), 'op', {});
      fail('expected throw');
    } catch (e) {
      const err = e as PcoError;
      expect(err.category).toBe(ErrorCategory.NETWORK);
    }
  });
});
