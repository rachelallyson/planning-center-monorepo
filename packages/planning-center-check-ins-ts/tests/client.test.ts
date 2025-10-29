/**
 * v1.0.0 Check-Ins Client Tests
 */

import { PcoCheckInsClient } from '../src';

describe('PcoCheckInsClient v1.0.0', () => {
    let client: PcoCheckInsClient;

    beforeEach(() => {
        client = new PcoCheckInsClient({
            auth: {
                type: 'personal_access_token',
                personalAccessToken: 'test-token',
            },
        });
    });

    describe('Client Creation', () => {
        it('should create a client with personal access token configuration', () => {
            expect(client).toBeDefined();
            expect(client.getConfig().auth.type).toBe('personal_access_token');
            expect(client.getConfig().auth.personalAccessToken).toBe('test-token');
        });

        it('should create a client with OAuth configuration', () => {
            const oauthClient = new PcoCheckInsClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'test-token',
                    refreshToken: 'refresh-token',
                    onRefresh: jest.fn(),
                    onRefreshFailure: jest.fn(),
                },
            });

            expect(oauthClient.getConfig().auth.type).toBe('oauth');
            expect(oauthClient.getConfig().auth.accessToken).toBe('test-token');
        });

        it('should create a client with basic auth configuration', () => {
            const basicClient = new PcoCheckInsClient({
                auth: {
                    type: 'basic',
                    appId: 'test-app-id',
                    appSecret: 'test-app-secret',
                },
            });

            expect(basicClient.getConfig().auth.type).toBe('basic');
            expect(basicClient.getConfig().auth.appId).toBe('test-app-id');
        });
    });

    describe('Module Initialization', () => {
        it('should initialize all modules', () => {
            expect(client.events).toBeDefined();
            expect(client.checkIns).toBeDefined();
            expect(client.locations).toBeDefined();
            expect(client.eventPeriods).toBeDefined();
            expect(client.eventTimes).toBeDefined();
            expect(client.stations).toBeDefined();
            expect(client.labels).toBeDefined();
            expect(client.options).toBeDefined();
            expect(client.checkInGroups).toBeDefined();
            expect(client.checkInTimes).toBeDefined();
            expect(client.personEvents).toBeDefined();
            expect(client.preChecks).toBeDefined();
            expect(client.passes).toBeDefined();
            expect(client.headcounts).toBeDefined();
            expect(client.attendanceTypes).toBeDefined();
            expect(client.rosterListPersons).toBeDefined();
            expect(client.organization).toBeDefined();
            expect(client.integrationLinks).toBeDefined();
            expect(client.themes).toBeDefined();
            expect(client.batch).toBeDefined();
        });

        it('should have 19 modules', () => {
            const modules = [
                'events',
                'checkIns',
                'locations',
                'eventPeriods',
                'eventTimes',
                'stations',
                'labels',
                'options',
                'checkInGroups',
                'checkInTimes',
                'personEvents',
                'preChecks',
                'passes',
                'headcounts',
                'attendanceTypes',
                'rosterListPersons',
                'organization',
                'integrationLinks',
                'themes',
            ];

            modules.forEach(moduleName => {
                expect((client as any)[moduleName]).toBeDefined();
            });
        });
    });

    describe('Event System', () => {
        it('should emit events for requests', () => {
            // Test that event listeners can be set up
            const startHandler = jest.fn();
            const completeHandler = jest.fn();

            client.on('request:start', startHandler);
            client.on('request:complete', completeHandler);

            expect(client.listenerCount('request:start')).toBe(1);
            expect(client.listenerCount('request:complete')).toBe(1);

            // Test that listeners can be removed
            client.off('request:start', startHandler);
            client.off('request:complete', completeHandler);

            expect(client.listenerCount('request:start')).toBe(0);
            expect(client.listenerCount('request:complete')).toBe(0);
        });

        it('should remove event listeners', () => {
            const handler = jest.fn();

            client.on('error', handler);
            expect(client.listenerCount('error')).toBe(1);

            client.off('error', handler);
            expect(client.listenerCount('error')).toBe(0);
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

    describe('Configuration', () => {
        it('should get current configuration', () => {
            const config = client.getConfig();
            expect(config).toBeDefined();
            expect(config.auth.type).toBe('personal_access_token');
        });

        it('should update configuration', () => {
            client.updateConfig({
                timeout: 5000,
            });

            const config = client.getConfig();
            expect(config.timeout).toBe(5000);
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
});

