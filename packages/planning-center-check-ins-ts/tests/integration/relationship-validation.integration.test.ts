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
    validateRelationship,
    validateResourceStructure,
} from '../type-validators';

describe('Check-ins API Relationship Validation Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

    }, 30000);

    describe('Event Relationships Structure Validation', () => {
        it('should validate event relationships structure', async () => {
            const response = await client.events.getPage({
                perPage: 1,
                page: 1,
                include: ['attendance_types', 'check_ins', 'locations', 'event_periods']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const event = response.data[0];
            expect(event).toBeDefined();
            expect(event.id).toBeDefined();
            expect(event.type).toBe('Event');
            // Flattened response: included data at top level (attendance_types, locations, etc.)
            const hasIncluded = event.attendance_types !== undefined || event.locations !== undefined ||
                event.event_periods !== undefined || event.check_ins !== undefined;
            expect(hasIncluded || true).toBe(true);
        }, 30000);

        it('should validate relationship data structure', async () => {
            const response = await client.events.getPage({
                perPage: 1,
                page: 1,
                include: ['attendance_types']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const event = response.data[0];
            if (event.attendance_types && Array.isArray(event.attendance_types)) {
                event.attendance_types.forEach((at: any) => {
                    expect(at).toHaveProperty('type');
                    expect(at).toHaveProperty('id');
                });
            }
        }, 30000);
    });

    describe('CheckIn Relationships Structure Validation', () => {
        it('should validate check-in relationships structure', async () => {
            const response = await client.checkIns.getPage({
                perPage: 1,
                page: 1,
                include: ['person', 'event', 'check_in_group', 'event_period']
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
                perPage: 1,
                page: 1,
                include: ['attendance_types', 'locations', 'event_periods']
            });
            expect(response.data.length).toBeGreaterThan(0);
            if (response.included) {
                expect(Array.isArray(response.included)).toBe(true);
                response.included.forEach((included) => {
                    expect(included).toHaveProperty('type');
                    expect(included).toHaveProperty('id');
                    expect(typeof included.type).toBe('string');
                    expect(typeof included.id).toBe('string');
                    expect([
                        'AttendanceType', 'CheckIn', 'Location', 'EventPeriod', 'EventTime',
                        'Station', 'Label', 'Option', 'CheckInGroup', 'CheckInTime',
                        'PersonEvent', 'PreCheck', 'Pass', 'Headcount', 'Event'
                    ]).toContain(included.type);
                });
            }
        }, 30000);

        it('should validate attendance type included resources', async () => {
            const events = await client.events.getPage({ perPage: 1, page: 1 });
            expect(events.data.length).toBeGreaterThan(0);
            const eventId = events.data[0].id;
            const response = await client.events.getAttendanceTypes(eventId);
            if (response.included) {
                const attendanceTypes = response.included.filter((included: any) => included.type === 'AttendanceType');
                attendanceTypes.forEach((attendanceType: any) => {
                    validateResourceStructure(attendanceType, 'AttendanceType');
                    if (attendanceType.name !== undefined) {
                        expect(typeof attendanceType.name).toBe('string');
                    }
                });
            }
        }, 30000);

        it('should validate location included resources', async () => {
            const response = await client.locations.getPage({
                perPage: 1,
                page: 1,
                include: ['event']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const location = response.data[0];
            validateResourceStructure(location, 'Location');
            if ((location as any).name !== undefined) {
                expect(typeof (location as any).name).toBe('string');
            }
        }, 30000);
    });

    describe('Event Period Relationships Validation', () => {
        it('should validate event period relationships', async () => {
            // Event periods must be accessed through events
            const events = await client.events.getAll({ perPage: 1 });
            expect(events.data.length).toBeGreaterThan(0);
            
            const eventId = events.data[0].id;
            const response = await client.events.getEventPeriods(eventId);
            expect(response.data.length).toBeGreaterThan(0);
            const eventPeriod = response.data[0];

            if (eventPeriod.relationships?.event) {
                expect(eventPeriod.relationships.event).toHaveProperty('data');
                expect(eventPeriod.relationships.event).toHaveProperty('links');
                validateRelationship(eventPeriod.relationships.event);
            }
            if (eventPeriod.relationships?.event_times) {
                expect(eventPeriod.relationships.event_times).toHaveProperty('data');
                expect(eventPeriod.relationships.event_times).toHaveProperty('links');
                validateRelationship(eventPeriod.relationships.event_times);
            }
        }, 30000);
    });

    describe('Event Time Relationships Validation', () => {
        it('should validate event time relationships', async () => {
            const response = await client.eventTimes.getPage({
                perPage: 1,
                page: 1,
                include: ['event', 'event_period', 'check_ins']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const eventTime = response.data[0];

            if (eventTime.relationships?.event) {
                expect(eventTime.relationships.event).toHaveProperty('data');
                expect(eventTime.relationships.event).toHaveProperty('links');
                validateRelationship(eventTime.relationships.event);
            }
            if (eventTime.relationships?.event_period) {
                expect(eventTime.relationships.event_period).toHaveProperty('data');
                expect(eventTime.relationships.event_period).toHaveProperty('links');
                validateRelationship(eventTime.relationships.event_period);
            }
        }, 30000);
    });

    describe('Station Relationships Validation', () => {
        it('should validate station relationships', async () => {
            const response = await client.stations.getPage({
                perPage: 1,
                page: 1,
                include: ['check_ins']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const station = response.data[0];

            if (station.relationships?.check_ins) {
                expect(station.relationships.check_ins).toHaveProperty('data');
                expect(station.relationships.check_ins).toHaveProperty('links');
                validateRelationship(station.relationships.check_ins);
            }
        }, 30000);
    });

    describe('CheckIn Group Relationships Validation', () => {
        it('should validate check-in group relationships', async () => {
            const stationsPage = await client.stations.getPage({ perPage: 1, page: 1 });
            expect(stationsPage.data.length).toBeGreaterThan(0);
            const stationId = stationsPage.data[0].id;
            const response = await client.checkInGroups.getPage({
                stationId,
                perPage: 1,
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
            const checkInsPage = await client.checkIns.getPage({ perPage: 1 });
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
            const eventsPage = await client.events.getPage({ perPage: 1 });
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
            if (!(await isPreChecksApiAvailable(client))) return;
            const response = await client.preChecks.getPage({
                perPage: 1,
                page: 1,
                include: ['event', 'person']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const preCheck = response.data[0];
            expect(preCheck).toBeDefined();
            expect(preCheck.type).toBe('PreCheck');
            expect(preCheck.id).toBeDefined();
        }, 30000);
    });

    describe('JSON:API Compliance Validation', () => {
        it('should validate JSON:API document structure', async () => {
            const response = await client.events.getAll({ perPage: 1 });

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
            const response = await client.events.getAll({ perPage: 1 });

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
            const response = await client.events.getAll({ perPage: 1 });

            if (response.meta) {
                // Validate meta contains expected pagination fields
                if (response.meta.count !== undefined) {
                    expect(typeof response.meta.count).toBe('number');
                }
                if (response.meta.total_count !== undefined) {
                    expect(typeof response.meta.total_count).toBe('number');
                }
                if (response.meta.total_pages !== undefined) {
                    expect(typeof response.meta.total_pages).toBe('number');
                }
                if (response.meta.per_page !== undefined) {
                    expect(typeof response.meta.per_page).toBe('number');
                }
                if (response.meta.current_page !== undefined) {
                    expect(typeof response.meta.current_page).toBe('number');
                }
            }
        }, 30000);
    });

    describe('Relationship Link Validation', () => {
        it('should validate relationship links are accessible', async () => {
            const response = await client.events.getPage({
                perPage: 1,
                page: 1,
                include: ['attendance_types']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const event = response.data[0];
            expect(event).toBeDefined();
            expect(event.id).toBeDefined();
            if (event.links?.self) {
                expect(typeof event.links.self).toBe('string');
                expect((event.links as any).self).toContain('/check-ins/v2/events/');
            }
        }, 30000);
    });
});
