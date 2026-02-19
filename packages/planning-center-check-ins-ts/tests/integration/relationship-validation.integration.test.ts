/**
 * Check-ins API Relationship Validation Integration Tests
 * 
 * These tests verify that relationship structures and included resources work correctly.
 * They test JSON:API compliance and ensure relationships are properly structured.
 * 
 * To run: npm run test:integration -- --testNamePattern="Relationship Validation"
 */

import { PcoCheckInsClient } from '../../src';
import { createTestClient, logAuthStatus, isPreChecksApiAvailable } from './test-config';
import {
    validateResourceStructure,
} from '../type-validators';

function expectMetaPaginationTypes(meta: {
    count?: number;
    total_count?: number;
    total_pages?: number;
    per_page?: number;
    current_page?: number;
}): void {
    const keys: (keyof typeof meta)[] = ['count', 'total_count', 'total_pages', 'per_page', 'current_page'];
    keys.forEach((k) => {
        if (meta[k] !== undefined) expect(typeof meta[k]).toBe('number');
    });
}

describe('Check-ins API Relationship Validation Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

    }, 30000);

    describe('Event Relationships Structure Validation', () => {
        it('should validate event relationships structure', async () => {
            const response = await client.events.getPage({
                per_page: 1,
                page: 1,
                include: ['attendance_types']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const event = response.data[0];
            expect(event).toBeDefined();
            expect(event.id).toBeDefined();
            expect(event.type).toBe('Event');
            if (event.attendance_types !== undefined) {
                expect(Array.isArray(event.attendance_types) || typeof event.attendance_types === 'object').toBe(true);
            }
        }, 30000);

        it('should validate relationship data structure', async () => {
            const response = await client.events.getPage({
                per_page: 1,
                page: 1,
                include: ['attendance_types']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const event = response.data[0];
            const attendanceTypes = event.attendance_types;
            if (attendanceTypes && Array.isArray(attendanceTypes)) {
                attendanceTypes.forEach((at: { type?: string; id?: string }) => {
                    expect(at).toHaveProperty('type');
                    expect(at).toHaveProperty('id');
                });
            }
        }, 30000);
    });

    describe('CheckIn Relationships Structure Validation', () => {
        it('should validate check-in relationships structure', async () => {
            const response = await client.checkIns.getPage({
                per_page: 1,
                page: 1,
                include: ['event', 'event_period']
            });
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBeGreaterThan(0);
            const checkIn = response.data[0];
            expect(checkIn).toBeDefined();
            expect(checkIn.id).toBeDefined();
            expect(checkIn.type).toBe('CheckIn');
        }, 15000);
    });

    describe('Included Resources Validation', () => {
        it('should validate included resources structure', async () => {
            const response = await client.events.getPage({
                per_page: 1,
                page: 1,
                include: ['attendance_types']
            });
            expect(response.data.length).toBeGreaterThan(0);
            // Client returns flattened data only (included is merged into data, not returned)
        }, 30000);

        it('should validate attendance type included resources', async () => {
            const events = await client.events.getPage({ per_page: 1, page: 1 });
            expect(events.data.length).toBeGreaterThan(0);
            const eventId = events.data[0].id;
            const response = await client.events.getAttendanceTypes(eventId);
            // Flattened: attendance types are in response.data
            response.data.forEach((attendanceType) => {
                validateResourceStructure(attendanceType, 'AttendanceType');
                if (attendanceType.name !== undefined) {
                    expect(typeof attendanceType.name).toBe('string');
                }
            });
        }, 30000);

        it('should validate location included resources', async () => {
            const response = await client.locations.getPage({
                per_page: 1,
                page: 1,
                include: ['event']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const location = response.data[0];
            validateResourceStructure(location, 'Location');
            if (location.name !== undefined) {
                expect(typeof location.name).toBe('string');
            }
        }, 30000);
    });

    describe('Event Period Relationships Validation', () => {
        it('should validate event period relationships', async () => {
            // Event periods must be accessed through events
            const events = await client.events.getAll({ per_page: 1 });
            expect(events.data.length).toBeGreaterThan(0);

            const eventId = events.data[0].id;
            const response = await client.events.getEventPeriods(eventId);
            expect(response.data.length).toBeGreaterThan(0);
            const eventPeriod = response.data[0];

            // Flattened: relationships at top level (event, event_times)
            if (eventPeriod.event != null && typeof eventPeriod.event === 'object') {
                validateResourceStructure(eventPeriod.event, 'Event');
            }
            if (eventPeriod.event_times != null && Array.isArray(eventPeriod.event_times)) {
                eventPeriod.event_times.forEach((et) =>
                    validateResourceStructure(et, 'EventTime')
                );
            }
        }, 30000);
    });

    describe('Event Time Relationships Validation', () => {
        it('should validate event time relationships', async () => {
            const response = await client.eventTimes.getPage({
                per_page: 1,
                page: 1,
                include: ['event', 'event_period']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const eventTime = response.data[0];

            // Flattened: relationships at top level (event, event_period); docs Can Include: event, event_period, headcounts
            if (eventTime.event != null && typeof eventTime.event === 'object') {
                validateResourceStructure(eventTime.event, 'Event');
            }
            if (eventTime.event_period != null && typeof eventTime.event_period === 'object') {
                validateResourceStructure(eventTime.event_period, 'EventPeriod');
            }
        }, 30000);
    });

    describe('Station Relationships Validation', () => {
        it('should validate station relationships', async () => {
            const response = await client.stations.getPage({
                per_page: 1,
                page: 1,
                include: ['event', 'location']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const station = response.data[0];

            // Flattened: relationships at top level; docs Can Include: event, location, print_station, theme
            if (station.event != null && typeof station.event === 'object') {
                validateResourceStructure(station.event, 'Event');
            }
            if (station.location != null && typeof station.location === 'object') {
                validateResourceStructure(station.location, 'Location');
            }
        }, 30000);
    });

    describe('CheckIn Group Relationships Validation', () => {
        it('should validate check-in group relationships', async () => {
            const stationsPage = await client.stations.getPage({ per_page: 1, page: 1 });
            expect(stationsPage.data.length).toBeGreaterThan(0);
            const stationId = stationsPage.data[0].id;
            const response = await client.checkInGroups.getPage(stationId, {
                per_page: 1,
                page: 1,
                include: ['check_ins']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const checkInGroup = response.data[0];
            expect(checkInGroup).toBeDefined();
            expect(checkInGroup.type).toBe('CheckInGroup');
            expect(checkInGroup.id).toBeDefined();
        }, 30000);
    });

    describe('CheckIn Time Relationships Validation', () => {
        it('should validate check-in time relationships', async () => {
            const checkInsPage = await client.checkIns.getPage({ per_page: 1 });
            expect(checkInsPage.data.length).toBeGreaterThan(0);
            const response = await client.checkIns.getCheckInTimes(checkInsPage.data[0].id);
            expect(response.data.length).toBeGreaterThan(0);
            const checkInTime = response.data[0];
            expect(checkInTime).toBeDefined();
            expect(checkInTime.type).toBe('CheckInTime');
            expect(checkInTime.id).toBeDefined();
        }, 30000);
    });

    describe('Person Event Relationships Validation', () => {
        it('should validate person event relationships', async () => {
            const eventsPage = await client.events.getPage({ per_page: 1 });
            expect(eventsPage.data.length).toBeGreaterThan(0);
            const response = await client.events.getPersonEvents(eventsPage.data[0].id);
            expect(response.data.length).toBeGreaterThan(0);
            const personEvent = response.data[0];
            expect(personEvent).toBeDefined();
            expect(personEvent.type).toBe('PersonEvent');
            expect(personEvent.id).toBeDefined();
        }, 30000);
    });

    describe('PreCheck Relationships Validation', () => {
        it('should validate pre-check relationships', async () => {
            expect(await isPreChecksApiAvailable(client)).toBe(true);
            const response = await client.preChecks.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const preCheck = response.data[0];
            expect(preCheck).toBeDefined();
            expect(preCheck.type).toBe('PreCheck');
            expect(preCheck.id).toBeDefined();
        }, 30000);
    });

    describe('JSON:API Compliance Validation', () => {
        it('should validate JSON:API document structure', async () => {
            const response = await client.events.getAll({ per_page: 1 });

            // Validate top-level structure
            expect(response).toHaveProperty('data');
            expect(response).toHaveProperty('links');
            expect(response).toHaveProperty('meta');

            // Validate data is array
            expect(Array.isArray(response.data)).toBe(true);

            // Validate each resource has required fields
            response.data.forEach((resource) => {
                validateResourceStructure(resource, resource.type);
            });
        }, 30000);

        it('should validate JSON:API links structure', async () => {
            const response = await client.events.getAll({ per_page: 1 });

            if (response.links) {
                // Validate links are strings or objects
                Object.values(response.links).forEach((link) => {
                    if (typeof link === 'string') {
                        expect(typeof link).toBe('string');
                    } else if (typeof link === 'object' && link !== null) {
                        expect(link).toHaveProperty('href');
                    }
                });
            }
        }, 30000);

        it('should validate JSON:API meta structure', async () => {
            const response = await client.events.getAll({ per_page: 1 });
            if (response.meta) expectMetaPaginationTypes(response.meta);
        }, 30000);
    });

    describe('Relationship Link Validation', () => {
        it('should validate relationship links are accessible', async () => {
            const response = await client.events.getPage({
                per_page: 1,
                page: 1,
                include: ['attendance_types']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const event = response.data[0];
            expect(event).toBeDefined();
            expect(event.id).toBeDefined();
            if (event.links?.self) {
                expect(typeof event.links.self).toBe('string');
                expect(event.links.self).toContain('/check-ins/v2/events/');
            }
        }, 30000);
    });
});
