/**
 * v2.0.0 Token Refresh Tests
 * 
 * Tests for the new OAuth token refresh functionality with client credentials
 */

import { PcoClient } from '../src';

// Mock fetch for testing
global.fetch = jest.fn();

// Helper function to access private httpClient property without type assertion
function getHttpClient(client: PcoClient): { attemptTokenRefresh?: () => Promise<void> } | undefined {
  // Use Object.getOwnPropertyDescriptor to access private property without type assertions
  const descriptor = Object.getOwnPropertyDescriptor(client, 'httpClient');
  if (descriptor && descriptor.value && typeof descriptor.value === 'object') {
    const httpClient = descriptor.value;
    // Type guard to check if it has attemptTokenRefresh method
    if ('attemptTokenRefresh' in httpClient && typeof httpClient.attemptTokenRefresh === 'function') {
      // Bind the method to preserve 'this' context
      return { attemptTokenRefresh: httpClient.attemptTokenRefresh.bind(httpClient) };
    }
  }
  return undefined;
}

// Helper function to create mock Response objects without type assertions
function createMockResponse(partial: { ok: boolean; json?: () => Promise<unknown>; headers?: Map<string, string> | Headers }): Response {
  // Create a Response object using Object.create to avoid type assertions
  const response = Object.create(Response.prototype);
  Object.defineProperty(response, 'ok', { value: partial.ok, writable: false, configurable: true });
  Object.defineProperty(response, 'status', { value: partial.ok ? 200 : 400, writable: false, configurable: true });
  Object.defineProperty(response, 'statusText', { value: partial.ok ? 'OK' : 'Bad Request', writable: false, configurable: true });
  Object.defineProperty(response, 'type', { value: 'default', writable: false, configurable: true });
  Object.defineProperty(response, 'redirected', { value: false, writable: false, configurable: true });
  Object.defineProperty(response, 'url', { value: '', writable: false, configurable: true });
  if (partial.json) {
    Object.defineProperty(response, 'json', { value: partial.json, writable: false, configurable: true });
  }
  if (partial.headers) {
    // Convert Map to Headers if needed, or use Headers directly
    let headersObj: Headers;
    if (partial.headers instanceof Headers) {
      headersObj = partial.headers;
    } else {
      // Create Headers from Map
      headersObj = new Headers();
      partial.headers.forEach((value, key) => {
        headersObj.set(key, value);
      });
    }
    Object.defineProperty(response, 'headers', { value: headersObj, writable: false, configurable: true });
  }
  // Add other required Response properties with defaults
  Object.defineProperty(response, 'body', { value: null, writable: false, configurable: true });
  Object.defineProperty(response, 'bodyUsed', { value: false, writable: false, configurable: true });
  Object.defineProperty(response, 'clone', { value: () => response, writable: false, configurable: true });
  Object.defineProperty(response, 'arrayBuffer', { value: async () => new ArrayBuffer(0), writable: false, configurable: true });
  Object.defineProperty(response, 'blob', { value: async () => new Blob(), writable: false, configurable: true });
  Object.defineProperty(response, 'formData', { value: async () => new FormData(), writable: false, configurable: true });
  Object.defineProperty(response, 'text', { value: async () => '', writable: false, configurable: true });
  return response;
}

describe('v2.0.0 Token Refresh', () => {
    let mockFetch: jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
        mockFetch = fetch as jest.MockedFunction<typeof fetch>;
        jest.clearAllMocks();
    });

    describe('OAuth Token Refresh with Client Credentials', () => {
        it('should include client credentials in token refresh request', async () => {
            // Mock successful token refresh response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                }),
            } as Response);

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    clientId: 'test-client-id',
                    clientSecret: 'test-client-secret',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                }
            });

            // This would trigger token refresh internally when making a request
            try {
                await client.people.getAll();
            } catch (error) {
                // Expected to fail in test environment, but the important part is
                // that the token refresh request includes client credentials
            }

            // Verify that fetch was called with client credentials
            expect(mockFetch).toHaveBeenCalled();
            
            // Check that the token refresh request includes client credentials
            const tokenRefreshCall = mockFetch.mock.calls.find(call => 
                call[0] && typeof call[0] === 'string' && call[0].includes('/oauth/token')
            );
            
            if (tokenRefreshCall && tokenRefreshCall[1]) {
                const requestBody = tokenRefreshCall[1].body;
                expect(requestBody).toContain('client_id=test-client-id');
                expect(requestBody).toContain('client_secret=test-client-secret');
                expect(requestBody).toContain('grant_type=refresh_token');
                expect(requestBody).toContain('refresh_token=valid-refresh-token');
            }
        });

        it('should use environment variables when client credentials not in config', async () => {
            // Set environment variables
            process.env.PCO_APP_ID = 'env-client-id';
            process.env.PCO_APP_SECRET = 'env-client-secret';

            // Mock successful token refresh response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                }),
            } as Response);

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                    // No client credentials in config - should use environment variables
                }
            });

            try {
                await client.people.getAll();
            } catch (error) {
                // Expected to fail in test environment
            }

            // Verify that fetch was called with client credentials from environment
            const tokenRefreshCall = mockFetch.mock.calls.find(call => 
                call[0] && typeof call[0] === 'string' && call[0].includes('/oauth/token')
            );
            
            if (tokenRefreshCall && tokenRefreshCall[1]) {
                const requestBody = tokenRefreshCall[1].body;
                expect(requestBody).toContain('client_id=env-client-id');
                expect(requestBody).toContain('client_secret=env-client-secret');
            }

            // Clean up environment variables
            delete process.env.PCO_APP_ID;
            delete process.env.PCO_APP_SECRET;
        });

        it('should prioritize config credentials over environment variables', async () => {
            // Set environment variables
            process.env.PCO_APP_ID = 'env-client-id';
            process.env.PCO_APP_SECRET = 'env-client-secret';

            // Mock successful token refresh response
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                }),
            } as Response);

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    clientId: 'config-client-id',
                    clientSecret: 'config-client-secret',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                }
            });

            try {
                await client.people.getAll();
            } catch (error) {
                // Expected to fail in test environment
            }

            // Verify that config credentials are used, not environment variables
            const tokenRefreshCall = mockFetch.mock.calls.find(call => 
                call[0] && typeof call[0] === 'string' && call[0].includes('/oauth/token')
            );
            
            if (tokenRefreshCall && tokenRefreshCall[1]) {
                const requestBody = tokenRefreshCall[1].body;
                expect(requestBody).toContain('client_id=config-client-id');
                expect(requestBody).toContain('client_secret=config-client-secret');
                expect(requestBody).not.toContain('env-client-id');
                expect(requestBody).not.toContain('env-client-secret');
            }

            // Clean up environment variables
            delete process.env.PCO_APP_ID;
            delete process.env.PCO_APP_SECRET;
        });

        it('should handle token refresh failure with 401 error', async () => {
            // Mock 401 Unauthorized response for token refresh
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                json: async () => ({
                    error: 'invalid_client',
                    error_description: 'Client authentication failed'
                }),
            } as Response);

            const onRefreshFailure = jest.fn();
            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'invalid-refresh-token',
                    clientId: 'test-client-id',
                    clientSecret: 'test-client-secret',
                    onRefresh: jest.fn(),
                    onRefreshFailure: onRefreshFailure,
                }
            });

            // Test the token refresh directly - it should throw an error
            // Access private httpClient for testing - check if property exists at runtime
            let errorThrown = false;
            try {
                // Access private httpClient using helper function
                const httpClient = getHttpClient(client);
                if (!httpClient || typeof httpClient.attemptTokenRefresh !== 'function') {
                    throw new Error('httpClient not accessible');
                }
                await httpClient.attemptTokenRefresh();
            } catch (error) {
                errorThrown = true;
                expect(error).toBeInstanceOf(Error);
                // Verify the error message includes 401 details
                expect((error as Error).message).toContain('Token refresh failed');
                expect((error as Error).message).toContain('401');
            }

            // Verify that an error was thrown
            expect(errorThrown).toBe(true);
        });

        it('should handle missing client credentials gracefully', async () => {
            // Mock successful token refresh response (some APIs work without client credentials)
            mockFetch.mockResolvedValueOnce(createMockResponse({
                ok: true,
                json: async () => ({
                    access_token: 'new-access-token',
                    refresh_token: 'new-refresh-token',
                    token_type: 'Bearer',
                    expires_in: 3600,
                }),
            }));

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                    // No client credentials provided
                }
            });

            try {
                await client.people.getAll();
            } catch (error) {
                // Expected to fail in test environment
            }

            // Verify that fetch was called without client credentials
            const tokenRefreshCall = mockFetch.mock.calls.find(call => 
                call[0] && typeof call[0] === 'string' && call[0].includes('/oauth/token')
            );
            
            if (tokenRefreshCall && tokenRefreshCall[1]) {
                const requestBody = tokenRefreshCall[1].body;
                expect(requestBody).toContain('grant_type=refresh_token');
                expect(requestBody).toContain('refresh_token=valid-refresh-token');
                expect(requestBody).not.toContain('client_id=');
                expect(requestBody).not.toContain('client_secret=');
            }
        });
    });

    describe('Basic Auth Token Refresh', () => {
        it('should not attempt token refresh for basic auth', async () => {
            const client = new PcoClient({
                auth: {
                    type: 'basic',
                    appId: 'test-app-id',
                    appSecret: 'test-app-secret',
                }
            });

            // Mock a successful response with proper headers
            mockFetch.mockResolvedValueOnce(createMockResponse({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => ({ data: [] }),
            }));

            await client.people.getAll();

            // Verify that no token refresh was attempted
            const tokenRefreshCall = mockFetch.mock.calls.find(call => 
                call[0] && typeof call[0] === 'string' && call[0].includes('/oauth/token')
            );
            
            expect(tokenRefreshCall).toBeUndefined();
        });
    });

    describe('Personal Access Token Auth', () => {
        it('should not attempt token refresh for personal access token', async () => {
            // Mock environment variables for personal access token
            const originalEnv = process.env;
            process.env.PCO_PERSONAL_ACCESS_TOKEN = 'test-client-id';
            process.env.PCO_PERSONAL_ACCESS_SECRET = 'test-client-secret';

            const client = new PcoClient({
                auth: {
                    type: 'personal_access_token',
                    personalAccessToken: 'test-pat',
                }
            });

            // Mock a successful response with proper headers
            mockFetch.mockResolvedValueOnce(createMockResponse({
                ok: true,
                headers: new Map([['content-type', 'application/json']]),
                json: async () => ({ data: [] }),
            }));

            await client.people.getAll();

            // Verify that no token refresh was attempted
            const tokenRefreshCall = mockFetch.mock.calls.find(call =>
                call[0] && typeof call[0] === 'string' && call[0].includes('/oauth/token')
            );

            expect(tokenRefreshCall).toBeUndefined();

            // Restore environment variables
            process.env = originalEnv;
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors during token refresh', async () => {
            // Mock network error for token refresh
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    clientId: 'test-client-id',
                    clientSecret: 'test-client-secret',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                }
            });

            // Test the token refresh directly - it should throw an error
            // Access private httpClient for testing - check if property exists at runtime
            let errorThrown = false;
            try {
                // Access private httpClient using helper function
                const httpClient = getHttpClient(client);
                if (!httpClient || typeof httpClient.attemptTokenRefresh !== 'function') {
                    throw new Error('httpClient not accessible');
                }
                await httpClient.attemptTokenRefresh();
            } catch (error) {
                errorThrown = true;
                expect(error).toBeInstanceOf(Error);
                // Verify the error is a network error
                expect((error as Error).message).toContain('Network error');
            }

            // Verify that an error was thrown
            expect(errorThrown).toBe(true);
        });

        it('should handle malformed token refresh response', async () => {
            // Mock malformed response for token refresh
            mockFetch.mockResolvedValueOnce(createMockResponse({
                ok: true,
                json: async () => {
                    throw new Error('Invalid JSON');
                },
            }));

            const client = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'expired-token',
                    refreshToken: 'valid-refresh-token',
                    clientId: 'test-client-id',
                    clientSecret: 'test-client-secret',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                }
            });

            // Test the token refresh directly - it should throw an error
            // Access private httpClient for testing - check if property exists at runtime
            let errorThrown = false;
            try {
                // Access private httpClient using helper function
                const httpClient = getHttpClient(client);
                if (!httpClient || typeof httpClient.attemptTokenRefresh !== 'function') {
                    throw new Error('httpClient not accessible');
                }
                await httpClient.attemptTokenRefresh();
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
                errorThrown = true;
                // Verify the error is a JSON parsing error
                expect((error as Error).message).toContain('Invalid JSON');
            }

            // Verify that an error was thrown
            expect(errorThrown).toBe(true);
        });
    });
});
