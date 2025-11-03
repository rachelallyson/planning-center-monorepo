/**
 * Tests for the client manager functionality
 */

import { PcoClientManager } from '../src/client-manager';
import type { PcoClientConfig, ClientConfigResolver } from '../src/client-manager';
import type { PcoClient } from '../src/client';

// Mock PcoClient
let mockClientCounter = 0;
jest.mock('../src/client', () => ({
  PcoClient: jest.fn().mockImplementation((config) => {
    mockClientCounter++;
    return {
      updateConfig: jest.fn(),
      _mockId: mockClientCounter, // Add unique identifier
      _config: config, // Store config for debugging
    };
  }),
}));

// Import the mocked PcoClient
import { PcoClient as MockPcoClient } from '../src/client';

describe('PcoClientManager', () => {
  let manager: PcoClientManager;

  beforeEach(() => {
    // Clear the singleton instance
    (PcoClientManager as any).instance = undefined;
    manager = PcoClientManager.getInstance();
    manager.clearCache();
    // Reset mock counter
    mockClientCounter = 0;
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = PcoClientManager.getInstance();
      const instance2 = PcoClientManager.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(PcoClientManager);
    });
  });

  describe('getClient', () => {
    const mockConfig: PcoClientConfig = {
      auth: {
        type: 'personal_access_token',
        personalAccessToken: 'test-token',
      },
      baseURL: 'https://api.planningcenteronline.com/test/v2',
    };

    it('should create new client for new config', () => {
      const client = PcoClientManager.getClient(mockConfig);
      
      expect(client).toBeDefined();
      expect(MockPcoClient).toHaveBeenCalledWith(mockConfig);
    });

    it('should return cached client for same config', () => {
      const client1 = PcoClientManager.getClient(mockConfig);
      const client2 = PcoClientManager.getClient(mockConfig);
      
      expect(client1).toBe(client2);
      expect(MockPcoClient).toHaveBeenCalledTimes(1);
    });

    it('should create new client for different config', () => {
      const config1: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'token1',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const config2: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'token2',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const client1 = PcoClientManager.getClient(config1);
      const client2 = PcoClientManager.getClient(config2);
      
      // Different configs should create different clients
      expect(client1).not.toBe(client2);
      expect(MockPcoClient).toHaveBeenCalledTimes(2);
    });

    it('should update client when config changes', () => {
      const config1: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'token1',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const config2: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'token2',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const client1 = PcoClientManager.getClient(config1);
      const client2 = PcoClientManager.getClient(config2);
      
      expect(client1).not.toBe(client2);
    });
  });

  describe('getClientForChurch', () => {
    const mockConfigResolver: ClientConfigResolver = jest.fn().mockResolvedValue({
      auth: {
        type: 'personal_access_token',
        personalAccessToken: 'church-token',
      },
      baseURL: 'https://api.planningcenteronline.com/test/v2',
    });

    it('should create client for church with config resolver', async () => {
      const client = await PcoClientManager.getClientForChurch('church123', mockConfigResolver);
      
      expect(client).toBeDefined();
      expect(mockConfigResolver).toHaveBeenCalledWith('church123');
      expect(MockPcoClient).toHaveBeenCalledWith({
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'church-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      });
    });

    it('should return cached client for same church', async () => {
      const client1 = await PcoClientManager.getClientForChurch('church123', mockConfigResolver);
      const client2 = await PcoClientManager.getClientForChurch('church123', mockConfigResolver);
      
      expect(client1).toBe(client2);
      expect(mockConfigResolver).toHaveBeenCalledTimes(1);
    });

    it('should create separate clients for different churches', async () => {
      const configResolver2: ClientConfigResolver = jest.fn().mockResolvedValue({
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'church-token-2',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      });

      const client1 = await PcoClientManager.getClientForChurch('church123', mockConfigResolver);
      const client2 = await PcoClientManager.getClientForChurch('church456', configResolver2);
      
      expect(client1).not.toBe(client2);
      expect(mockConfigResolver).toHaveBeenCalledWith('church123');
      expect(configResolver2).toHaveBeenCalledWith('church456');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached clients', () => {
      const config: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'test-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      // Create a client to cache it
      PcoClientManager.getClient(config);
      
      // Clear cache
      PcoClientManager.clearCache();
      
      // Create another client - should be new instance
      const client1 = PcoClientManager.getClient(config);
      const client2 = PcoClientManager.getClient(config);
      
      expect(client1).toBe(client2);
      expect(MockPcoClient).toHaveBeenCalledTimes(2); // Once before clear, once after
    });
  });

  describe('removeClient', () => {
    it('should remove specific client from cache', () => {
      const config: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'test-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      // Create a client
      const client1 = PcoClientManager.getClient(config);
      
      // Remove it
      manager.removeClient(config);
      
      // Create another client - should be new instance
      const client2 = PcoClientManager.getClient(config);
      
      expect(client1).not.toBe(client2);
      expect(MockPcoClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('removeChurchClient', () => {
    it('should remove church client from cache', async () => {
      const mockConfigResolver: ClientConfigResolver = jest.fn().mockResolvedValue({
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'church-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      });

      // Create a church client
      const client1 = await PcoClientManager.getClientForChurch('church123', mockConfigResolver);
      
      // Remove it
      manager.removeChurchClient('church123');
      
      // Create another client - should be new instance
      const client2 = await PcoClientManager.getClientForChurch('church123', mockConfigResolver);
      
      expect(client1).not.toBe(client2);
      expect(mockConfigResolver).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const config: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'test-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      // Create some clients
      PcoClientManager.getClient(config);
      
      const stats = manager.getCacheStats();
      
      expect(stats).toEqual({
        clientCount: 1,
        configCount: 1,
        churchClients: 0,
      });
    });

    it('should count church clients correctly', async () => {
      const mockConfigResolver: ClientConfigResolver = jest.fn().mockResolvedValue({
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'church-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      });

      // Create church clients
      await PcoClientManager.getClientForChurch('church123', mockConfigResolver);
      await PcoClientManager.getClientForChurch('church456', mockConfigResolver);
      
      const stats = manager.getCacheStats();
      
      expect(stats.churchClients).toBe(2);
      expect(stats.clientCount).toBe(2);
      expect(stats.configCount).toBe(2);
    });
  });

  describe('generateConfigKey', () => {
    it('should generate different keys for different configs', () => {
      const config1: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'token1',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const config2: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'token2',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const client1 = PcoClientManager.getClient(config1);
      const client2 = PcoClientManager.getClient(config2);
      
      expect(client1).not.toBe(client2);
    });

    it('should generate same key for identical configs', () => {
      const config: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'test-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const client1 = PcoClientManager.getClient(config);
      const client2 = PcoClientManager.getClient(config);
      
      expect(client1).toBe(client2);
    });
  });

  describe('hasConfigChanged', () => {
    it('should detect auth type changes', () => {
      const config1: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'test-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const config2: PcoClientConfig = {
        auth: {
          type: 'oauth',
          accessToken: 'oauth-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const client1 = PcoClientManager.getClient(config1);
      const client2 = PcoClientManager.getClient(config2);
      
      expect(client1).not.toBe(client2);
    });

    it('should detect OAuth token changes', () => {
      const config1: PcoClientConfig = {
        auth: {
          type: 'oauth',
          accessToken: 'token1',
          refreshToken: 'refresh1',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const config2: PcoClientConfig = {
        auth: {
          type: 'oauth',
          accessToken: 'token2',
          refreshToken: 'refresh1',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const client1 = PcoClientManager.getClient(config1);
      const client2 = PcoClientManager.getClient(config2);
      
      expect(client1).not.toBe(client2);
    });

    it('should detect personal access token changes', () => {
      const config1: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'token1',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const config2: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'token2',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const client1 = PcoClientManager.getClient(config1);
      const client2 = PcoClientManager.getClient(config2);
      
      expect(client1).not.toBe(client2);
    });

    it('should detect baseURL changes', () => {
      const config1: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'test-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
      };

      const config2: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'test-token',
        },
        baseURL: 'https://api.planningcenteronline.com/prod/v2',
      };

      const client1 = PcoClientManager.getClient(config1);
      const client2 = PcoClientManager.getClient(config2);
      
      expect(client1).not.toBe(client2);
    });

    it('should detect timeout changes', () => {
      const config1: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'test-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
        timeout: 5000,
      };

      const config2: PcoClientConfig = {
        auth: {
          type: 'personal_access_token',
          personalAccessToken: 'test-token',
        },
        baseURL: 'https://api.planningcenteronline.com/test/v2',
        timeout: 10000,
      };

      const client1 = PcoClientManager.getClient(config1);
      const client2 = PcoClientManager.getClient(config2);
      
      expect(client1).not.toBe(client2);
    });
  });
});
