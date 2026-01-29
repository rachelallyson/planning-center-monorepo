/**
 * v2.0.0 Simple API Tests
 */

import { PcoClient, type PcoClientConfig } from '../src';

describe('PcoClient v2.0.0 Simple Tests', () => {
    let client: PcoClient;

    beforeEach(() => {
        client = new PcoClient({
            auth: {
                type: 'oauth',
                accessToken: 'test-token',
                refreshToken: 'test-refresh-token',
                onRefresh: async () => {},
                onRefreshFailure: async () => {},
            },
        });
    });

    describe('Client Creation', () => {
        it('should create a client with OAuth configuration', () => {
            expect(client).toBeDefined();
            expect(client.getConfig().auth.type).toBe('oauth');
            const auth = client.getConfig().auth;
            if (auth.type === 'oauth') {
                expect(auth.accessToken).toBe('test-token');
            }
        });

        it('should create a client with basic auth configuration', () => {
            const basicClient = new PcoClient({
                auth: {
                    type: 'basic',
                    appId: 'test-app-id',
                    appSecret: 'test-app-secret',
                },
            });

            expect(basicClient.getConfig().auth.type).toBe('basic');
            const auth = basicClient.getConfig().auth;
            if (auth.type === 'basic') {
                expect(auth.appId).toBe('test-app-id');
            }
        });
    });

    describe('Event System', () => {
        it('should allow setting up event listeners', () => {
            const handler = jest.fn();

            client.on('request:start', handler);
            expect(client.listenerCount('request:start')).toBe(1);

            client.off('request:start', handler);
            expect(client.listenerCount('request:start')).toBe(0);
        });

        it('should remove all listeners', () => {
            client.on('error', jest.fn());
            client.on('auth:failure', jest.fn());

            expect(client.listenerCount('error')).toBe(1);
            expect(client.listenerCount('auth:failure')).toBe(1);

            client.removeAllListeners();

            expect(client.listenerCount('error')).toBe(0);
            expect(client.listenerCount('auth:failure')).toBe(0);
        });
    });

    describe('Performance Metrics', () => {
        it('should return performance metrics', () => {
            const metrics = client.getPerformanceMetrics();
            expect(metrics).toBeDefined();
            expect(typeof metrics).toBe('object');
        });

        it('should return rate limit info', () => {
            const rateLimitInfo = client.getRateLimitInfo();
            expect(rateLimitInfo).toBeDefined();
            expect(typeof rateLimitInfo).toBe('object');
        });
    });

    describe('Module Access', () => {
        it('should provide access to all modules', () => {
            expect(client.people).toBeDefined();
            expect(client.fields).toBeDefined();
            expect(client.workflows).toBeDefined();
            expect(client.contacts).toBeDefined();
            expect(client.households).toBeDefined();
            expect(client.notes).toBeDefined();
            expect(client.lists).toBeDefined();
            expect(client.batch).toBeDefined();
        });
    });

    describe('Configuration Updates', () => {
        it('should update configuration', () => {
            const newConfig: Partial<PcoClientConfig> = {
                auth: {
                    type: 'oauth',
                    accessToken: 'new-token',
                    refreshToken: 'test-refresh-token',
                    onRefresh: async () => {},
                    onRefreshFailure: async () => {},
                },
                timeout: 60000,
            };

            client.updateConfig(newConfig);

            const auth = client.getConfig().auth;
            if (auth.type === 'oauth') {
                expect(auth.accessToken).toBe('new-token');
            }
            expect(client.getConfig().timeout).toBe(60000);
        });
    });

    describe('Event Types', () => {
        it('should return available event types', () => {
            const eventTypes = client.eventTypes();
            expect(Array.isArray(eventTypes)).toBe(true);
        });
    });
});
