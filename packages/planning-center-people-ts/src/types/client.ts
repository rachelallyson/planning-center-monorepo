/**
 * v2.0.0 Client Configuration Types
 *
 * Re-exports from base package for consistency. Debug options live in base so all PCO packages share the same behavior.
 */

export type {
    PcoClientConfig,
    PcoAuthConfig,
    PcoDebugOptions,
    PersonalAccessTokenAuth,
    OAuthAuth,
    BasicAuth,
    ErrorEvent,
    AuthFailureEvent,
    RequestStartEvent,
    RequestCompleteEvent,
    RateLimitEvent,
    CacheEvent,
} from '@rachelallyson/planning-center-base-ts';

/** Alias for PcoClientConfig (base now includes debug). Use for clarity in People package. */
export type PeopleClientConfig = import('@rachelallyson/planning-center-base-ts').PcoClientConfig;
