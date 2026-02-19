/** Current rate limit state: limit, remaining requests, reset timestamp (ms). */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}

/** PCO rate-limit response headers (parsed from Response). */
export interface RateLimitHeaders {
  'X-PCO-API-Request-Rate-Limit'?: string;
  'X-PCO-API-Request-Rate-Period'?: string;
  'X-PCO-API-Request-Rate-Count'?: string;
  'Retry-After'?: string;
}

function parseNum(s: string | undefined): number | null {
  if (s === undefined) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

/**
 * Tracks PCO rate limits and waits when needed. Used by PcoHttpClient; you typically
 * call client.getRateLimitInfo() rather than using this class directly.
 */
export class PcoRateLimiter {
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly defaultLimit = 100;
  private readonly defaultWindow = 20000;
  private limit: number;
  private windowMs: number;

  /** @param limit Max requests per window (default 100). @param windowMs Window length in ms (default 20000). */
  constructor(limit?: number, windowMs?: number) {
    this.limit = limit ?? this.defaultLimit;
    this.windowMs = windowMs ?? this.defaultWindow;
  }

  /** Record one request (call after each API request). */
  recordRequest(): void {
    this.updateWindow();
    this.requestCount++;
  }

  /** Milliseconds until the current window resets. */
  getTimeUntilReset(): number {
    this.updateWindow();
    return Math.max(0, this.windowStart + this.windowMs - Date.now());
  }

  /** Current limit, remaining, and reset timestamp. */
  getRateLimitInfo(): RateLimitInfo {
    this.updateWindow();
    return {
      limit: this.limit,
      remaining: Math.max(0, this.limit - this.requestCount),
      resetTime: this.windowStart + this.windowMs,
    };
  }

  /** Update state from response headers (e.g. after a 429 or successful request). */
  updateFromHeaders(headers: RateLimitHeaders): void {
    const limitVal = parseNum(headers['X-PCO-API-Request-Rate-Limit']);
    if (limitVal !== null) this.limit = limitVal;

    const periodVal = parseNum(headers['X-PCO-API-Request-Rate-Period']);
    if (periodVal !== null) this.windowMs = periodVal * 1000;

    const countVal = parseNum(headers['X-PCO-API-Request-Rate-Count']);
    if (countVal !== null) this.requestCount = countVal;

    const retryVal = parseNum(headers['Retry-After']);
    if (retryVal !== null) this.windowStart = Date.now() - (this.windowMs - retryVal * 1000);
  }

  /** Wait until under the limit (used before retrying after 429). */
  async waitForAvailability(): Promise<void> {
    this.updateWindow();
    if (this.requestCount < this.limit) return;
    const wait = this.getTimeUntilReset();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    this.updateWindow();
  }

  private updateWindow(): void {
    const now = Date.now();
    if (now - this.windowStart >= this.windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }
  }
}
