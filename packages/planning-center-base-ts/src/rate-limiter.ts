/**
 * PCO Rate Limiter
 *
 * Planning Center Online has the following rate limits:
 * - 100 requests per 20 seconds (subject to change)
 * - Rate limit headers are returned on every response
 * - 429 responses include Retry-After header
 * - Limits and time periods can change dynamically
 *
 * This rate limiter tracks requests and enforces these limits.
 */

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitHeaders {
  'X-PCO-API-Request-Rate-Limit'?: string;
  'X-PCO-API-Request-Rate-Period'?: string;
  'X-PCO-API-Request-Rate-Count'?: string;
  'Retry-After'?: string;
}

export class PcoRateLimiter {
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly defaultLimit = 100; // requests per 20 seconds
  private readonly defaultWindow = 20000; // 20 seconds in milliseconds
  private limit: number;
  private windowMs: number;

  constructor(limit?: number, windowMs?: number) {
    this.limit = limit || this.defaultLimit;
    this.windowMs = windowMs || this.defaultWindow;
  }

  /**
   * Check if a request can be made
   */
  canMakeRequest(): boolean {
    this.updateWindow();

    return this.requestCount < this.limit;
  }

  /**
   * Record a request
   */
  recordRequest(): void {
    this.updateWindow();
    this.requestCount++;
  }

  /**
   * Get time until next window reset
   */
  getTimeUntilReset(): number {
    this.updateWindow();
    const now = Date.now();

    return Math.max(0, this.windowStart + this.windowMs - now);
  }

  /**
   * Get current rate limit info
   */
  getRateLimitInfo(): RateLimitInfo {
    this.updateWindow();

    return {
      limit: this.limit,
      remaining: Math.max(0, this.limit - this.requestCount),
      resetTime: this.windowStart + this.windowMs,
    };
  }

  /**
   * Update rate limit info from response headers
   */
  updateFromHeaders(headers: RateLimitHeaders): void {
    if (headers['X-PCO-API-Request-Rate-Limit']) {
      this.limit = parseInt(headers['X-PCO-API-Request-Rate-Limit'], 10);
    }

    if (headers['X-PCO-API-Request-Rate-Period']) {
      // Update window period from server (in seconds, convert to milliseconds)
      const periodSeconds = parseInt(headers['X-PCO-API-Request-Rate-Period'], 10);
      if (!isNaN(periodSeconds)) {
        this.windowMs = periodSeconds * 1000;
      }
    }

    if (headers['X-PCO-API-Request-Rate-Count']) {
      this.requestCount = parseInt(headers['X-PCO-API-Request-Rate-Count'], 10);
    }

    if (headers['Retry-After']) {
      // Retry-After is informational only, don't update window
    }
  }

  /**
   * Wait until a request can be made
   */
  async waitForAvailability(): Promise<void> {
    this.updateWindow();

    if (this.requestCount < this.limit) {
      return;
    }

    const waitTime = this.getTimeUntilReset();

    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.updateWindow();
  }

  /**
   * Update the window if needed
   */
  private updateWindow(): void {
    const now = Date.now();

    if (now - this.windowStart >= this.windowMs) {
      this.requestCount = 0;
      this.windowStart = now;
    }
  }
}

