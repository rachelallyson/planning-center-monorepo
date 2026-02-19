/**
 * v2.0.0 Client Tests (real PcoClient only; no mocks).
 * For module behavior against the API, see tests/modules/* and tests/integration/.
 */

import { PcoClient } from '../src';
import type { PeopleClientConfig } from '../src/types';

describe('PcoClient v2.0.0', () => {
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
            const config = client.getConfig();
            expect(config.auth.type).toBe('oauth');
            if (config.auth.type === 'oauth') {
                expect(config.auth.accessToken).toBe('test-token');
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

            const config = basicClient.getConfig();
            expect(config.auth.type).toBe('basic');
            if (config.auth.type === 'basic') {
                expect(config.auth.appId).toBe('test-app-id');
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
            const newConfig: PeopleClientConfig = {
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

            const config = client.getConfig();
            if (config.auth.type === 'oauth') {
                expect(config.auth.accessToken).toBe('new-token');
            }
            expect(config.timeout).toBe(60000);
        });
    });
});
