import type { PcoAuthConfig } from './config';

function basicHeader(username: string, password: string): string {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${credentials}`;
}

function getPatSecret(auth: Extract<PcoAuthConfig, { type: 'personal_access_token' }>): string | undefined {
  return (
    auth.personalAccessTokenSecret ??
    (typeof process !== 'undefined' ? process.env?.PCO_PERSONAL_ACCESS_SECRET : undefined)
  );
}

function patHeader(auth: Extract<PcoAuthConfig, { type: 'personal_access_token' }>): string {
  const secret = getPatSecret(auth);
  return auth.personalAccessToken && secret ? basicHeader(auth.personalAccessToken, secret) : '';
}

export function getAuthHeader(auth: PcoAuthConfig): string {
  switch (auth.type) {
    case 'personal_access_token':
      return patHeader(auth);
    case 'oauth':
      return `Bearer ${auth.accessToken}`;
    case 'basic':
      return basicHeader(auth.appId, auth.appSecret);
    default:
      return '';
  }
}
