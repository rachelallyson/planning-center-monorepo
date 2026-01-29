/**
 * Tests for PcoClient.emit() method
 */

import { PcoClient } from '../src/client';
import type { PcoClientConfig } from '../src/types/client';

// Mock the base module dependencies
jest.mock('@rachelallyson/planning-center-base-ts', () => {
  const actual = jest.requireActual('@rachelallyson/planning-center-base-ts');
  const mockEventEmitter = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn(),
    listenerCount: jest.fn().mockReturnValue(0),
    eventTypes: jest.fn().mockReturnValue([]),
  };
  return {
    ...actual,
    PcoHttpClient: jest.fn().mockImplementation(() => ({
      request: jest.fn(),
      getPerformanceMetrics: jest.fn().mockReturnValue({}),
      getRateLimitInfo: jest.fn().mockReturnValue({}),
    })),
    PaginationHelper: jest.fn().mockImplementation(() => ({})),
    BatchExecutor: jest.fn().mockImplementation(() => ({})),
    PcoEventEmitter: jest.fn().mockImplementation(() => mockEventEmitter),
  };
});

import { PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('PcoClient.emit', () => {
  const baseConfig: PcoClientConfig = {
    auth: {
      type: 'oauth',
      accessToken: 'test-token',
      refreshToken: 'test-refresh-token',
      onRefresh: jest.fn(),
      onRefreshFailure: jest.fn(),
    },
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should emit events through the event emitter', () => {
    const client = new PcoClient(baseConfig);
    const mockEvent = {
      type: 'request:start' as const,
      timestamp: new Date().toISOString(),
      endpoint: '/test',
      method: 'GET',
      requestId: 'test-request-id',
    };

    client.emit(mockEvent);

    // Get the mock event emitter instance
    const eventEmitter = (PcoEventEmitter as jest.Mock).mock.results[0].value;
    expect(eventEmitter.emit).toHaveBeenCalledWith(mockEvent);
  });

  it('should emit different event types', () => {
    // Create a new client for this test to get a fresh event emitter
    const client = new PcoClient(baseConfig);
    const eventEmitter = (PcoEventEmitter as jest.Mock).mock.results[(PcoEventEmitter as jest.Mock).mock.results.length - 1].value;
    
    // Clear any previous calls from client initialization
    eventEmitter.emit.mockClear();
    
    const event1 = {
      type: 'request:start' as const,
      timestamp: new Date().toISOString(),
      endpoint: '/test1',
      method: 'GET',
      requestId: 'test-request-id-1',
    };
    const event2 = {
      type: 'request:complete' as const,
      timestamp: new Date().toISOString(),
      endpoint: '/test2',
      method: 'GET',
      status: 200,
      duration: 100,
      requestId: 'test-request-id-2',
    };

    client.emit(event1);
    client.emit(event2);

    expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
    expect(eventEmitter.emit).toHaveBeenCalledWith(event1);
    expect(eventEmitter.emit).toHaveBeenCalledWith(event2);
  });

  it('should emit error events', () => {
    const client = new PcoClient(baseConfig);
    const errorEvent = {
      type: 'error' as const,
      timestamp: new Date().toISOString(),
      error: new Error('Test error'),
      operation: 'test-operation',
    };

    client.emit(errorEvent);

    const eventEmitter = (PcoEventEmitter as jest.Mock).mock.results[0].value;
    expect(eventEmitter.emit).toHaveBeenCalledWith(errorEvent);
  });
});
