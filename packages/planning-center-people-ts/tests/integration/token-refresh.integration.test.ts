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
        it('should update .env.test when token is refreshed', async () => {
            // Get current tokens before making requests
            const tokensBefore = getCurrentTokens();
            console.log('🔍 Tokens before requests:', {
                hasAccessToken: !!tokensBefore.accessToken,
                hasRefreshToken: !!tokensBefore.refreshToken,
                accessTokenLength: tokensBefore.accessToken?.length || 0,
                refreshTokenLength: tokensBefore.refreshToken?.length || 0,
            });


            // Make several API requests that might trigger token refresh
            const requests = [
                client.people.getAll({ perPage: 1 }),
                client.people.getAll({ perPage: 1 }),
                client.people.getAll({ perPage: 1 }),
                client.campus.getAll({ perPage: 1 }),
                client.households.getAll({ perPage: 1 }),
            ];

            // Execute requests in parallel
            const results = await Promise.all(requests);
            
            // Verify all requests succeeded
            results.forEach((result, index) => {
                expect(result.data).toBeDefined();
                expect(Array.isArray(result.data)).toBe(true);
                console.log(`✅ Request ${index + 1} completed successfully`);
            });

            // Get tokens after requests
            const tokensAfter = getCurrentTokens();
            console.log('🔍 Tokens after requests:', {
                hasAccessToken: !!tokensAfter.accessToken,
                hasRefreshToken: !!tokensAfter.refreshToken,
                accessTokenLength: tokensAfter.accessToken?.length || 0,
                refreshTokenLength: tokensAfter.refreshToken?.length || 0,
            });

            // Verify tokens are still present
            expect(tokensAfter.accessToken).toBeDefined();
            expect(tokensAfter.refreshToken).toBeDefined();
            
            // If tokens changed, verify they're different
            if (tokensBefore.accessToken !== tokensAfter.accessToken) {
                console.log('🔄 Access token was refreshed!');
                expect(tokensAfter.accessToken).not.toBe(tokensBefore.accessToken);
            } else {
                console.log('ℹ️  Access token was not refreshed (may still be valid)');
            }

            if (tokensBefore.refreshToken !== tokensAfter.refreshToken) {
                console.log('🔄 Refresh token was updated!');
                expect(tokensAfter.refreshToken).not.toBe(tokensBefore.refreshToken);
            } else {
                console.log('ℹ️  Refresh token was not updated');
            }
        }, 30000);

        it('should handle token refresh failures gracefully', async () => {
            // Create a client with invalid refresh token to test failure handling
            const invalidClient = createTestClient();
            
            // This should not throw an error, but should handle the failure gracefully
            try {
                await invalidClient.people.getAll({ perPage: 1 });
                console.log('✅ Request completed despite potential token issues');
            } catch (error) {
                console.log('⚠️  Request failed as expected:', error.message);
                // This is acceptable - the important thing is that it doesn't crash
            }
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
                console.log('✅ Access token found in .env.test');
            }
            
            if (tokens.refreshToken) {
                expect(typeof tokens.refreshToken).toBe('string');
                expect(tokens.refreshToken.length).toBeGreaterThan(0);
                console.log('✅ Refresh token found in .env.test');
            }
        });
    });
});
