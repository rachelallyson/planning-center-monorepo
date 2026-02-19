/**
 * Client configuration and auth types.
 */

/** Personal access token auth (People/Check-ins app tokens). */
export interface PersonalAccessTokenAuth {
  type: 'personal_access_token';
  personalAccessToken: string;
  personalAccessTokenSecret?: string;
}

/** OAuth auth with refresh callbacks. */
export interface OAuthAuth {
  type: 'oauth';
  accessToken: string;
  refreshToken: string;
  onRefresh: (tokens: { accessToken: string; refreshToken: string }) => void | Promise<void>;
  onRefreshFailure: (error: Error) => void | Promise<void>;
  clientId?: string;
  clientSecret?: string;
}

/** Basic (app id + secret) auth. */
export interface BasicAuth {
  type: 'basic';
  appId: string;
  appSecret: string;
}

export type PcoAuthConfig = PersonalAccessTokenAuth | OAuthAuth | BasicAuth;

/** Debug logging: prefix, optional payloads, custom onLog. */
export interface PcoDebugOptions {
  prefix?: string;
  includePayloads?: boolean;
  onLog?: (message: string, data?: object) => void;
}

/** Base config for PCO API clients: auth, baseURL, timeout, headers, debug. */
export interface PcoClientConfig {
  auth: PcoAuthConfig;
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  debug?: boolean | PcoDebugOptions;
}
