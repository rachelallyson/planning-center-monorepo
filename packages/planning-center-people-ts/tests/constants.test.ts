/**
 * Tests for exported constants
 */

import {
  DEFAULT_INITIAL_RETRY_CONFIG,
  DEFAULT_AGGRESSIVE_RETRY_CONFIG,
} from '../src/modules/people';

describe('Constants', () => {
  describe('DEFAULT_INITIAL_RETRY_CONFIG', () => {
    it('should be defined with correct values', () => {
      expect(DEFAULT_INITIAL_RETRY_CONFIG).toBeDefined();
      expect(DEFAULT_INITIAL_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_INITIAL_RETRY_CONFIG.maxWaitTime).toBe(30000);
      expect(DEFAULT_INITIAL_RETRY_CONFIG.initialDelay).toBe(3000);
      expect(DEFAULT_INITIAL_RETRY_CONFIG.backoffMultiplier).toBe(2);
    });

    it('should have correct structure', () => {
      expect(DEFAULT_INITIAL_RETRY_CONFIG).toHaveProperty('maxRetries');
      expect(DEFAULT_INITIAL_RETRY_CONFIG).toHaveProperty('maxWaitTime');
      expect(DEFAULT_INITIAL_RETRY_CONFIG).toHaveProperty('initialDelay');
      expect(DEFAULT_INITIAL_RETRY_CONFIG).toHaveProperty('backoffMultiplier');
    });
  });

  describe('DEFAULT_AGGRESSIVE_RETRY_CONFIG', () => {
    it('should be defined with correct values', () => {
      expect(DEFAULT_AGGRESSIVE_RETRY_CONFIG).toBeDefined();
      expect(DEFAULT_AGGRESSIVE_RETRY_CONFIG.maxRetries).toBe(6);
      expect(DEFAULT_AGGRESSIVE_RETRY_CONFIG.maxWaitTime).toBe(60000);
      expect(DEFAULT_AGGRESSIVE_RETRY_CONFIG.initialDelay).toBe(5000);
      expect(DEFAULT_AGGRESSIVE_RETRY_CONFIG.backoffMultiplier).toBe(2);
    });

    it('should have more aggressive settings than initial config', () => {
      expect(DEFAULT_AGGRESSIVE_RETRY_CONFIG.maxRetries).toBeGreaterThan(DEFAULT_INITIAL_RETRY_CONFIG.maxRetries);
      expect(DEFAULT_AGGRESSIVE_RETRY_CONFIG.maxWaitTime).toBeGreaterThan(DEFAULT_INITIAL_RETRY_CONFIG.maxWaitTime);
      expect(DEFAULT_AGGRESSIVE_RETRY_CONFIG.initialDelay).toBeGreaterThan(DEFAULT_INITIAL_RETRY_CONFIG.initialDelay);
    });
  });
});
