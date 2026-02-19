/**
 * Check-Ins Core API Integration Tests
 * 
 * Tests for the Check-Ins API client using real Planning Center API:
 * - client.events.getAll(), client.events.getById()
 * - client.checkIns.getAll(), client.checkIns.getById()
 * - client.locations.getAll()
 * - Real HTTP requests to Planning Center servers
 * 
 * To run: npm run test:integration
 * 
 * Requires environment variables in .env.test:
 * - PCO_APP_ID and PCO_APP_SECRET (Basic Auth), OR
 * - PCO_ACCESS_TOKEN (OAuth Personal Access Token)
 */

import { PcoCheckInsClient } from '../../src';
import type { PcoCheckInsClientConfig } from '../../src';

function getCheckInsCoreConfig(): PcoCheckInsClientConfig {
    const hasPersonalToken = !!process.env.PCO_PERSONAL_ACCESS_TOKEN;
    const hasOAuthCredentials = !!process.env.PCO_ACCESS_TOKEN;
    if (hasPersonalToken) {
        return {
            auth: {
                type: 'personal_access_token',
                personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
                ...(process.env.PCO_PERSONAL_ACCESS_SECRET && {
                    personalAccessTokenSecret: process.env.PCO_PERSONAL_ACCESS_SECRET,
                }),
            },
            retry: { enabled: true, maxRetries: 3 },
            timeout: 30000,
        };
    }
    if (hasOAuthCredentials) {
        return {
            auth: {
                type: 'oauth',
                accessToken: process.env.PCO_ACCESS_TOKEN!,
                refreshToken: process.env.PCO_REFRESH_TOKEN ?? '',
                onRefresh: async () => { },
                onRefreshFailure: async () => { },
            },
            retry: { enabled: true, maxRetries: 3 },
            timeout: 30000,
        };
    }
    return {
        auth: {
            type: 'basic',
            appId: process.env.PCO_APP_ID!,
            appSecret: process.env.PCO_APP_SECRET!,
        },
        retry: { enabled: true, maxRetries: 3 },
        timeout: 30000,
    };
}

describe('Check-Ins Core API Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        const hasAppCredentials = process.env.PCO_APP_ID && process.env.PCO_APP_SECRET;
        const hasOAuthCredentials = process.env.PCO_ACCESS_TOKEN;
        const hasPersonalToken = process.env.PCO_PERSONAL_ACCESS_TOKEN;
        if (!hasAppCredentials && !hasOAuthCredentials && !hasPersonalToken) {
            throw new Error(
                'PCO credentials not found. Please set one of:\n' +
                '- PCO_APP_ID and PCO_APP_SECRET (Basic Auth), OR\n' +
                '- PCO_ACCESS_TOKEN (OAuth), OR\n' +
                '- PCO_PERSONAL_ACCESS_TOKEN (Personal Access Token)\n' +
                'in .env.test file'
            );
        }
        client = new PcoCheckInsClient(getCheckInsCoreConfig());
    }, 30000);

    describe('Events Module - Real API', () => {
        it('should get all events from real API', async () => {
            const result = await client.events.getAll();

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);

            const event = result.data[0];
            expect(event.type).toBe('Event');
            expect(event.id).toBeDefined();
            if (event.name !== undefined) {
                expect(typeof event.name).toBe('string');
            }
        }, 30000);

        it('should get events with getPage (single page)', async () => {
            const result = await client.events.getPage({
                per_page: 5,
                page: 1
            });

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeLessThanOrEqual(5);
            if (result.meta) {
                expect(typeof result.meta).toBe('object');
            }
        }, 30000);

        it('should get a single event by ID', async () => {
            const allEvents = await client.events.getAll();
            expect(allEvents.data.length).toBeGreaterThan(0);

            const eventId = allEvents.data[0].id;
            const event = await client.events.getById(eventId);

            expect(event).toBeDefined();
            expect(event.type).toBe('Event');
            expect(event.id).toBe(eventId);
        }, 30000);

        it('should get check-ins for an event', async () => {
            const allEvents = await client.events.getAll();
            expect(allEvents.data.length).toBeGreaterThan(0);

            const eventId = allEvents.data[0].id;
            const checkIns = await client.events.getCheckIns(eventId);

            expect(checkIns).toBeDefined();
            expect(checkIns.data).toBeDefined();
            expect(Array.isArray(checkIns.data)).toBe(true);
            expect(checkIns.data.length).toBeGreaterThan(0);
            const checkIn = checkIns.data[0];
            expect(checkIn.type).toBe('CheckIn');
            expect(checkIn.id).toBeDefined();
        }, 30000);
    });

    describe('CheckIns Module - Real API', () => {
        it('should get all check-ins from real API', async () => {
            const result = await client.checkIns.getAll();

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);

            const checkIn = result.data[0];
            expect(checkIn.type).toBe('CheckIn');
            expect(checkIn.id).toBeDefined();
            if (checkIn.security_code !== undefined) {
                expect(typeof checkIn.security_code).toBe('string');
            }
        }, 30000);

        it('should get check-ins with filters', async () => {
            const result = await client.checkIns.getAll({
                filter: ['attendee']
            });

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should get a single check-in by ID', async () => {
            const allCheckIns = await client.checkIns.getAll();
            expect(allCheckIns.data.length).toBeGreaterThan(0);

            const checkInId = allCheckIns.data[0].id;
            const checkIn = await client.checkIns.getById(checkInId);

            expect(checkIn).toBeDefined();
            expect(checkIn.type).toBe('CheckIn');
            expect(checkIn.id).toBe(checkInId);
        }, 30000);
    });

    describe('Locations Module - Real API', () => {
        it('should get all locations from real API', async () => {
            const result = await client.locations.getAll();

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);

            const location = result.data[0];
            expect(location.type).toBe('Location');
            expect(location.id).toBeDefined();
        }, 30000);
    });

    describe('Organization Module - Real API', () => {
        it('should get organization info from real API', async () => {
            const organization = await client.organization.get();

            expect(organization).toBeDefined();
            expect(organization.type).toBe('Organization');
            expect(organization.id).toBeDefined();
            expect(organization.name).toBeDefined();
            expect(typeof organization.name).toBe('string');
        }, 30000);
    });

    describe('Event Periods Module - Real API', () => {
        it('should get event periods from real API via event associations', async () => {
            const events = await client.events.getPage({ per_page: 1, page: 1 });
            expect(events.data.length).toBeGreaterThan(0);

            const eventId = events.data[0].id;
            const result = await client.events.getEventPeriods(eventId);

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);

            const period = result.data[0];
            expect(period.type).toBe('EventPeriod');
            expect(period.id).toBeDefined();
        }, 30000);
    });
});



