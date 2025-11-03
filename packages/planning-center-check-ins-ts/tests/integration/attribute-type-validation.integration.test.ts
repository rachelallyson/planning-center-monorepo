/**
 * Check-ins API Attribute Type Validation Integration Tests
 * 
 * These tests verify that TypeScript attribute types match actual Check-ins API responses.
 * They make real API calls and validate that the response data matches the expected types.
 * 
 * To run: npm run test:integration -- --testNamePattern="Attribute Type Validation"
 */

import { PcoCheckInsClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

describe('Check-ins API Attribute Type Validation Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Add request monitoring
        client.on('request:start', (event) => {
            console.log(`🔍 ${event.method} ${event.endpoint}`);
        });
        client.on('request:complete', (event) => {
            console.log(`✅ ${event.method} ${event.endpoint} - ${event.status} (${event.duration}ms)`);
        });
    }, 30000);

    describe('Event Attributes Type Validation', () => {
        it('should validate EventAttributes types match API response', async () => {
            const response = await client.events.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const event = response.data[0];

                // Validate required fields
                expect(event.id).toBeDefined();
                expect(typeof event.id).toBe('string');
                expect(event.type).toBe('Event');

                // Validate optional string attributes
                if (event.attributes?.name !== undefined) {
                    expect(typeof event.attributes.name).toBe('string');
                }
                if (event.attributes?.frequency !== undefined) {
                    expect(typeof event.attributes.frequency).toBe('string');
                }
                if (event.attributes?.integration_key !== undefined) {
                    expect(typeof event.attributes.integration_key).toBe('string');
                }
                if (event.attributes?.app_source !== undefined) {
                    expect(typeof event.attributes.app_source).toBe('string');
                }
                if (event.attributes?.archived_at !== undefined) {
                    expect(typeof event.attributes.archived_at).toBe('string');
                }

                // Validate boolean attributes
                if (event.attributes?.enable_services_integration !== undefined) {
                    expect(typeof event.attributes.enable_services_integration).toBe('boolean');
                }
                if (event.attributes?.location_times_enabled !== undefined) {
                    expect(typeof event.attributes.location_times_enabled).toBe('boolean');
                }
                if (event.attributes?.pre_select_enabled !== undefined) {
                    expect(typeof event.attributes.pre_select_enabled).toBe('boolean');
                }

                // Validate date attributes
                if (event.attributes?.created_at !== undefined) {
                    expect(typeof event.attributes.created_at).toBe('string');
                    expect(new Date(event.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (event.attributes?.updated_at !== undefined) {
                    expect(typeof event.attributes.updated_at).toBe('string');
                    expect(new Date(event.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);

        it('should validate EventRelationships structure', async () => {
            const response = await client.events.getAll({ 
                perPage: 1,
                include: ['attendance_types', 'check_ins', 'locations', 'event_periods']
            });
            if (response.data.length > 0) {
                const event = response.data[0];

                // Validate relationships structure
                if (event.relationships?.attendance_types) {
                    expect(event.relationships.attendance_types).toHaveProperty('data');
                    expect(event.relationships.attendance_types).toHaveProperty('links');
                }
                if (event.relationships?.check_ins) {
                    expect(event.relationships.check_ins).toHaveProperty('data');
                    expect(event.relationships.check_ins).toHaveProperty('links');
                }
                if (event.relationships?.locations) {
                    expect(event.relationships.locations).toHaveProperty('data');
                    expect(event.relationships.locations).toHaveProperty('links');
                }
                if (event.relationships?.event_periods) {
                    expect(event.relationships.event_periods).toHaveProperty('data');
                    expect(event.relationships.event_periods).toHaveProperty('links');
                }
            }
        }, 30000);
    });

    describe('CheckIn Attributes Type Validation', () => {
        it('should validate CheckInAttributes types match API response', async () => {
            const response = await client.checkIns.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const checkIn = response.data[0];

                // Validate required fields
                expect(checkIn.id).toBeDefined();
                expect(typeof checkIn.id).toBe('string');
                expect(checkIn.type).toBe('CheckIn');

                // Validate optional string attributes
                if (checkIn.attributes?.first_name !== undefined) {
                    expect(typeof checkIn.attributes.first_name).toBe('string');
                }
                if (checkIn.attributes?.last_name !== undefined) {
                    expect(typeof checkIn.attributes.last_name).toBe('string');
                }
                if (checkIn.attributes?.medical_notes !== undefined) {
                    expect(typeof checkIn.attributes.medical_notes).toBe('string');
                }
                if (checkIn.attributes?.security_code !== undefined) {
                    expect(typeof checkIn.attributes.security_code).toBe('string');
                }
                if (checkIn.attributes?.checked_out_at !== undefined) {
                    expect(typeof checkIn.attributes.checked_out_at).toBe('string');
                }
                if (checkIn.attributes?.confirmed_at !== undefined) {
                    expect(typeof checkIn.attributes.confirmed_at).toBe('string');
                }
                if (checkIn.attributes?.emergency_contact_name !== undefined) {
                    expect(typeof checkIn.attributes.emergency_contact_name).toBe('string');
                }
                if (checkIn.attributes?.emergency_contact_phone_number !== undefined) {
                    expect(typeof checkIn.attributes.emergency_contact_phone_number).toBe('string');
                }
                if (checkIn.attributes?.kind !== undefined) {
                    expect(typeof checkIn.attributes.kind).toBe('string');
                }

                // Validate number attributes
                if (checkIn.attributes?.number !== undefined) {
                    expect(typeof checkIn.attributes.number).toBe('number');
                }

                // Validate boolean attributes
                if (checkIn.attributes?.one_time_guest !== undefined) {
                    expect(typeof checkIn.attributes.one_time_guest).toBe('boolean');
                }

                // Validate date attributes
                if (checkIn.attributes?.created_at !== undefined) {
                    expect(typeof checkIn.attributes.created_at).toBe('string');
                    expect(new Date(checkIn.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (checkIn.attributes?.updated_at !== undefined) {
                    expect(typeof checkIn.attributes.updated_at).toBe('string');
                    expect(new Date(checkIn.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('Location Attributes Type Validation', () => {
        it('should validate LocationAttributes types match API response', async () => {
            const response = await client.locations.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const location = response.data[0];

                // Validate required fields
                expect(location.id).toBeDefined();
                expect(typeof location.id).toBe('string');
                expect(location.type).toBe('Location');

                // Validate optional string attributes
                if (location.attributes?.name !== undefined) {
                    expect(typeof location.attributes.name).toBe('string');
                }

                // Validate date attributes
                if (location.attributes?.created_at !== undefined) {
                    expect(typeof location.attributes.created_at).toBe('string');
                    expect(new Date(location.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (location.attributes?.updated_at !== undefined) {
                    expect(typeof location.attributes.updated_at).toBe('string');
                    expect(new Date(location.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('EventPeriod Attributes Type Validation', () => {
        it('should validate EventPeriodAttributes types match API response', async () => {
            const response = await client.eventPeriods.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const eventPeriod = response.data[0];

                // Validate required fields
                expect(eventPeriod.id).toBeDefined();
                expect(typeof eventPeriod.id).toBe('string');
                expect(eventPeriod.type).toBe('EventPeriod');

                // Validate optional string attributes
                if (eventPeriod.attributes?.starts_at !== undefined) {
                    expect(typeof eventPeriod.attributes.starts_at).toBe('string');
                    expect(new Date(eventPeriod.attributes.starts_at).getTime()).not.toBeNaN();
                }
                if (eventPeriod.attributes?.ends_at !== undefined) {
                    expect(typeof eventPeriod.attributes.ends_at).toBe('string');
                    expect(new Date(eventPeriod.attributes.ends_at).getTime()).not.toBeNaN();
                }

                // Validate date attributes
                if (eventPeriod.attributes?.created_at !== undefined) {
                    expect(typeof eventPeriod.attributes.created_at).toBe('string');
                    expect(new Date(eventPeriod.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (eventPeriod.attributes?.updated_at !== undefined) {
                    expect(typeof eventPeriod.attributes.updated_at).toBe('string');
                    expect(new Date(eventPeriod.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('EventTime Attributes Type Validation', () => {
        it('should validate EventTimeAttributes types match API response', async () => {
            const response = await client.eventTimes.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const eventTime = response.data[0];

                // Validate required fields
                expect(eventTime.id).toBeDefined();
                expect(typeof eventTime.id).toBe('string');
                expect(eventTime.type).toBe('EventTime');

                // Validate optional string attributes
                if (eventTime.attributes?.starts_at !== undefined) {
                    expect(typeof eventTime.attributes.starts_at).toBe('string');
                    expect(new Date(eventTime.attributes.starts_at).getTime()).not.toBeNaN();
                }
                if (eventTime.attributes?.ends_at !== undefined) {
                    expect(typeof eventTime.attributes.ends_at).toBe('string');
                    expect(new Date(eventTime.attributes.ends_at).getTime()).not.toBeNaN();
                }

                // Validate date attributes
                if (eventTime.attributes?.created_at !== undefined) {
                    expect(typeof eventTime.attributes.created_at).toBe('string');
                    expect(new Date(eventTime.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (eventTime.attributes?.updated_at !== undefined) {
                    expect(typeof eventTime.attributes.updated_at).toBe('string');
                    expect(new Date(eventTime.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('Station Attributes Type Validation', () => {
        it('should validate StationAttributes types match API response', async () => {
            const response = await client.stations.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const station = response.data[0];

                // Validate required fields
                expect(station.id).toBeDefined();
                expect(typeof station.id).toBe('string');
                expect(station.type).toBe('Station');

                // Validate optional string attributes
                if (station.attributes?.name !== undefined) {
                    expect(typeof station.attributes.name).toBe('string');
                }

                // Validate date attributes
                if (station.attributes?.created_at !== undefined) {
                    expect(typeof station.attributes.created_at).toBe('string');
                    expect(new Date(station.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (station.attributes?.updated_at !== undefined) {
                    expect(typeof station.attributes.updated_at).toBe('string');
                    expect(new Date(station.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('Label Attributes Type Validation', () => {
        it('should validate LabelAttributes types match API response', async () => {
            const response = await client.labels.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const label = response.data[0];

                // Validate required fields
                expect(label.id).toBeDefined();
                expect(typeof label.id).toBe('string');
                expect(label.type).toBe('Label');

                // Validate optional string attributes
                if (label.attributes?.name !== undefined) {
                    expect(typeof label.attributes.name).toBe('string');
                }

                // Validate date attributes
                if (label.attributes?.created_at !== undefined) {
                    expect(typeof label.attributes.created_at).toBe('string');
                    expect(new Date(label.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (label.attributes?.updated_at !== undefined) {
                    expect(typeof label.attributes.updated_at).toBe('string');
                    expect(new Date(label.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('Option Attributes Type Validation', () => {
        it('should validate OptionAttributes types match API response', async () => {
            const response = await client.options.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const option = response.data[0];

                // Validate required fields
                expect(option.id).toBeDefined();
                expect(typeof option.id).toBe('string');
                expect(option.type).toBe('Option');

                // Validate optional string attributes
                if (option.attributes?.name !== undefined) {
                    expect(typeof option.attributes.name).toBe('string');
                }

                // Validate date attributes
                if (option.attributes?.created_at !== undefined) {
                    expect(typeof option.attributes.created_at).toBe('string');
                    expect(new Date(option.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (option.attributes?.updated_at !== undefined) {
                    expect(typeof option.attributes.updated_at).toBe('string');
                    expect(new Date(option.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('CheckInGroup Attributes Type Validation', () => {
        it('should validate CheckInGroupAttributes types match API response', async () => {
            const response = await client.checkInGroups.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const checkInGroup = response.data[0];

                // Validate required fields
                expect(checkInGroup.id).toBeDefined();
                expect(typeof checkInGroup.id).toBe('string');
                expect(checkInGroup.type).toBe('CheckInGroup');

                // Validate optional string attributes
                if (checkInGroup.attributes?.name !== undefined) {
                    expect(typeof checkInGroup.attributes.name).toBe('string');
                }

                // Validate date attributes
                if (checkInGroup.attributes?.created_at !== undefined) {
                    expect(typeof checkInGroup.attributes.created_at).toBe('string');
                    expect(new Date(checkInGroup.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (checkInGroup.attributes?.updated_at !== undefined) {
                    expect(typeof checkInGroup.attributes.updated_at).toBe('string');
                    expect(new Date(checkInGroup.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('CheckInTime Attributes Type Validation', () => {
        it('should validate CheckInTimeAttributes types match API response', async () => {
            const response = await client.checkInTimes.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const checkInTime = response.data[0];

                // Validate required fields
                expect(checkInTime.id).toBeDefined();
                expect(typeof checkInTime.id).toBe('string');
                expect(checkInTime.type).toBe('CheckInTime');

                // Validate date attributes
                if (checkInTime.attributes?.created_at !== undefined) {
                    expect(typeof checkInTime.attributes.created_at).toBe('string');
                    expect(new Date(checkInTime.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (checkInTime.attributes?.updated_at !== undefined) {
                    expect(typeof checkInTime.attributes.updated_at).toBe('string');
                    expect(new Date(checkInTime.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('PersonEvent Attributes Type Validation', () => {
        it('should validate PersonEventAttributes types match API response', async () => {
            const response = await client.personEvents.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const personEvent = response.data[0];

                // Validate required fields
                expect(personEvent.id).toBeDefined();
                expect(typeof personEvent.id).toBe('string');
                expect(personEvent.type).toBe('PersonEvent');

                // Validate date attributes
                if (personEvent.attributes?.created_at !== undefined) {
                    expect(typeof personEvent.attributes.created_at).toBe('string');
                    expect(new Date(personEvent.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (personEvent.attributes?.updated_at !== undefined) {
                    expect(typeof personEvent.attributes.updated_at).toBe('string');
                    expect(new Date(personEvent.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('PreCheck Attributes Type Validation', () => {
        it('should validate PreCheckAttributes types match API response', async () => {
            const response = await client.preChecks.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const preCheck = response.data[0];

                // Validate required fields
                expect(preCheck.id).toBeDefined();
                expect(typeof preCheck.id).toBe('string');
                expect(preCheck.type).toBe('PreCheck');

                // Validate date attributes
                if (preCheck.attributes?.created_at !== undefined) {
                    expect(typeof preCheck.attributes.created_at).toBe('string');
                    expect(new Date(preCheck.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (preCheck.attributes?.updated_at !== undefined) {
                    expect(typeof preCheck.attributes.updated_at).toBe('string');
                    expect(new Date(preCheck.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('Pass Attributes Type Validation', () => {
        it('should validate PassAttributes types match API response', async () => {
            const response = await client.passes.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const pass = response.data[0];

                // Validate required fields
                expect(pass.id).toBeDefined();
                expect(typeof pass.id).toBe('string');
                expect(pass.type).toBe('Pass');

                // Validate optional string attributes
                if (pass.attributes?.name !== undefined) {
                    expect(typeof pass.attributes.name).toBe('string');
                }

                // Validate date attributes
                if (pass.attributes?.created_at !== undefined) {
                    expect(typeof pass.attributes.created_at).toBe('string');
                    expect(new Date(pass.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (pass.attributes?.updated_at !== undefined) {
                    expect(typeof pass.attributes.updated_at).toBe('string');
                    expect(new Date(pass.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('Headcount Attributes Type Validation', () => {
        it('should validate HeadcountAttributes types match API response', async () => {
            const response = await client.headcounts.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const headcount = response.data[0];

                // Validate required fields
                expect(headcount.id).toBeDefined();
                expect(typeof headcount.id).toBe('string');
                expect(headcount.type).toBe('Headcount');

                // Validate optional number attributes
                if (headcount.attributes?.count !== undefined) {
                    expect(typeof headcount.attributes.count).toBe('number');
                }

                // Validate date attributes
                if (headcount.attributes?.created_at !== undefined) {
                    expect(typeof headcount.attributes.created_at).toBe('string');
                    expect(new Date(headcount.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (headcount.attributes?.updated_at !== undefined) {
                    expect(typeof headcount.attributes.updated_at).toBe('string');
                    expect(new Date(headcount.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('AttendanceType Attributes Type Validation', () => {
        it('should validate AttendanceTypeAttributes types match API response', async () => {
            const response = await client.events.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const eventId = response.data[0].id;
                const attendanceTypesResponse = await client.events.getAttendanceTypes(eventId);
                
                if (attendanceTypesResponse.data.length > 0) {
                    const attendanceType = attendanceTypesResponse.data[0];

                    // Validate required fields
                    expect(attendanceType.id).toBeDefined();
                    expect(typeof attendanceType.id).toBe('string');
                    expect(attendanceType.type).toBe('AttendanceType');

                    // Validate optional string attributes
                    if (attendanceType.attributes?.name !== undefined) {
                        expect(typeof attendanceType.attributes.name).toBe('string');
                    }

                    // Validate date attributes
                    if (attendanceType.attributes?.created_at !== undefined) {
                        expect(typeof attendanceType.attributes.created_at).toBe('string');
                        expect(new Date(attendanceType.attributes.created_at).getTime()).not.toBeNaN();
                    }
                    if (attendanceType.attributes?.updated_at !== undefined) {
                        expect(typeof attendanceType.attributes.updated_at).toBe('string');
                        expect(new Date(attendanceType.attributes.updated_at).getTime()).not.toBeNaN();
                    }
                }
            }
        }, 30000);
    });

    describe('Pagination and Meta Type Validation', () => {
        it('should validate pagination structure types', async () => {
            const response = await client.events.getAll({ perPage: 5 });

            // Validate pagination links
            if (response.links) {
                if (response.links.self) {
                    expect(typeof response.links.self).toBe('string');
                }
                if (response.links.first) {
                    expect(typeof response.links.first).toBe('string');
                }
                if (response.links.last) {
                    expect(typeof response.links.last).toBe('string');
                }
                if (response.links.prev) {
                    expect(typeof response.links.prev).toBe('string');
                }
                if (response.links.next) {
                    expect(typeof response.links.next).toBe('string');
                }
            }

            // Validate pagination meta
            if (response.meta) {
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
});
