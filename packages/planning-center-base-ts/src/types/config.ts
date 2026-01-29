/**
 * v2.0.0 Client Configuration Types
 */

/** Authentication configuration for Personal Access Token */
export interface PersonalAccessTokenAuth {
    type: 'personal_access_token';
    /** Client ID from Planning Center */
    personalAccessToken: string;
    /** Client Secret from Planning Center (optional, can use PCO_PERSONAL_ACCESS_SECRET env var) */
    personalAccessTokenSecret?: string;
}

/** Authentication configuration for OAuth 2.0 with required refresh handling */
export interface OAuthAuth {
    type: 'oauth';
    accessToken: string;
    refreshToken: string;
    onRefresh: (tokens: { accessToken: string; refreshToken: string }) => void | Promise<void>;
    onRefreshFailure: (error: Error) => void | Promise<void>;
    /** Client ID for token refresh (optional, can use environment variable PCO_APP_ID) */
    clientId?: string;
    /** Client Secret for token refresh (optional, can use environment variable PCO_APP_SECRET) */
    clientSecret?: string;
}

/** Authentication configuration for Basic Auth with app credentials */
export interface BasicAuth {
    type: 'basic';
    appId: string;
    appSecret: string;
}

/** Union type for authentication configurations */
export type PcoAuthConfig = PersonalAccessTokenAuth | OAuthAuth | BasicAuth;

export interface PcoClientConfig {
    /** Authentication configuration */
    auth: PcoAuthConfig;

    /** Caching configuration */
    caching?: {
        fieldDefinitions?: boolean;
        ttl?: number; // Time to live in milliseconds
        maxSize?: number; // Maximum cache size
    };

    /** Retry configuration */
    retry?: {
        enabled?: boolean;
        maxRetries?: number;
        baseDelay?: number;
        maxDelay?: number;
        backoff?: 'linear' | 'exponential';
    };

    /** Event handlers */
    events?: {
        onError?: (event: ErrorEvent) => void | Promise<void>;
        onAuthFailure?: (event: AuthFailureEvent) => void | Promise<void>;
        onRequestStart?: (event: RequestStartEvent) => void | Promise<void>;
        onRequestComplete?: (event: RequestCompleteEvent) => void | Promise<void>;
        onRateLimit?: (event: RateLimitEvent) => void | Promise<void>;
    };

    /** Base URL override */
    baseURL?: string;

    /** Request timeout in milliseconds */
    timeout?: number;

    /** Custom headers */
    headers?: Record<string, string>;

    /**
     * Enable debug logging for all events (requests, auth, rate limit, cache, errors).
     * Can be toggled at runtime via client updateConfig. Shared across all PCO packages.
     */
    debug?: boolean | PcoDebugOptions;
}

/**
 * Options for the built-in debug logger.
 * When debug is enabled, the client subscribes to all internal events and logs them.
 */
export interface PcoDebugOptions {
    /** Prefix for every log line (default: "[PCO]") */
    prefix?: string;
    /** Include request/response payloads in logs (default: false to avoid sensitive data) */
    includePayloads?: boolean;
    /** Custom log sink; if not set, uses console.log */
    onLog?: (message: string, data?: unknown) => void;
}

export interface ErrorEvent {
    error: Error;
    operation: string;
    timestamp: string;
    context?: Record<string, any>;
}

export interface AuthFailureEvent {
    error: Error;
    timestamp: string;
    authType: 'oauth' | 'basic';
}

export interface RequestStartEvent {
    endpoint: string;
    method: string;
    timestamp: string;
    requestId: string;
}

export interface RequestCompleteEvent {
    endpoint: string;
    method: string;
    status: number;
    duration: number;
    timestamp: string;
    requestId: string;
}

export interface RateLimitEvent {
    limit: number;
    remaining: number;
    resetTime: string;
    timestamp: string;
}

export interface CacheEvent {
    key: string;
    operation: 'hit' | 'miss' | 'set' | 'invalidate';
    timestamp: string;
}

