/**
 * OAuth refresh token usage with PcoClient.
 * Core package handles token refresh via auth.onRefresh / onRefreshFailure.
 */

import { PcoClient } from '../src';

async function basicRefreshTokenExample() {
  const client = new PcoClient({
    auth: {
      type: 'oauth',
      accessToken: process.env.PCO_ACCESS_TOKEN ?? 'your-initial-access-token',
      refreshToken: process.env.PCO_REFRESH_TOKEN ?? 'your-refresh-token',
      clientId: process.env.PCO_APP_ID,
      clientSecret: process.env.PCO_APP_SECRET,
      onRefresh: async (newTokens) => {
        console.log('Tokens refreshed');
        console.log('New access token:', newTokens.accessToken ? '(set)' : '(missing)');
        // In a real app: await saveTokensToDatabase(userId, newTokens);
      },
      onRefreshFailure: async (err) => {
        console.error('Token refresh failed:', err.message);
      },
    },
  });

  const result = await client.people.getPage({ per_page: 10 });
  console.log('Retrieved people:', result.data.length);
}

interface UserTokens {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

class TokenManager {
  private tokens = new Map<string, UserTokens>();

  async saveTokens(userId: string, tokens: { accessToken: string; refreshToken: string }) {
    this.tokens.set(userId, { userId, ...tokens });
  }

  createOnRefresh(userId: string) {
    return async (tokens: { accessToken: string; refreshToken: string }) => {
      await this.saveTokens(userId, tokens);
    };
  }
}

async function advancedRefreshTokenExample() {
  const tokenManager = new TokenManager();
  const userId = 'user-123';

  const client = new PcoClient({
    auth: {
      type: 'oauth',
      accessToken: 'existing-access-token',
      refreshToken: 'existing-refresh-token',
      clientId: process.env.PCO_APP_ID,
      clientSecret: process.env.PCO_APP_SECRET,
      onRefresh: tokenManager.createOnRefresh(userId),
      onRefreshFailure: async () => {},
    },
  });

  const [people, withHousehold] = await Promise.all([
    client.people.getPage({ per_page: 10 }),
    client.people.getPage({ per_page: 10, include: ['household'] }),
  ]);
  console.log('People:', people.data.length, 'With household:', withHousehold.data.length);
}

export { basicRefreshTokenExample, advancedRefreshTokenExample, TokenManager };
