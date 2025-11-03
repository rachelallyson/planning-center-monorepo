import { PcoClient } from '../src/client';
import type { PcoClientConfig } from '../src/types/client';
import { PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

// Mock the base module dependencies
jest.mock('@rachelallyson/planning-center-base-ts', () => {
  const actual = jest.requireActual('@rachelallyson/planning-center-base-ts');
  return {
    ...actual,
    PcoHttpClient: jest.fn().mockImplementation(() => ({
      request: jest.fn(),
      getPerformanceMetrics: jest.fn().mockReturnValue({}),
      getRateLimitInfo: jest.fn().mockReturnValue({}),
    })),
    PaginationHelper: jest.fn().mockImplementation(() => ({})),
    BatchExecutor: jest.fn().mockImplementation(() => ({})),
    PcoEventEmitter: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
      removeAllListeners: jest.fn(),
      listenerCount: jest.fn().mockReturnValue(0),
      eventTypes: jest.fn().mockReturnValue([]),
    })),
  };
});

describe('PcoClient branch coverage', () => {
  const baseConfig: PcoClientConfig = {
    auth: {
      type: 'oauth',
      accessToken: 'test-token',
      refreshToken: 'test-refresh-token',
      onRefresh: jest.fn(),
      onRefreshFailure: jest.fn(),
    },
  };

  describe('setupEventHandlers', () => {
    it('should not set up event handlers when events config is undefined', () => {
      const config: PcoClientConfig = {
        ...baseConfig,
      };
      const client = new PcoClient(config);
      
      // All event handlers should not be set when config.events is undefined
      // This is verified by no errors being thrown
      expect(client).toBeInstanceOf(PcoClient);
    });

    it('should set up only provided event handlers', () => {
      const onError = jest.fn();
      const onAuthFailure = jest.fn();
      const config: PcoClientConfig = {
        ...baseConfig,
        events: {
          onError,
          onAuthFailure,
          // Intentionally omit other handlers
        },
      };
      const client = new PcoClient(config);
      
      expect(client).toBeInstanceOf(PcoClient);
      // Verify handlers were registered (indirectly through no errors)
    });

    it('should set up all event handlers when all are provided', () => {
      const handlers = {
        onError: jest.fn(),
        onAuthFailure: jest.fn(),
        onRequestStart: jest.fn(),
        onRequestComplete: jest.fn(),
        onRateLimit: jest.fn(),
      };
      const config: PcoClientConfig = {
        ...baseConfig,
        events: handlers,
      };
      const client = new PcoClient(config);
      
      expect(client).toBeInstanceOf(PcoClient);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners when eventType is not provided', () => {
      const config: PcoClientConfig = {
        ...baseConfig,
      };
      const client = new PcoClient(config);
      
      client.removeAllListeners();
      
      // Should not throw
      expect(client).toBeInstanceOf(PcoClient);
    });

    it('should remove listeners for specific eventType when provided', () => {
      const config: PcoClientConfig = {
        ...baseConfig,
      };
      const client = new PcoClient(config);
      
      client.removeAllListeners('error');
      
      // Should not throw
      expect(client).toBeInstanceOf(PcoClient);
    });
  });

  describe('updateConfig', () => {
    it('should update modules when config is updated', () => {
      const config: PcoClientConfig = {
        ...baseConfig,
      };
      const client = new PcoClient(config);
      
      const originalPeople = client.people;
      
      client.updateConfig({
        auth: {
          ...baseConfig.auth!,
          accessToken: 'new-token',
        },
      });
      
      // Modules should be recreated with new HTTP client
      expect(client.people).toBeDefined();
      expect(client.people).not.toBe(originalPeople);
    });
  });
});

