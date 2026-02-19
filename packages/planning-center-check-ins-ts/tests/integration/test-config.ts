/**
 * Shared test configuration for Check-ins API integration tests
 */
import { PcoCheckInsClient, type PcoCheckInsClientConfig } from '../../src';
import { updateEnvTestFile } from './env-updater';

function buildPatConfig(): PcoCheckInsClientConfig {
    return {
        auth: {
            type: 'personal_access_token',
            personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
            ...(process.env.PCO_PERSONAL_ACCESS_SECRET && {
                personalAccessTokenSecret: process.env.PCO_PERSONAL_ACCESS_SECRET,
            }),
        },
    };
}

function buildOAuthConfig(): PcoCheckInsClientConfig {
    return {
        auth: {
            type: 'oauth',
            accessToken: process.env.PCO_ACCESS_TOKEN!,
            refreshToken: process.env.PCO_REFRESH_TOKEN ?? '',
            onRefresh: async (newTokens) => {
                await updateEnvTestFile({
                    accessToken: newTokens.accessToken,
                    refreshToken: newTokens.refreshToken,
                });
            },
            onRefreshFailure: async () => {
                // Token refresh failed; tests will fail on next authenticated request.
            },
        },
    };
}

/**
 * Create a PcoCheckInsClient with proper token refresh support for integration tests
 */
export function createTestClient(): PcoCheckInsClient {
    const hasOAuthToken = !!process.env.PCO_ACCESS_TOKEN;
    const hasPersonalAccessToken = !!process.env.PCO_PERSONAL_ACCESS_TOKEN;

    if (!hasPersonalAccessToken && !hasOAuthToken) {
        throw new Error('Either PCO_PERSONAL_ACCESS_TOKEN or PCO_ACCESS_TOKEN must be set');
    }

    const config = hasPersonalAccessToken ? buildPatConfig() : hasOAuthToken ? buildOAuthConfig() : buildPatConfig();
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

function isErrorWithStatus(o: object): o is { status: number } {
    const desc = Object.getOwnPropertyDescriptor(o, 'status');
    const status = desc?.value;
    return typeof status === 'number';
}

/** Check if error object has status 404. */
function is404Error(err: object): boolean {
    return isErrorWithStatus(err) && err.status === 404;
}

/**
 * Check if the Pre-checks API is available (not 404).
 * Pre-checks can return 404 when the Church Center PreCheck feature is not enabled for the org.
 */
export async function isPreChecksApiAvailable(client: PcoCheckInsClient): Promise<boolean> {
    try {
        await client.preChecks.getPage({ per_page: 1, page: 1 });
        return true;
    } catch (err) {
        if (err !== null && typeof err === 'object' && is404Error(err)) return false;
        throw err;
    }
}

/**
 * Log current authentication status (no-op; logs are for debugging only per test standards).
 */
export function logAuthStatus(): void {
    // getTokenStatus() available for debugging if needed
}
