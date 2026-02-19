import { PcoRateLimiter } from '../src/rate-limiter';

describe('PcoRateLimiter', () => {
  it('uses default limit and window when not provided', () => {
    const limiter = new PcoRateLimiter();
    const info = limiter.getRateLimitInfo();
    expect(info.limit).toBe(100);
    expect(info.remaining).toBe(100);
    expect(info.resetTime).toBeGreaterThanOrEqual(Date.now());
  });

  it('uses custom limit and windowMs', () => {
    const limiter = new PcoRateLimiter(50, 10000);
    const info = limiter.getRateLimitInfo();
    expect(info.limit).toBe(50);
    expect(info.remaining).toBe(50);
  });

  it('decrements remaining when recordRequest is called', () => {
    const limiter = new PcoRateLimiter(10, 60000);
    limiter.recordRequest();
    limiter.recordRequest();
    expect(limiter.getRateLimitInfo().remaining).toBe(8);
  });

  it('getTimeUntilReset returns positive ms until window end', () => {
    const limiter = new PcoRateLimiter(10, 5000);
    const t = limiter.getTimeUntilReset();
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThanOrEqual(5000);
  });

  it('updateFromHeaders updates limit, windowMs, and requestCount', () => {
    const limiter = new PcoRateLimiter(100, 20000);
    limiter.updateFromHeaders({
      'X-PCO-API-Request-Rate-Limit': '200',
      'X-PCO-API-Request-Rate-Period': '30',
      'X-PCO-API-Request-Rate-Count': '5',
    });
    const info = limiter.getRateLimitInfo();
    expect(info.limit).toBe(200);
    expect(info.remaining).toBe(195);
  });

  it('updateFromHeaders ignores invalid or missing header values', () => {
    const limiter = new PcoRateLimiter(10, 10000);
    limiter.updateFromHeaders({
      'X-PCO-API-Request-Rate-Limit': 'not-a-number',
      'X-PCO-API-Request-Rate-Count': '3',
    });
    const info = limiter.getRateLimitInfo();
    expect(info.limit).toBe(10);
    expect(info.remaining).toBe(7);
  });

  it('waitForAvailability resolves immediately when under limit', async () => {
    const limiter = new PcoRateLimiter(10, 10000);
    await limiter.waitForAvailability();
  });

  it('waitForAvailability waits when at limit', async () => {
    const limiter = new PcoRateLimiter(1, 100);
    limiter.recordRequest();
    const start = Date.now();
    await limiter.waitForAvailability();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });
});
