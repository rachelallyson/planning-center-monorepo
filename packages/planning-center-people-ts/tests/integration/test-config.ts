/**
 * Shared test configuration for integration tests.
 *
 * Optional: PCO_TEST_WORKFLOW_ID — workflow ID the test user has access to (e.g. 332543).
 * Set in .env.test to avoid "You do not have access to this resource" in workflow tests.
 */
import { PcoClient, type PcoClientConfig } from '../../src';
import { updateEnvTestFile, getCurrentTokens } from './env-updater';

/**
 * Create a PcoClient with proper token refresh support for integration tests
 * 
 * This function checks for credentials in the following order:
 * 1. OAuth tokens (PCO_ACCESS_TOKEN)
 * 2. Personal Access Token (PCO_PERSONAL_ACCESS_TOKEN)
 * 3. Basic Auth (PCO_APP_ID and PCO_APP_SECRET)
 * 
 * Credentials are loaded from:
 * - Environment variables (process.env)
 * - .env.test file (loaded by setup.ts)
 */
export function createTestClient(): PcoClient {
    // Determine auth type based on available environment variables
    const hasOAuthToken = !!process.env.PCO_ACCESS_TOKEN;
    const hasPersonalAccessToken = !!process.env.PCO_PERSONAL_ACCESS_TOKEN;
    const hasAppCredentials = !!process.env.PCO_APP_ID && !!process.env.PCO_APP_SECRET;


    if (!hasPersonalAccessToken && !hasOAuthToken && !hasAppCredentials) {
        const errorMessage = [
            'No PCO credentials found. Please set one of the following in .env.test:',
            '  1. PCO_ACCESS_TOKEN (and optionally PCO_REFRESH_TOKEN) for OAuth',
            '  2. PCO_PERSONAL_ACCESS_TOKEN (and optionally PCO_PERSONAL_ACCESS_SECRET) for Personal Access Token',
            '  3. PCO_APP_ID and PCO_APP_SECRET for Basic Auth',
            '',
            'Note: Credentials are loaded from .env.test file or environment variables.'
        ].join('\n');
        throw new Error(errorMessage);
    }

    // Priority: OAuth > Personal Access Token > Basic Auth
    const config: PcoClientConfig = hasOAuthToken ? {
        auth: {
            type: 'oauth',
            accessToken: process.env.PCO_ACCESS_TOKEN!,
            refreshToken: process.env.PCO_REFRESH_TOKEN || 'test-refresh-token',
            // Include client credentials if available (for token refresh)
            clientId: process.env.PCO_APP_ID,
            clientSecret: process.env.PCO_APP_SECRET,
            onRefresh: async (newTokens) => {
                // Update the .env.test file with new tokens
                await updateEnvTestFile({
                    accessToken: newTokens.accessToken,
                    refreshToken: newTokens.refreshToken,
                });
            },
            onRefreshFailure: async () => {
                // Token refresh failed - test will fail if request needs auth
            },
        },
    } : hasPersonalAccessToken ? {
        auth: {
            type: 'personal_access_token',
            personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
            personalAccessTokenSecret: process.env.PCO_PERSONAL_ACCESS_SECRET,
        },
    } : {
        auth: {
            type: 'basic',
            appId: process.env.PCO_APP_ID!,
            appSecret: process.env.PCO_APP_SECRET!,
        },
    };

    return new PcoClient(config);
}

/**
 * Get current token status for debugging
 */
export function getTokenStatus(): {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    hasPersonalAccessToken: boolean;
    hasAppCredentials: boolean;
    tokenTypes: string[];
} {
    const hasAccessToken = !!process.env.PCO_ACCESS_TOKEN;
    const hasRefreshToken = !!process.env.PCO_REFRESH_TOKEN;
    const hasPersonalAccessToken = !!process.env.PCO_PERSONAL_ACCESS_TOKEN;
    const hasAppCredentials = !!process.env.PCO_APP_ID && !!process.env.PCO_APP_SECRET;

    const tokenTypes: string[] = [];
    if (hasAccessToken) tokenTypes.push('OAuth Access Token');
    if (hasRefreshToken) tokenTypes.push('OAuth Refresh Token');
    if (hasPersonalAccessToken) tokenTypes.push('Personal Access Token');
    if (hasAppCredentials) tokenTypes.push('Basic Auth (App ID/Secret)');

    return {
        hasAccessToken,
        hasRefreshToken,
        hasPersonalAccessToken,
        hasAppCredentials,
        tokenTypes,
    };
}

/**
 * Log current authentication status (for debugging only)
 * Note: This function is kept for potential debugging use but should not be called
 * in normal test execution as it logs functionality information.
 */
export function logAuthStatus(): void {
    const status = getTokenStatus();
    // This function intentionally left empty to avoid functionality logging
    // Uncomment below for debugging only:
    // const status = getTokenStatus();
    // console.log('DEBUG: Auth status', status);
}
