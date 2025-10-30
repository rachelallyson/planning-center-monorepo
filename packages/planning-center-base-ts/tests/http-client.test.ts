/**
 * Tests for PcoHttpClient (base package)
 */

import { PcoHttpClient } from '../src/http-client';
import { PcoEventEmitter } from '../src/monitoring';
import { PcoApiError } from '../src/errors/api-error';
import type { PcoClientConfig } from '../src/types/config';

// Mock fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('PcoHttpClient', () => {
  let httpClient: PcoHttpClient;
  let eventEmitter: PcoEventEmitter;
  let config: PcoClientConfig;

  beforeEach(() => {
    eventEmitter = new PcoEventEmitter();
    config = {
      auth: {
        type: 'oauth',
        accessToken: 'test-token',
      },
      baseURL: 'https://api.planningcenteronline.com/test/v2',
    };
    httpClient = new PcoHttpClient(config, eventEmitter);
    jest.clearAllMocks();
  });

  describe('request', () => {
    it('should make GET request successfully', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Resource' },
        links: { self: '/resources/1' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([
          ['content-type', 'application/json'],
          ['x-pco-api-request-rate-limit', '100'],
          ['x-pco-api-request-rate-count', '50'],
        ]),
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

      const result = await httpClient.request({
        method: 'GET',
        endpoint: '/resources/1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.planningcenteronline.com/test/v2/resources/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.status).toBe(200);
      expect(result.requestId).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle query parameters', async () => {
      const mockResponse = { data: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

      await httpClient.request({
        method: 'GET',
        endpoint: '/resources',
        params: { include: 'related', per_page: 10 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('include=related'),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('per_page=10'),
        expect.any(Object)
      );
    });

    it('should handle POST request with data', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Resource', attributes: { name: 'Test' } },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

      const result = await httpClient.request({
        method: 'POST',
        endpoint: '/resources',
        data: { name: 'Test' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test'),
        })
      );

      expect(result.status).toBe(201);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle PATCH request', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Resource', attributes: { name: 'Updated' } },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

      await httpClient.request({
        method: 'PATCH',
        endpoint: '/resources/1',
        data: { name: 'Updated' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });

    it('should handle DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: new Map(),
      } as unknown as Response);

      await httpClient.request({
        method: 'DELETE',
        endpoint: '/resources/1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle absolute URLs', async () => {
      const mockResponse = { data: { id: '1' } };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

      await httpClient.request({
        method: 'GET',
        endpoint: 'https://api.example.com/resources/1',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/resources/1',
        expect.any(Object)
      );
    });

    it('should update rate limiter from response headers', async () => {
      const updateSpy = jest.spyOn(httpClient['rateLimiter'], 'updateFromHeaders');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([
          ['x-pco-api-request-rate-limit', '100'],
          ['x-pco-api-request-rate-count', '50'],
          ['x-pco-api-request-rate-period', '20'],
        ]),
        json: () => Promise.resolve({ data: [] }),
      } as unknown as Response);

      await httpClient.request({
        method: 'GET',
        endpoint: '/resources',
      });

      expect(updateSpy).toHaveBeenCalledWith({
        'X-PCO-API-Request-Rate-Limit': '100',
        'X-PCO-API-Request-Rate-Count': '50',
        'X-PCO-API-Request-Rate-Period': '20',
      });
    });
  });

  describe('error handling', () => {
    it('should throw PcoApiError on API error response', async () => {
      const mockErrorResponse = {
        errors: [{ detail: 'Resource not found', status: '404' }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockErrorResponse),
      } as unknown as Response);

      await expect(
        httpClient.request({
          method: 'GET',
          endpoint: '/resources/999',
        })
      ).rejects.toThrow(PcoApiError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        httpClient.request({
          method: 'GET',
          endpoint: '/resources',
        })
      ).rejects.toThrow();
    });

    it('should handle timeout', async () => {
      const clientWithTimeout = new PcoHttpClient(
        { ...config, timeout: 1000 },
        eventEmitter
      );

      // Mock AbortController
      const mockAbortController = {
        abort: jest.fn(),
        signal: {},
      };
      global.AbortController = jest.fn(() => mockAbortController) as any;

      mockFetch.mockImplementationOnce(() =>
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100);
        })
      );

      await expect(
        clientWithTimeout.request({
          method: 'GET',
          endpoint: '/resources',
        })
      ).rejects.toThrow();
    });
  });

  describe('authentication', () => {
    it('should use Bearer token for OAuth', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ data: [] }),
      } as unknown as Response);

      await httpClient.request({
        method: 'GET',
        endpoint: '/resources',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should use Basic auth for personal access token', async () => {
      const patConfig: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'app-id:app-secret',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };
      const patClient = new PcoHttpClient(patConfig, eventEmitter);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ data: [] }),
      } as unknown as Response);

      await patClient.request({
        method: 'GET',
        endpoint: '/resources',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringMatching(/^Basic /),
          }),
        })
      );
    });
  });

  describe('event emission', () => {
    it('should emit request:start event', async () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ data: [] }),
      } as unknown as Response);

      await httpClient.request({
        method: 'GET',
        endpoint: '/resources',
      });

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'request:start',
          endpoint: '/resources',
          method: 'GET',
        })
      );
    });

    it('should emit request:complete event on success', async () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ data: [] }),
      } as unknown as Response);

      await httpClient.request({
        method: 'GET',
        endpoint: '/resources',
      });

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'request:complete',
          status: 200,
        })
      );
    });

    it('should emit request:error event on failure', async () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        httpClient.request({
          method: 'GET',
          endpoint: '/resources',
        })
      ).rejects.toThrow();

      expect(emitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'request:error',
          error: expect.any(Error),
        })
      );
    });
  });
});

