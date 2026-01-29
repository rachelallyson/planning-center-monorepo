/**
 * Tests for error handling functions from error-scenarios.ts
 */

import {
  retryWithExponentialBackoff,
  CircuitBreaker,
  executeBulkOperation,
  withTimeout,
  classifyError,
  attemptRecovery,
  createErrorReport,
  DEFAULT_RETRY_CONFIG,
  TIMEOUT_CONFIG,
} from '../src/error-scenarios';
import { PcoApiError } from '@rachelallyson/planning-center-base-ts';

describe('Error Handling Functions', () => {
  describe('retryWithExponentialBackoff', () => {
    it('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await retryWithExponentialBackoff(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new PcoApiError('Server error', 500, 'Internal Server Error', []))
        .mockResolvedValue('success');
      
      const result = await retryWithExponentialBackoff(operation, {
        maxRetries: 2,
        baseDelay: 10,
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable errors', async () => {
      const operation = jest.fn().mockRejectedValue(new PcoApiError('Bad request', 400, 'Bad Request', []));
      
      await expect(retryWithExponentialBackoff(operation)).rejects.toThrow(PcoApiError);
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries', async () => {
      const operation = jest.fn().mockRejectedValue(new PcoApiError('Server error', 500, 'Internal Server Error', []));
      
      await expect(retryWithExponentialBackoff(operation, {
        maxRetries: 2,
        baseDelay: 10,
      })).rejects.toThrow(PcoApiError);
      
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should use exponential backoff', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new PcoApiError('Server error', 500, 'Internal Server Error', []))
        .mockRejectedValueOnce(new PcoApiError('Server error', 500, 'Internal Server Error', []))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await retryWithExponentialBackoff(operation, {
        maxRetries: 3,
        baseDelay: 50,
        backoffFactor: 2,
      });
      const endTime = Date.now();
      
      expect(operation).toHaveBeenCalledTimes(3);
      // Should have waited at least 50ms + 100ms = 150ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(140);
    });
  });

  describe('CircuitBreaker', () => {
    it('should execute operation when circuit is closed', async () => {
      const breaker = new CircuitBreaker(5, 60000, 60000);
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await breaker.execute(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should open circuit after threshold failures', async () => {
      const breaker = new CircuitBreaker(3, 60000, 60000);
      const operation = jest.fn().mockRejectedValue(new Error('Failure'));
      
      // Trigger failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(operation);
        } catch (e) {
          // Expected
        }
      }
      
      expect(breaker.getState()).toBe('OPEN');
      expect(breaker.getFailureCount()).toBe(3);
    });

    it('should block operations when circuit is open', async () => {
      const breaker = new CircuitBreaker(2, 60000, 60000);
      const operation = jest.fn().mockRejectedValue(new Error('Failure'));
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(operation);
        } catch (e) {
          // Expected
        }
      }
      
      // Try to execute when open
      await expect(breaker.execute(() => Promise.resolve('success'))).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should transition to half-open after recovery timeout', async () => {
      const breaker = new CircuitBreaker(2, 100, 60000); // Short recovery timeout
      const operation = jest.fn().mockRejectedValue(new Error('Failure'));
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(operation);
        } catch (e) {
          // Expected
        }
      }
      
      expect(breaker.getState()).toBe('OPEN');
      
      // Wait for recovery timeout
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Next execution should transition to half-open
      const successOp = jest.fn().mockResolvedValue('success');
      const result = await breaker.execute(successOp);
      
      expect(result).toBe('success');
      expect(breaker.getState()).toBe('CLOSED');
    });

    it('should reset failure count on success', async () => {
      const breaker = new CircuitBreaker(5, 60000, 60000);
      const failOp = jest.fn().mockRejectedValue(new Error('Failure'));
      const successOp = jest.fn().mockResolvedValue('success');
      
      // Trigger some failures
      try {
        await breaker.execute(failOp);
      } catch (e) {
        // Expected
      }
      
      expect(breaker.getFailureCount()).toBe(1);
      
      // Success should reset
      await breaker.execute(successOp);
      
      expect(breaker.getFailureCount()).toBe(0);
      expect(breaker.getState()).toBe('CLOSED');
    });
  });

  describe('executeBulkOperation', () => {
    it('should process all items successfully', async () => {
      const items = [1, 2, 3, 4, 5];
      const operation = jest.fn().mockImplementation((item) => Promise.resolve(item * 2));
      
      const result = await executeBulkOperation(items, operation);
      
      expect(result.successful).toHaveLength(5);
      expect(result.failed).toHaveLength(0);
      expect(result.totalProcessed).toBe(5);
      expect(result.successRate).toBe(1);
      expect(operation).toHaveBeenCalledTimes(5);
    });

    it('should handle errors when continueOnError is true', async () => {
      const items = [1, 2, 3];
      const operation = jest.fn().mockImplementation((item) => {
        if (item === 2) {
          return Promise.reject(new Error('Failed'));
        }
        return Promise.resolve(item * 2);
      });
      
      const result = await executeBulkOperation(items, operation, {
        continueOnError: true,
      });
      
      expect(result.successful).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.totalProcessed).toBe(3);
      expect(result.successRate).toBeCloseTo(0.667, 2);
    });

    it('should stop on error when continueOnError is false', async () => {
      const items = [1, 2, 3];
      const operation = jest.fn().mockImplementation((item) => {
        if (item === 2) {
          return Promise.reject(new Error('Failed'));
        }
        return Promise.resolve(item * 2);
      });
      
      await expect(executeBulkOperation(items, operation, {
        continueOnError: false,
      })).rejects.toThrow('Failed');
    });

    it('should process items in batches', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const operation = jest.fn().mockImplementation((item) => Promise.resolve(item * 2));
      const batchProcessor = jest.fn();
      
      await executeBulkOperation(items, operation, {
        batchSize: 3,
        onItemComplete: batchProcessor,
      });
      
      expect(operation).toHaveBeenCalledTimes(10);
      expect(batchProcessor).toHaveBeenCalledTimes(10);
    });

    it('should call onItemComplete for each item', async () => {
      const items = [1, 2, 3];
      const operation = jest.fn().mockImplementation((item) => Promise.resolve(item * 2));
      const onItemComplete = jest.fn();
      
      await executeBulkOperation(items, operation, {
        onItemComplete,
      });
      
      expect(onItemComplete).toHaveBeenCalledTimes(3);
      expect(onItemComplete).toHaveBeenCalledWith(0, 2);
      expect(onItemComplete).toHaveBeenCalledWith(1, 4);
      expect(onItemComplete).toHaveBeenCalledWith(2, 6);
    });
  });

  describe('withTimeout', () => {
    it('should return result when operation completes before timeout', async () => {
      const operation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('success'), 50))
      );
      
      const result = await withTimeout(operation, 1000);
      
      expect(result).toBe('success');
    });

    it('should throw timeout error when operation exceeds timeout', async () => {
      const operation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('success'), 200))
      );
      
      await expect(withTimeout(operation, 100, 'Custom timeout message')).rejects.toThrow('Custom timeout message');
    });

    it('should use default timeout message', async () => {
      const operation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('success'), 200))
      );
      
      await expect(withTimeout(operation, 100)).rejects.toThrow('Operation timed out after 100ms');
    });
  });

  describe('classifyError', () => {
    it('should classify PcoApiError correctly', () => {
      const error = new PcoApiError('Rate limited', 429, 'Too Many Requests', []);
      const classification = classifyError(error);
      
      expect(classification.category).toBe('rate_limit');
      expect(classification.severity).toBe('medium');
      expect(classification.retryable).toBe(true);
    });

    it('should classify authentication errors', () => {
      const error = new PcoApiError('Unauthorized', 401, 'Unauthorized', []);
      const classification = classifyError(error);
      
      expect(classification.category).toBe('authentication');
      expect(classification.severity).toBe('high');
      expect(classification.retryable).toBe(false);
    });

    it('should classify authorization errors', () => {
      const error = new PcoApiError('Forbidden', 403, 'Forbidden', []);
      const classification = classifyError(error);
      
      expect(classification.category).toBe('authorization');
      expect(classification.severity).toBe('high');
      expect(classification.retryable).toBe(false);
    });

    it('should classify validation errors', () => {
      const error = new PcoApiError('Validation failed', 422, 'Unprocessable Entity', []);
      const classification = classifyError(error);
      
      expect(classification.category).toBe('validation');
      expect(classification.severity).toBe('medium');
      expect(classification.retryable).toBe(false);
    });

    it('should classify server errors', () => {
      const error = new PcoApiError('Server error', 500, 'Internal Server Error', []);
      const classification = classifyError(error);
      
      expect(classification.category).toBe('server');
      expect(classification.severity).toBe('high');
      expect(classification.retryable).toBe(true);
    });

    it('should classify network errors', () => {
      const error = new TypeError('fetch failed');
      const classification = classifyError(error);
      
      expect(classification.category).toBe('network');
      expect(classification.severity).toBe('medium');
      expect(classification.retryable).toBe(true);
    });

    it('should classify timeout errors', () => {
      const error = new Error('Request timeout');
      const classification = classifyError(error);
      
      expect(classification.category).toBe('network');
      expect(classification.severity).toBe('medium');
      expect(classification.retryable).toBe(true);
    });

    it('should classify unknown errors', () => {
      const error = new Error('Unknown error');
      const classification = classifyError(error);
      
      expect(classification.category).toBe('unknown');
      expect(classification.severity).toBe('high');
      expect(classification.retryable).toBe(false);
    });
  });

  describe('attemptRecovery', () => {
    it('should not retry non-retryable errors', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const error = new PcoApiError('Bad request', 400, 'Bad Request', []);
      const context = {
        client: {} as any,
        operation: 'test',
      };
      
      await expect(attemptRecovery(operation, error, context)).rejects.toThrow(PcoApiError);
      expect(operation).not.toHaveBeenCalled();
    });

    it('should retry rate limit errors with delay', async () => {
      // Create a mock error with rate limit headers
      const error = new PcoApiError('Rate limited', 429, 'Too Many Requests', [], { 'Retry-After': '0' });
      
      const operation = jest.fn().mockResolvedValue('success');
      const context = {
        client: {
          config: {},
        } as any,
        operation: 'test',
      };
      
      // attemptRecovery should handle rate limit errors
      const result = await attemptRecovery(operation, error, context);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });
  });

  describe('createErrorReport', () => {
    it('should create error report with all context', () => {
      const error = new PcoApiError('Test error', 500, 'Internal Server Error', []);
      const context = {
        operation: 'test-operation',
        client: {
          config: {
            accessToken: 'token',
            appId: 'app-id',
            appSecret: 'secret',
          },
        } as any,
        requestInfo: {
          url: '/test',
          method: 'GET',
          headers: { 'Authorization': 'Bearer token' },
        },
      };
      
      const report = createErrorReport(error, context);
      
      expect(report.timestamp).toBeDefined();
      expect(report.operation).toBe('test-operation');
      expect(report.error.name).toBe('PcoApiError');
      expect(report.error.message).toBe('Test error');
      expect(report.error.status).toBe(500);
      expect(report.context.clientConfig.hasAccessToken).toBe(true);
      expect(report.context.clientConfig.hasAppId).toBe(true);
      expect(report.context.clientConfig.hasAppSecret).toBe(true);
      expect(report.context.requestInfo).toEqual(context.requestInfo);
      expect(report.classification).toBeDefined();
    });

    it('should handle errors without status', () => {
      const error = new Error('Generic error');
      const context = {
        operation: 'test-operation',
        client: {
          config: {},
        } as any,
      };
      
      const report = createErrorReport(error, context);
      
      expect(report.error.name).toBe('Error');
      expect(report.error.message).toBe('Generic error');
      expect(report.error.status).toBeUndefined();
    });
  });

  describe('Constants', () => {
    it('should export DEFAULT_RETRY_CONFIG', () => {
      expect(DEFAULT_RETRY_CONFIG).toBeDefined();
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.baseDelay).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.maxDelay).toBe(30000);
      expect(DEFAULT_RETRY_CONFIG.backoffFactor).toBe(2);
      expect(Array.isArray(DEFAULT_RETRY_CONFIG.retryableStatuses)).toBe(true);
    });

    it('should export TIMEOUT_CONFIG', () => {
      expect(TIMEOUT_CONFIG).toBeDefined();
      expect(TIMEOUT_CONFIG.GET).toBe(10000);
      expect(TIMEOUT_CONFIG.POST).toBe(15000);
      expect(TIMEOUT_CONFIG.PATCH).toBe(15000);
      expect(TIMEOUT_CONFIG.DELETE).toBe(10000);
      expect(TIMEOUT_CONFIG.BULK).toBe(60000);
      expect(TIMEOUT_CONFIG.EXPORT).toBe(300000);
    });
  });
});
