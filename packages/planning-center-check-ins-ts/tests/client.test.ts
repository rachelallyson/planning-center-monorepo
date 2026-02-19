/**
 * Check-Ins Client Tests
 */

import { PcoCheckInsClient } from '../src';

describe('PcoCheckInsClient', () => {
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
            const auth = client.getConfig().auth;
            expect(auth.type).toBe('personal_access_token');
            expect(auth.type === 'personal_access_token' && auth.personalAccessToken).toBe('test-token');
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

            const oauthAuth = oauthClient.getConfig().auth;
            expect(oauthAuth.type).toBe('oauth');
            expect(oauthAuth.type === 'oauth' && oauthAuth.accessToken).toBe('test-token');
        });

        it('should create a client with basic auth configuration', () => {
            const basicClient = new PcoCheckInsClient({
                auth: {
                    type: 'basic',
                    appId: 'test-app-id',
                    appSecret: 'test-app-secret',
                },
            });

            const basicAuth = basicClient.getConfig().auth;
            expect(basicAuth.type).toBe('basic');
            expect(basicAuth.type === 'basic' && basicAuth.appId).toBe('test-app-id');
        });
    });

    describe('Module Initialization', () => {
        it('should initialize all modules', () => {
            expect(client.events).toBeDefined();
            expect(client.checkIns).toBeDefined();
            expect(client.locations).toBeDefined();
            // EventPeriodsModule removed - event periods only accessible via events.getEventPeriods()
            expect(client.eventTimes).toBeDefined();
            expect(client.stations).toBeDefined();
            expect(client.labels).toBeDefined();
            expect(client.options).toBeDefined();
            expect(client.checkInGroups).toBeDefined();
            // checkInTimes removed - only accessible via checkIns.getCheckInTimes(checkInId)
            // personEvents removed - only accessible via events.getPersonEvents(eventId)
            expect(client.preChecks).toBeDefined();
            expect(client.passes).toBeDefined();
            expect(client.headcounts).toBeDefined();
            expect(client.attendanceTypes).toBeDefined();
            expect(client.rosterListPersons).toBeDefined();
            expect(client.organization).toBeDefined();
            expect(client.integrationLinks).toBeDefined();
            expect(client.themes).toBeDefined();
        });

        it('should have 16 modules', () => {
            const clientModules: Record<string, object> = {
                events: client.events,
                checkIns: client.checkIns,
                locations: client.locations,
                eventTimes: client.eventTimes,
                stations: client.stations,
                labels: client.labels,
                options: client.options,
                checkInGroups: client.checkInGroups,
                preChecks: client.preChecks,
                passes: client.passes,
                headcounts: client.headcounts,
                attendanceTypes: client.attendanceTypes,
                rosterListPersons: client.rosterListPersons,
                organization: client.organization,
                integrationLinks: client.integrationLinks,
                themes: client.themes,
            };
            Object.values(clientModules).forEach(mod => {
                expect(mod).toBeDefined();
            });
            expect(Object.keys(clientModules)).toHaveLength(16);
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

    describe('Rate limit', () => {
        it('should return rate limit info', () => {
            const rateLimitInfo = client.getRateLimitInfo();
            expect(rateLimitInfo).toBeDefined();
            expect(typeof rateLimitInfo).toBe('object');
        });
    });
});

