// Clients and config
export { PcoClient } from './client';
export type {
  PcoClientConfig,
  PcoAuthConfig,
  PersonalAccessTokenAuth,
  OAuthAuth,
  PeopleClientConfig,
  PcoDebugOptions,
} from './types/client';

// API error (for catch blocks). Use client.getRateLimitInfo() for rate limit info.
export { PcoApiError, singleFromCreateResponse } from '@rachelallyson/planning-center-base-ts';
export type { CreateResponse } from '@rachelallyson/planning-center-base-ts';

// All types (resources, JSON:API, api-options)
export * from './types';

// Helpers
export * from './helpers';

// Matching (findOrCreatePerson, retry config)
export { DEFAULT_INITIAL_RETRY_CONFIG, DEFAULT_AGGRESSIVE_RETRY_CONFIG } from './modules/people';
export type { RetryConfig, PersonMatchOptions } from './modules/people';
