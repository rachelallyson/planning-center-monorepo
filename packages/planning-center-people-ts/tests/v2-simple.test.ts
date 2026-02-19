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

    describe('Rate limit', () => {
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

});
