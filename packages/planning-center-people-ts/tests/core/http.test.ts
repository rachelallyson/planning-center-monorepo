import { PcoHttpClient } from '../../src/core/http';
import type { PcoClientConfig, OAuthAuth, PersonalAccessTokenAuth, BasicAuth } from '../../src/types/client';
import { PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

// Mock the base package modules
jest.mock('@rachelallyson/planning-center-base-ts', () => ({
  PcoEventEmitter: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
  })),
  RequestIdGenerator: jest.fn().mockImplementation(() => ({
    generate: jest.fn().mockReturnValue('test-request-id'),
  })),
  PerformanceMetrics: jest.fn().mockImplementation(() => ({
    record: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({}),
  })),
  RateLimitTracker: jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    getAllLimits: jest.fn().mockReturnValue({}),
  })),
  PcoRateLimiter: jest.fn().mockImplementation(() => ({
    waitForAvailability: jest.fn().mockResolvedValue(undefined),
    updateFromHeaders: jest.fn(),
    recordRequest: jest.fn(),
  })),
  PcoApiError: {
    fromFetchError: jest.fn().mockImplementation((response, data) => {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).response = response;
      (error as any).data = data;
      return error;
    }),
  },
}));

// Mock the auth module
jest.mock('../../src/auth', () => ({
  attemptTokenRefresh: jest.fn(),
  hasRefreshTokenCapability: jest.fn().mockReturnValue(true),
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Headers
global.Headers = class Headers {
  private headers = new Map<string, string>();
  
  constructor(init?: HeadersInit) {
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.headers.set(key, value));
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.headers.set(key, value));
      }
    }
  }
  
  get(name: string): string | null {
    return this.headers.get(name) || null;
  }
  
  set(name: string, value: string): void {
    this.headers.set(name, value);
  }
  
  has(name: string): boolean {
    return this.headers.has(name);
  }
  
  delete(name: string): void {
    this.headers.delete(name);
  }
  
  forEach(callback: (value: string, key: string) => void): void {
    this.headers.forEach(callback);
  }
  
  [Symbol.iterator]() {
    return this.headers[Symbol.iterator]();
  }
} as any;

// Mock Response
global.Response = class Response {
  public ok: boolean;
  public status: number;
  public statusText: string;
  public headers: Headers;
  private _body: any;
  
  constructor(body: any, init: ResponseInit = {}) {
    this.ok = init.status ? init.status >= 200 && init.status < 300 : true;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Headers(init.headers || {});
    this._body = body;
  }
  
  async json(): Promise<any> {
    // If body is already an object, return it; otherwise parse JSON string
    if (typeof this._body === 'string') {
      return JSON.parse(this._body);
    }
    return this._body;
  }
  
  async text(): Promise<string> {
    if (typeof this._body === 'string') {
      return this._body;
    }
    return JSON.stringify(this._body);
  }
} as any;

describe('PcoHttpClient', () => {
  let httpClient: PcoHttpClient;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;
  let config: PcoClientConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEventEmitter = {
      emit: jest.fn(),
    } as any;
    
    config = {
      auth: { type: 'oauth', accessToken: 'test-token' },
      baseURL: 'https://api.planningcenteronline.com/people/v2',
    };
    
    httpClient = new PcoHttpClient(config, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with config and event emitter', () => {
      expect(httpClient).toBeInstanceOf(PcoHttpClient);
    });
  });

  describe('request', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'person', attributes: { name: 'John Doe' } }],
        meta: { total_count: 1 },
        links: {},
      };
      
      mockFetch.mockResolvedValueOnce(new Response(mockResponse, {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
        },
      }));

      const result = await httpClient.request({
        method: 'GET',
        endpoint: '/people',
      });

      expect(result).toEqual({
        data: mockResponse,
        status: 200,
        headers: expect.any(Object),
        requestId: 'test-request-id',
        duration: 0,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.planningcenteronline.com/people/v2/people',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token',
          }),
        })
      );
    });

    it('should make a POST request with JSON:API format', async () => {
      const mockResponse = {
        data: { id: '1', type: 'person', attributes: { name: 'John Doe' } },
      };
      
      mockFetch.mockResolvedValueOnce(new Response(mockResponse, {
        status: 201,
        statusText: 'Created',
      }));

      const personData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      await httpClient.request({
        method: 'POST',
        endpoint: '/people',
        data: personData,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.planningcenteronline.com/people/v2/people',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            data: {
              type: 'People',
              attributes: personData,
            },
          }),
        })
      );
    });

    it('should handle query parameters', async () => {
      const mockResponse = { data: [] };
      
      mockFetch.mockResolvedValueOnce(new Response(mockResponse));

      await httpClient.request({
        method: 'GET',
        endpoint: '/people',
        params: {
          per_page: 50,
          include: 'households',
          filter: 'name',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.planningcenteronline.com/people/v2/people?per_page=50&include=households&filter=name',
        expect.any(Object)
      );
    });

    it('should handle custom headers', async () => {
      const mockResponse = { data: [] };
      
      mockFetch.mockResolvedValueOnce(new Response(mockResponse));

      await httpClient.request({
        method: 'GET',
        endpoint: '/people',
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });

    it('should handle DELETE requests', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, {
        status: 204,
        statusText: 'No Content',
      }));

      const result = await httpClient.request({
        method: 'DELETE',
        endpoint: '/people/1',
      });

      expect(result.data).toBeUndefined();
      expect(result.status).toBe(204);
    });

    it('should handle 429 rate limit responses with retry', async () => {
      const mockResponse = { data: [] };
      
      // First call returns 429, second call succeeds
      mockFetch
        .mockResolvedValueOnce(new Response({ error: 'Rate limited' }, {
          status: 429,
          statusText: 'Too Many Requests',
          headers: {
            'retry-after': '1',
          },
        }))
        .mockResolvedValueOnce(new Response(mockResponse, {
          status: 200,
          statusText: 'OK',
        }));

      const result = await httpClient.request({
        method: 'GET',
        endpoint: '/people',
      });

      expect(result.data).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max retries for 429', async () => {
      // Mock 6 consecutive 429 responses (exceeds retry limit of 5)
      for (let i = 0; i < 6; i++) {
        mockFetch.mockResolvedValueOnce(new Response({ error: 'Rate limited' }, {
          status: 429,
          statusText: 'Too Many Requests',
          headers: {
            'retry-after': '0',
          },
        }));
      }

      await expect(httpClient.request({
        method: 'GET',
        endpoint: '/people',
      })).rejects.toThrow('Rate limit exceeded after 5 retries');
    });

    it('should handle 401 with token refresh for OAuth', async () => {
      const mockResponse = { data: [] };
      const onRefresh = jest.fn();
      const onRefreshFailure = jest.fn();
      
      // Create OAuth config with refresh token and callbacks
      const oauthConfig: PcoClientConfig = {
        auth: { 
          type: 'oauth', 
          accessToken: 'expired-token',
          refreshToken: 'valid-refresh-token',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          onRefresh,
          onRefreshFailure
        },
        baseURL: 'https://api.planningcenteronline.com/people/v2',
      };
      
      const oauthClient = new PcoHttpClient(oauthConfig, mockEventEmitter);
      
      // Sequence:
      // 1. First call to /people returns 401
      // 2. Token refresh call to /oauth/token succeeds
      // 3. Second call to /people succeeds
      mockFetch
        .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          statusText: 'Unauthorized',
          headers: new Headers({ 'content-type': 'application/json' }),
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }), {
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
        }))
        .mockResolvedValueOnce(new Response(JSON.stringify(mockResponse), {
          status: 200,
          statusText: 'OK',
          headers: new Headers({ 'content-type': 'application/json' }),
        }));

      const result = await oauthClient.request({
        method: 'GET',
        endpoint: '/people',
      });

      expect(result.data).toEqual(mockResponse);
      expect(onRefresh).toHaveBeenCalledWith({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(mockFetch).toHaveBeenCalledTimes(3);
      // Verify the second call uses the new token
      const lastCall = mockFetch.mock.calls[2];
      expect(lastCall[0]).toContain('/people');
    });

    it('should handle other HTTP errors', async () => {
      const errorData = { errors: [{ title: 'Not Found', detail: 'Resource not found' }] };
      
      mockFetch.mockResolvedValueOnce(new Response(errorData, {
        status: 404,
        statusText: 'Not Found',
      }));

      await expect(httpClient.request({
        method: 'GET',
        endpoint: '/people/999',
      })).rejects.toThrow();
    });

    it('should emit request events', async () => {
      const mockResponse = { data: [] };
      
      mockFetch.mockResolvedValueOnce(new Response(mockResponse));

      await httpClient.request({
        method: 'GET',
        endpoint: '/people',
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith({
        type: 'request:start',
        endpoint: '/people',
        method: 'GET',
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith({
        type: 'request:complete',
        endpoint: '/people',
        method: 'GET',
        status: 200,
        duration: expect.any(Number),
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
    });

    it('should emit error events on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(httpClient.request({
        method: 'GET',
        endpoint: '/people',
      })).rejects.toThrow('Network error');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith({
        type: 'request:error',
        endpoint: '/people',
        method: 'GET',
        error: expect.any(Error),
        requestId: 'test-request-id',
        timestamp: expect.any(String),
      });
    });
  });

  describe('authentication', () => {
    it('should use Bearer token for OAuth', async () => {
      const oauthConfig: PcoClientConfig = {
        auth: { type: 'oauth', accessToken: 'oauth-token' },
        baseURL: 'https://api.planningcenteronline.com/people/v2',
      };
      
      const oauthClient = new PcoHttpClient(oauthConfig, mockEventEmitter);
      mockFetch.mockResolvedValueOnce(new Response({ data: [] }));

      await oauthClient.request({
        method: 'GET',
        endpoint: '/people',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer oauth-token',
          }),
        })
      );
    });

    it('should use Basic auth for personal access token', async () => {
      const patConfig: PcoClientConfig = {
        auth: { type: 'personal_access_token', personalAccessToken: 'app-id:app-secret' },
        baseURL: 'https://api.planningcenteronline.com/people/v2',
      };
      
      const patClient = new PcoHttpClient(patConfig, mockEventEmitter);
      mockFetch.mockResolvedValueOnce(new Response({ data: [] }));

      await patClient.request({
        method: 'GET',
        endpoint: '/people',
      });

      const expectedAuth = `Basic ${Buffer.from('app-id:app-secret').toString('base64')}`;
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expectedAuth,
          }),
        })
      );
    });

    it('should use Basic auth for basic authentication', async () => {
      const basicConfig: PcoClientConfig = {
        auth: { type: 'basic', appId: 'app-id', appSecret: 'app-secret' },
        baseURL: 'https://api.planningcenteronline.com/people/v2',
      };
      
      const basicClient = new PcoHttpClient(basicConfig, mockEventEmitter);
      mockFetch.mockResolvedValueOnce(new Response({ data: [] }));

      await basicClient.request({
        method: 'GET',
        endpoint: '/people',
      });

      const expectedAuth = `Basic ${Buffer.from('app-id:app-secret').toString('base64')}`;
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expectedAuth,
          }),
        })
      );
    });
  });

  describe('getResourceTypeFromEndpoint', () => {
    it('should convert endpoint to resource type', async () => {
      // This tests the private method indirectly through POST requests
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ data: {} })));

      await httpClient.request({
        method: 'POST',
        endpoint: '/people',
        data: { name: 'Test' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"type":"People"'),
        })
      );
    });

    it('should handle kebab-case endpoints', async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ data: {} })));

      await httpClient.request({
        method: 'POST',
        endpoint: '/phone-numbers',
        data: { number: '123-456-7890' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"type":"PhoneNumber"'),
        })
      );
    });
  });

  describe('utility methods', () => {
    it('should return performance metrics', () => {
      const metrics = httpClient.getPerformanceMetrics();
      expect(metrics).toEqual({});
    });

    it('should return rate limit info', () => {
      const rateLimitInfo = httpClient.getRateLimitInfo();
      expect(rateLimitInfo).toEqual({});
    });

    it('should return auth header for external services', () => {
      const authHeader = httpClient.getAuthHeader();
      expect(authHeader).toBe('Bearer test-token');
    });

    it('should return Basic auth header for PAT', () => {
      const patConfig: PcoClientConfig = {
        auth: { type: 'personal_access_token', personalAccessToken: 'app-id:app-secret' },
        baseURL: 'https://api.planningcenteronline.com/people/v2',
      };
      
      const patClient = new PcoHttpClient(patConfig, mockEventEmitter);
      const authHeader = patClient.getAuthHeader();
      const expectedAuth = `Basic ${Buffer.from('app-id:app-secret').toString('base64')}`;
      expect(authHeader).toBe(expectedAuth);
    });
  });
});
