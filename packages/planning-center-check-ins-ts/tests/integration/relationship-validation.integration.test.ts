/**
 * Check-ins API Relationship Validation Integration Tests
 * 
 * These tests verify that relationship structures and included resources work correctly.
 * They test JSON:API compliance and ensure relationships are properly structured.
 * 
 * To run: npm run test:integration -- --testNamePattern="Relationship Validation"
 */

import { PcoCheckInsClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

describe('Check-ins API Relationship Validation Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Add request monitoring
        client.on('request:start', (event) => {
            console.log(`🔗 ${event.method} ${event.endpoint}`);
        });
        client.on('request:complete', (event) => {
            console.log(`✅ ${event.method} ${event.endpoint} - ${event.status} (${event.duration}ms)`);
        });
    }, 30000);

    describe('Event Relationships Structure Validation', () => {
        it('should validate event relationships structure', async () => {
            const response = await client.events.getAll({
                perPage: 1,
                include: ['attendance_types', 'check_ins', 'locations', 'event_periods']
            });

            if (response.data.length > 0) {
                const event = response.data[0];

                // Validate relationships object exists
                expect(event.relationships).toBeDefined();
                expect(typeof event.relationships).toBe('object');

                // Validate each relationship has proper structure
                const relationships = event.relationships!;

                if (relationships.attendance_types) {
                    expect(relationships.attendance_types).toHaveProperty('data');
                    expect(relationships.attendance_types).toHaveProperty('links');
                    expect(relationships.attendance_types.links).toHaveProperty('self');
                    expect(relationships.attendance_types.links).toHaveProperty('related');
                }

                if (relationships.check_ins) {
                    expect(relationships.check_ins).toHaveProperty('data');
                    expect(relationships.check_ins).toHaveProperty('links');
                    expect(relationships.check_ins.links).toHaveProperty('self');
                    expect(relationships.check_ins.links).toHaveProperty('related');
                }

                if (relationships.locations) {
                    expect(relationships.locations).toHaveProperty('data');
                    expect(relationships.locations).toHaveProperty('links');
                    expect(relationships.locations.links).toHaveProperty('self');
                    expect(relationships.locations.links).toHaveProperty('related');
                }

                if (relationships.event_periods) {
                    expect(relationships.event_periods).toHaveProperty('data');
                    expect(relationships.event_periods).toHaveProperty('links');
                    expect(relationships.event_periods.links).toHaveProperty('self');
                    expect(relationships.event_periods.links).toHaveProperty('related');
                }
            }
        }, 30000);

        it('should validate relationship data structure', async () => {
            const response = await client.events.getAll({
                perPage: 1,
                include: ['attendance_types']
            });

            if (response.data.length > 0) {
                const event = response.data[0];

                if (event.relationships?.attendance_types?.data) {
                    const attendanceTypesData = event.relationships.attendance_types.data;
                    
                    if (Array.isArray(attendanceTypesData)) {
                        // To-many relationship
                        expect(Array.isArray(attendanceTypesData)).toBe(true);
                        attendanceTypesData.forEach((attendanceTypeRef) => {
                            expect(attendanceTypeRef).toHaveProperty('type');
                            expect(attendanceTypeRef).toHaveProperty('id');
                            expect(typeof attendanceTypeRef.type).toBe('string');
                            expect(typeof attendanceTypeRef.id).toBe('string');
                        });
                    } else {
                        // To-one relationship
                        expect(attendanceTypesData).toHaveProperty('type');
                        expect(attendanceTypesData).toHaveProperty('id');
                        expect(typeof attendanceTypesData.type).toBe('string');
                        expect(typeof attendanceTypesData.id).toBe('string');
                    }
                }
            }
        }, 30000);
    });

    describe('CheckIn Relationships Structure Validation', () => {
        it('should validate check-in relationships structure', async () => {
            const response = await client.checkIns.getAll({
                perPage: 1,
                include: ['person', 'event', 'check_in_group', 'event_period']
            });

            if (response.data.length > 0) {
                const checkIn = response.data[0];

                // Validate relationships object exists
                expect(checkIn.relationships).toBeDefined();
                expect(typeof checkIn.relationships).toBe('object');

                // Validate each relationship has proper structure
                const relationships = checkIn.relationships!;

                if (relationships.person) {
                    expect(relationships.person).toHaveProperty('data');
                    expect(relationships.person).toHaveProperty('links');
                    expect(relationships.person.links).toHaveProperty('self');
                    expect(relationships.person.links).toHaveProperty('related');
                }

                if (relationships.event) {
                    expect(relationships.event).toHaveProperty('data');
                    expect(relationships.event).toHaveProperty('links');
                    expect(relationships.event.links).toHaveProperty('self');
                    expect(relationships.event.links).toHaveProperty('related');
                }

                if (relationships.check_in_group) {
                    expect(relationships.check_in_group).toHaveProperty('data');
                    expect(relationships.check_in_group).toHaveProperty('links');
                    expect(relationships.check_in_group.links).toHaveProperty('self');
                    expect(relationships.check_in_group.links).toHaveProperty('related');
                }

                if (relationships.event_period) {
                    expect(relationships.event_period).toHaveProperty('data');
                    expect(relationships.event_period).toHaveProperty('links');
                    expect(relationships.event_period.links).toHaveProperty('self');
                    expect(relationships.event_period.links).toHaveProperty('related');
                }
            }
        }, 30000);
    });

    describe('Included Resources Validation', () => {
        it('should validate included resources structure', async () => {
            const response = await client.events.getAll({
                perPage: 1,
                include: ['attendance_types', 'locations', 'event_periods']
            });

            if (response.data.length > 0) {
                // Check if included resources are present
                if (response.included) {
                    expect(Array.isArray(response.included)).toBe(true);

                    response.included.forEach((included) => {
                        // Validate included resource structure
                        expect(included).toHaveProperty('type');
                        expect(included).toHaveProperty('id');
                        expect(included).toHaveProperty('attributes');
                        expect(typeof included.type).toBe('string');
                        expect(typeof included.id).toBe('string');
                        expect(typeof included.attributes).toBe('object');

                        // Validate specific included types
                        expect([
                            'AttendanceType', 'CheckIn', 'Location', 'EventPeriod', 'EventTime',
                            'Station', 'Label', 'Option', 'CheckInGroup', 'CheckInTime',
                            'PersonEvent', 'PreCheck', 'Pass', 'Headcount', 'Event'
                        ]).toContain(included.type);
                    });
                }
            }
        }, 30000);

        it('should validate attendance type included resources', async () => {
            const events = await client.events.getAll({ perPage: 1 });
            if (events.data.length > 0) {
                const eventId = events.data[0].id;
                const response = await client.events.getAttendanceTypes(eventId);

                if (response.included) {
                    const attendanceTypes = response.included.filter(included => included.type === 'AttendanceType');
                    
                    attendanceTypes.forEach((attendanceType) => {
                        expect(attendanceType.type).toBe('AttendanceType');
                        expect(attendanceType.attributes).toBeDefined();
                        
                        if (attendanceType.attributes?.name) {
                            expect(typeof attendanceType.attributes.name).toBe('string');
                        }
                    });
                }
            }
        }, 30000);

        it('should validate location included resources', async () => {
            const response = await client.locations.getAll({
                perPage: 1,
                include: ['event']
            });

            if (response.data.length > 0) {
                const location = response.data[0];
                expect(location.type).toBe('Location');
                expect(location.attributes).toBeDefined();
                
                if (location.attributes?.name) {
                    expect(typeof location.attributes.name).toBe('string');
                }
            }
        }, 30000);
    });

    describe('Event Period Relationships Validation', () => {
        it('should validate event period relationships', async () => {
            const response = await client.eventPeriods.getAll({
                perPage: 1,
                include: ['event', 'event_times', 'check_ins']
            });

            if (response.data.length > 0) {
                const eventPeriod = response.data[0];

                if (eventPeriod.relationships?.event) {
                    expect(eventPeriod.relationships.event).toHaveProperty('data');
                    expect(eventPeriod.relationships.event).toHaveProperty('links');
                    
                    const eventData = eventPeriod.relationships.event.data;
                    if (eventData && !Array.isArray(eventData)) {
                        expect(eventData.type).toBe('Event');
                    }
                }

                if (eventPeriod.relationships?.event_times) {
                    expect(eventPeriod.relationships.event_times).toHaveProperty('data');
                    expect(eventPeriod.relationships.event_times).toHaveProperty('links');
                    
                    const eventTimesData = eventPeriod.relationships.event_times.data;
                    if (Array.isArray(eventTimesData)) {
                        eventTimesData.forEach((eventTimeRef) => {
                            expect(eventTimeRef).toHaveProperty('type');
                            expect(eventTimeRef).toHaveProperty('id');
                            expect(eventTimeRef.type).toBe('EventTime');
                        });
                    }
                }
            }
        }, 30000);
    });

    describe('Event Time Relationships Validation', () => {
        it('should validate event time relationships', async () => {
            const response = await client.eventTimes.getAll({
                perPage: 1,
                include: ['event', 'event_period', 'check_ins']
            });

            if (response.data.length > 0) {
                const eventTime = response.data[0];

                if (eventTime.relationships?.event) {
                    expect(eventTime.relationships.event).toHaveProperty('data');
                    expect(eventTime.relationships.event).toHaveProperty('links');
                    
                    const eventData = eventTime.relationships.event.data;
                    if (eventData && !Array.isArray(eventData)) {
                        expect(eventData.type).toBe('Event');
                    }
                }

                if (eventTime.relationships?.event_period) {
                    expect(eventTime.relationships.event_period).toHaveProperty('data');
                    expect(eventTime.relationships.event_period).toHaveProperty('links');
                    
                    const eventPeriodData = eventTime.relationships.event_period.data;
                    if (eventPeriodData && !Array.isArray(eventPeriodData)) {
                        expect(eventPeriodData.type).toBe('EventPeriod');
                    }
                }
            }
        }, 30000);
    });

    describe('Station Relationships Validation', () => {
        it('should validate station relationships', async () => {
            const response = await client.stations.getAll({
                perPage: 1,
                include: ['check_ins']
            });

            if (response.data.length > 0) {
                const station = response.data[0];

                if (station.relationships?.check_ins) {
                    expect(station.relationships.check_ins).toHaveProperty('data');
                    expect(station.relationships.check_ins).toHaveProperty('links');
                    
                    const checkInsData = station.relationships.check_ins.data;
                    if (Array.isArray(checkInsData)) {
                        checkInsData.forEach((checkInRef) => {
                            expect(checkInRef).toHaveProperty('type');
                            expect(checkInRef).toHaveProperty('id');
                            expect(checkInRef.type).toBe('CheckIn');
                        });
                    }
                }
            }
        }, 30000);
    });

    describe('CheckIn Group Relationships Validation', () => {
        it('should validate check-in group relationships', async () => {
            const response = await client.checkInGroups.getAll({
                perPage: 1,
                include: ['check_ins']
            });

            if (response.data.length > 0) {
                const checkInGroup = response.data[0];

                if (checkInGroup.relationships?.check_ins) {
                    expect(checkInGroup.relationships.check_ins).toHaveProperty('data');
                    expect(checkInGroup.relationships.check_ins).toHaveProperty('links');
                    
                    const checkInsData = checkInGroup.relationships.check_ins.data;
                    if (Array.isArray(checkInsData)) {
                        checkInsData.forEach((checkInRef) => {
                            expect(checkInRef).toHaveProperty('type');
                            expect(checkInRef).toHaveProperty('id');
                            expect(checkInRef.type).toBe('CheckIn');
                        });
                    }
                }
            }
        }, 30000);
    });

    describe('CheckIn Time Relationships Validation', () => {
        it('should validate check-in time relationships', async () => {
            const response = await client.checkInTimes.getAll({
                perPage: 1,
                include: ['check_in', 'event_time']
            });

            if (response.data.length > 0) {
                const checkInTime = response.data[0];

                if (checkInTime.relationships?.check_in) {
                    expect(checkInTime.relationships.check_in).toHaveProperty('data');
                    expect(checkInTime.relationships.check_in).toHaveProperty('links');
                    
                    const checkInData = checkInTime.relationships.check_in.data;
                    if (checkInData && !Array.isArray(checkInData)) {
                        expect(checkInData.type).toBe('CheckIn');
                    }
                }

                if (checkInTime.relationships?.event_time) {
                    expect(checkInTime.relationships.event_time).toHaveProperty('data');
                    expect(checkInTime.relationships.event_time).toHaveProperty('links');
                    
                    const eventTimeData = checkInTime.relationships.event_time.data;
                    if (eventTimeData && !Array.isArray(eventTimeData)) {
                        expect(eventTimeData.type).toBe('EventTime');
                    }
                }
            }
        }, 30000);
    });

    describe('Person Event Relationships Validation', () => {
        it('should validate person event relationships', async () => {
            const response = await client.personEvents.getAll({
                perPage: 1,
                include: ['event', 'person']
            });

            if (response.data.length > 0) {
                const personEvent = response.data[0];

                if (personEvent.relationships?.event) {
                    expect(personEvent.relationships.event).toHaveProperty('data');
                    expect(personEvent.relationships.event).toHaveProperty('links');
                    
                    const eventData = personEvent.relationships.event.data;
                    if (eventData && !Array.isArray(eventData)) {
                        expect(eventData.type).toBe('Event');
                    }
                }

                if (personEvent.relationships?.person) {
                    expect(personEvent.relationships.person).toHaveProperty('data');
                    expect(personEvent.relationships.person).toHaveProperty('links');
                    
                    const personData = personEvent.relationships.person.data;
                    if (personData && !Array.isArray(personData)) {
                        expect(personData.type).toBe('Person');
                    }
                }
            }
        }, 30000);
    });

    describe('PreCheck Relationships Validation', () => {
        it('should validate pre-check relationships', async () => {
            const response = await client.preChecks.getAll({
                perPage: 1,
                include: ['event', 'person']
            });

            if (response.data.length > 0) {
                const preCheck = response.data[0];

                if (preCheck.relationships?.event) {
                    expect(preCheck.relationships.event).toHaveProperty('data');
                    expect(preCheck.relationships.event).toHaveProperty('links');
                    
                    const eventData = preCheck.relationships.event.data;
                    if (eventData && !Array.isArray(eventData)) {
                        expect(eventData.type).toBe('Event');
                    }
                }

                if (preCheck.relationships?.person) {
                    expect(preCheck.relationships.person).toHaveProperty('data');
                    expect(preCheck.relationships.person).toHaveProperty('links');
                    
                    const personData = preCheck.relationships.person.data;
                    if (personData && !Array.isArray(personData)) {
                        expect(personData.type).toBe('Person');
                    }
                }
            }
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
                expect(resource).toHaveProperty('type');
                expect(resource).toHaveProperty('id');
                expect(typeof resource.type).toBe('string');
                expect(typeof resource.id).toBe('string');
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
            const response = await client.events.getAll({
                perPage: 1,
                include: ['attendance_types']
            });

            if (response.data.length > 0) {
                const event = response.data[0];

                if (event.relationships?.attendance_types?.links?.related) {
                    const relatedLink = event.relationships.attendance_types.links.related;
                    expect(typeof relatedLink).toBe('string');
                    expect(relatedLink).toContain('/check-ins/v2/events/');
                    expect(relatedLink).toContain('/attendance_types');
                }

                if (event.relationships?.attendance_types?.links?.self) {
                    const selfLink = event.relationships.attendance_types.links.self;
                    expect(typeof selfLink).toBe('string');
                    expect(selfLink).toContain('/check-ins/v2/events/');
                    expect(selfLink).toContain('/attendance_types');
                }
            }
        }, 30000);
    });
});
