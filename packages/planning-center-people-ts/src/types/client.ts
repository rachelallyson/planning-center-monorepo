/**
 * People client configuration. Re-exports base auth and debug types; PeopleClientConfig
 * is an alias for PcoClientConfig (same shape: auth, baseURL, timeout, headers, debug).
 */

export type {
    PcoClientConfig,
    PcoAuthConfig,
    PcoDebugOptions,
    PersonalAccessTokenAuth,
    OAuthAuth,
    BasicAuth,
} from '@rachelallyson/planning-center-base-ts';

/** Same as PcoClientConfig. Use when constructing PcoClient for the People API. */
export type PeopleClientConfig = import('@rachelallyson/planning-center-base-ts').PcoClientConfig;
