/**
 * Shared test configuration for Check-ins API integration tests
 */
import { PcoCheckInsClient, type PcoCheckInsClientConfig } from '../../src';
import { updateEnvTestFile, getCurrentTokens } from './env-updater';

/**
 * Create a PcoCheckInsClient with proper token refresh support for integration tests
 */
export function createTestClient(): PcoCheckInsClient {
    // Determine auth type based on available environment variables
    // Prioritize Personal Access Token for Check-ins API due to OAuth scope issues
    const hasOAuthToken = !!process.env.PCO_ACCESS_TOKEN;
    const hasPersonalAccessToken = !!process.env.PCO_PERSONAL_ACCESS_TOKEN;

    if (!hasPersonalAccessToken && !hasOAuthToken) {
        throw new Error('Either PCO_PERSONAL_ACCESS_TOKEN or PCO_ACCESS_TOKEN must be set');
    }

    const config: PcoCheckInsClientConfig = hasPersonalAccessToken ? {
        auth: {
            type: 'personal_access_token',
            personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
        },
    } : hasOAuthToken ? {
        auth: {
            type: 'oauth',
            accessToken: process.env.PCO_ACCESS_TOKEN!,
            refreshToken: process.env.PCO_REFRESH_TOKEN,
            onRefresh: async (newTokens) => {
                console.log('🔄 Token refreshed successfully');
                console.log('📝 Updating .env.test with new tokens...');

                // Update the .env.test file with new tokens
                await updateEnvTestFile({
                    accessToken: newTokens.accessToken,
                    refreshToken: newTokens.refreshToken,
                });

                console.log('✅ .env.test updated with new tokens');
            },
            onRefreshFailure: async (error) => {
                console.error('❌ Token refresh failed:', error.message);
                console.error('💡 You may need to re-authenticate or check your refresh token');
            },
        },
    } : {
        auth: {
            type: 'personal_access_token',
            personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
        },
    };

    return new PcoCheckInsClient(config);
}

/**
 * Get current token status for debugging
 */
export function getTokenStatus(): {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    hasPersonalAccessToken: boolean;
    tokenTypes: string[];
} {
    const hasAccessToken = !!process.env.PCO_ACCESS_TOKEN;
    const hasRefreshToken = !!process.env.PCO_REFRESH_TOKEN;
    const hasPersonalAccessToken = !!process.env.PCO_PERSONAL_ACCESS_TOKEN;

    const tokenTypes: string[] = [];
    if (hasAccessToken) tokenTypes.push('OAuth Access Token');
    if (hasRefreshToken) tokenTypes.push('OAuth Refresh Token');
    if (hasPersonalAccessToken) tokenTypes.push('Personal Access Token');

    return {
        hasAccessToken,
        hasRefreshToken,
        hasPersonalAccessToken,
        tokenTypes,
    };
}

/**
 * Log current authentication status
 */
export function logAuthStatus(): void {
    const status = getTokenStatus();
    console.log('🔐 Authentication Status:');
    console.log(`   Available tokens: ${status.tokenTypes.join(', ')}`);
    console.log(`   Using: ${status.hasPersonalAccessToken ? 'Personal Access Token' : 'OAuth'}`);

    if (status.hasAccessToken && !status.hasRefreshToken) {
        console.warn('⚠️  OAuth access token found but no refresh token - tokens will expire after 2 hours');
    }

    if (status.hasPersonalAccessToken) {
        console.log('✅ Personal Access Token authentication enabled');
    } else if (status.hasAccessToken && status.hasRefreshToken) {
        console.log('✅ OAuth with refresh token support enabled');
    }
}
