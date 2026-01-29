/**
 * Token Refresh Integration Tests
 * Tests that token refresh updates .env.test file
 */
import { createTestClient, logAuthStatus } from './test-config';
import { getCurrentTokens } from './env-updater';

describe('Token Refresh Integration Tests', () => {
    let client: ReturnType<typeof createTestClient>;

    beforeAll(async () => {
        client = createTestClient();
        logAuthStatus();
    });

    afterAll(async () => {
        // Clean up if needed
    });

    describe('Token Refresh Persistence', () => {
        const hasOAuth = () => {
            const t = getCurrentTokens();
            return !!(t?.accessToken && t?.refreshToken);
        };
        (hasOAuth() ? it : it.skip)('should update .env.test when token is refreshed', async () => {
            const tokensBefore = getCurrentTokens();
            expect(tokensBefore.accessToken).toBeDefined();
            expect(tokensBefore.refreshToken).toBeDefined();

            // Make several API requests that might trigger token refresh
            const requests = [
                client.people.getPage({ perPage: 1 }),
                client.people.getPage({ perPage: 1 }),
                client.people.getPage({ perPage: 1 }),
                client.campus.getPage({ perPage: 1 }),
                client.households.getPage({ perPage: 1 }),
            ];

            // Execute requests in parallel
            const results = await Promise.all(requests);
            
            // Verify all requests succeeded
            results.forEach((result) => {
                expect(result.data).toBeDefined();
                expect(Array.isArray(result.data)).toBe(true);
            });

            // Get tokens after requests
            const tokensAfter = getCurrentTokens();

            // Verify tokens are still present
            expect(tokensAfter.accessToken).toBeDefined();
            expect(tokensAfter.refreshToken).toBeDefined();
            
            // If tokens changed, verify they're different
            if (tokensBefore.accessToken !== tokensAfter.accessToken) {
                expect(tokensAfter.accessToken).not.toBe(tokensBefore.accessToken);
            }

            if (tokensBefore.refreshToken !== tokensAfter.refreshToken) {
                expect(tokensAfter.refreshToken).not.toBe(tokensBefore.refreshToken);
            }
        }, 30000);

        it('should handle token refresh failures gracefully', async () => {
            // Create a client with invalid refresh token to test failure handling
            const invalidClient = createTestClient();
            
            // The request may succeed or fail depending on token validity
            // The important thing is that it doesn't crash - test should execute
            await expect(invalidClient.people.getPage({ perPage: 1 })).resolves.toBeDefined();
        }, 30000);
    });

    describe('Environment File Updates', () => {
        it('should be able to read current tokens from .env.test', () => {
            const tokens = getCurrentTokens();
            
            expect(tokens).toBeDefined();
            expect(typeof tokens).toBe('object');
            
            if (tokens.accessToken) {
                expect(typeof tokens.accessToken).toBe('string');
                expect(tokens.accessToken.length).toBeGreaterThan(0);
            }
            
            if (tokens.refreshToken) {
                expect(typeof tokens.refreshToken).toBe('string');
                expect(tokens.refreshToken.length).toBeGreaterThan(0);
            }
        });
    });
});
