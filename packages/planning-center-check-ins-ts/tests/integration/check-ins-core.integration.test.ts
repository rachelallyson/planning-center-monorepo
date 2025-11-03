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

// Test configuration
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');

describe('Check-Ins Core API Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        // Validate environment variables
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

        // Create client configuration
        const config: PcoCheckInsClientConfig = hasPersonalToken
            ? {
                auth: {
                    type: 'personal_access_token',
                    personalAccessToken: process.env.PCO_PERSONAL_ACCESS_TOKEN!,
                },
                retry: {
                    enabled: true,
                    maxRetries: 3,
                },
                timeout: 30000,
                events: {
                    onError: (event) => {
                        console.error('PCO Error:', event.error.message);
                    },
                    onRequestStart: (event) => {
                        console.log(`Starting ${event.method} ${event.endpoint}`);
                    },
                    onRequestComplete: (event) => {
                        console.log(`Completed ${event.method} ${event.endpoint} in ${event.duration}ms`);
                    },
                },
            }
            : hasOAuthCredentials
            ? {
                auth: {
                    type: 'oauth',
                    accessToken: process.env.PCO_ACCESS_TOKEN!,
                },
                retry: {
                    enabled: true,
                    maxRetries: 3,
                },
                timeout: 30000,
                events: {
                    onError: (event) => {
                        console.error('PCO Error:', event.error.message);
                    },
                },
            }
            : {
                auth: {
                    type: 'basic',
                    appId: process.env.PCO_APP_ID!,
                    appSecret: process.env.PCO_APP_SECRET!,
                },
                retry: {
                    enabled: true,
                    maxRetries: 3,
                },
                timeout: 30000,
                events: {
                    onError: (event) => {
                        console.error('PCO Error:', event.error.message);
                    },
                },
            };

        // Create client
        client = new PcoCheckInsClient(config);
    }, 30000);

    describe('Events Module - Real API', () => {
        it('should get all events from real API', async () => {
            const result = await client.events.getAll();

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);

            // If there are events, verify structure
            if (result.data.length > 0) {
                const event = result.data[0];
                expect(event.type).toBe('Event');
                expect(event.id).toBeDefined();
                expect(event.attributes).toBeDefined();
                
                // Verify common attributes
                if (event.attributes?.name) {
                    expect(typeof event.attributes.name).toBe('string');
                }
            }
        }, 30000);

        it('should get events with pagination', async () => {
            const result = await client.events.getAll({
                perPage: 5,
                page: 1
            });

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeLessThanOrEqual(5);
            
            // Check for pagination meta/links if available
            if (result.meta) {
                expect(typeof result.meta).toBe('object');
            }
        }, 30000);

        it('should get a single event by ID if events exist', async () => {
            // First get all events to find an ID
            const allEvents = await client.events.getAll();

            if (allEvents.data.length > 0) {
                const eventId = allEvents.data[0].id;
                const event = await client.events.getById(eventId);

                expect(event).toBeDefined();
                expect(event.type).toBe('Event');
                expect(event.id).toBe(eventId);
                expect(event.attributes).toBeDefined();
            } else {
                console.log('Skipping test: No events found in account');
            }
        }, 30000);

        it('should get check-ins for an event if events exist', async () => {
            // First get all events to find an ID
            const allEvents = await client.events.getAll();

            if (allEvents.data.length > 0) {
                const eventId = allEvents.data[0].id;
                const checkIns = await client.events.getCheckIns(eventId);

                expect(checkIns).toBeDefined();
                expect(checkIns.data).toBeDefined();
                expect(Array.isArray(checkIns.data)).toBe(true);

                // If there are check-ins, verify structure
                if (checkIns.data.length > 0) {
                    const checkIn = checkIns.data[0];
                    expect(checkIn.type).toBe('CheckIn');
                    expect(checkIn.id).toBeDefined();
                }
            } else {
                console.log('Skipping test: No events found in account');
            }
        }, 30000);
    });

    describe('CheckIns Module - Real API', () => {
        it('should get all check-ins from real API', async () => {
            const result = await client.checkIns.getAll();

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);

            // If there are check-ins, verify structure
            if (result.data.length > 0) {
                const checkIn = result.data[0];
                expect(checkIn.type).toBe('CheckIn');
                expect(checkIn.id).toBeDefined();
                expect(checkIn.attributes).toBeDefined();
                
                // Verify common attributes
                if (checkIn.attributes?.security_code) {
                    expect(typeof checkIn.attributes.security_code).toBe('string');
                }
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

        it('should get a single check-in by ID if check-ins exist', async () => {
            // First get all check-ins to find an ID
            const allCheckIns = await client.checkIns.getAll();

            if (allCheckIns.data.length > 0) {
                const checkInId = allCheckIns.data[0].id;
                const checkIn = await client.checkIns.getById(checkInId);

                expect(checkIn).toBeDefined();
                expect(checkIn.type).toBe('CheckIn');
                expect(checkIn.id).toBe(checkInId);
                expect(checkIn.attributes).toBeDefined();
            } else {
                console.log('Skipping test: No check-ins found in account');
            }
        }, 30000);
    });

    describe('Locations Module - Real API', () => {
        it('should get all locations from real API', async () => {
            const result = await client.locations.getAll();

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);

            // If there are locations, verify structure
            if (result.data.length > 0) {
                const location = result.data[0];
                expect(location.type).toBe('Location');
                expect(location.id).toBeDefined();
                expect(location.attributes).toBeDefined();
            }
        }, 30000);
    });

    describe('Organization Module - Real API', () => {
        it('should get organization info from real API', async () => {
            const organization = await client.organization.get();

            expect(organization).toBeDefined();
            expect(organization.type).toBe('Organization');
            expect(organization.id).toBeDefined();
            expect(organization.attributes).toBeDefined();
            
            // Organization should always have a name
            expect(organization.attributes?.name).toBeDefined();
            expect(typeof organization.attributes.name).toBe('string');
        }, 30000);
    });

    describe('Event Periods Module - Real API', () => {
        it('should get event periods from real API', async () => {
            const result = await client.eventPeriods.getAll();

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);

            // If there are event periods, verify structure
            if (result.data.length > 0) {
                const period = result.data[0];
                expect(period.type).toBe('EventPeriod');
                expect(period.id).toBeDefined();
            }
        }, 30000);
    });
});



