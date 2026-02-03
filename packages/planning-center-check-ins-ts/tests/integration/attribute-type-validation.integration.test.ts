/**
 * Check-ins API Attribute Type Validation Integration Tests
 * 
 * These tests verify that TypeScript attribute types match actual Check-ins API responses.
 * They make real API calls and validate that the response data matches the expected types.
 * 
 * To run: npm run test:integration -- --testNamePattern="Attribute Type Validation"
 */

import { PcoCheckInsClient } from '../../src';
import { createTestClient, logAuthStatus, isPreChecksApiAvailable } from './test-config';

describe('Check-ins API Attribute Type Validation Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

    }, 30000);

    describe('Event Attributes Type Validation', () => {
        it('should validate EventAttributes types match API response', async () => {
            const response = await client.events.getPage({ perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const event = response.data[0];

            // Validate required fields
            expect(event.id).toBeDefined();
            expect(typeof event.id).toBe('string');
            expect(event.type).toBe('Event');

            // Validate optional string attributes
            if ((event as any).name !== undefined) {
                expect(typeof event.name).toBe('string');
            }
            if ((event as any).frequency !== undefined) {
                expect(typeof event.frequency).toBe('string');
            }
            if ((event as any).integration_key !== undefined && (event as any).integration_key != null) {
                expect(['string', 'object'].includes(typeof event.integration_key)).toBe(true);
            }
            if ((event as any).app_source !== undefined) {
                expect(typeof event.app_source).toBe('string');
            }
            if ((event as any).archived_at !== undefined && (event as any).archived_at !== null) {
                expect(typeof event.archived_at).toBe('string');
            }

            // Validate boolean attributes
            if ((event as any).enable_services_integration !== undefined) {
                expect(typeof event.enable_services_integration).toBe('boolean');
            }
            if ((event as any).location_times_enabled !== undefined) {
                expect(typeof event.location_times_enabled).toBe('boolean');
            }
            if ((event as any).pre_select_enabled !== undefined) {
                expect(typeof event.pre_select_enabled).toBe('boolean');
            }

            // Validate date attributes
            if ((event as any).created_at !== undefined) {
                expect(typeof event.created_at).toBe('string');
                expect(new Date(event.created_at).getTime()).not.toBeNaN();
            }
            if ((event as any).updated_at !== undefined) {
                expect(typeof event.updated_at).toBe('string');
                expect(new Date(event.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);

        it('should validate EventRelationships structure', async () => {
            const response = await client.events.getPage({
                perPage: 1,
                page: 1,
                include: ['attendance_types', 'check_ins', 'locations', 'event_periods']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const event = response.data[0];

            // Flattened: relationships at top level (event.attendance_types, etc.)
            if ((event as any).attendance_types !== undefined) {
                expect(Array.isArray((event as any).attendance_types) || typeof (event as any).attendance_types === 'object').toBe(true);
            }
            if ((event as any).locations !== undefined) {
                expect(Array.isArray((event as any).locations) || typeof (event as any).locations === 'object').toBe(true);
            }
        }, 30000);
    });

    describe('CheckIn Attributes Type Validation', () => {
        it('should validate CheckInAttributes types match API response', async () => {
            const response = await client.checkIns.getPage({ perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const checkIn = response.data[0];

            // Validate required fields
            expect(checkIn.id).toBeDefined();
            expect(typeof checkIn.id).toBe('string');
            expect(checkIn.type).toBe('CheckIn');

            // Validate optional string attributes
            if ((checkIn as any).first_name !== undefined) {
                expect(typeof checkIn.first_name).toBe('string');
            }
            if ((checkIn as any).last_name !== undefined) {
                expect(typeof checkIn.last_name).toBe('string');
            }
            if ((checkIn as any).medical_notes !== undefined && (checkIn as any).medical_notes != null) {
                expect(['string', 'object'].includes(typeof checkIn.medical_notes)).toBe(true);
            }
            if ((checkIn as any).security_code !== undefined) {
                expect(typeof checkIn.security_code).toBe('string');
            }
            if ((checkIn as any).checked_out_at !== undefined && (checkIn as any).checked_out_at !== null) {
                expect(typeof checkIn.checked_out_at).toBe('string');
            }
            if ((checkIn as any).confirmed_at !== undefined && (checkIn as any).confirmed_at !== null) {
                expect(typeof checkIn.confirmed_at).toBe('string');
            }
            if ((checkIn as any).emergency_contact_name !== undefined && (checkIn as any).emergency_contact_name !== null) {
                expect(typeof checkIn.emergency_contact_name).toBe('string');
            }
            if ((checkIn as any).emergency_contact_phone_number !== undefined && (checkIn as any).emergency_contact_phone_number !== null) {
                expect(typeof checkIn.emergency_contact_phone_number).toBe('string');
            }
            if ((checkIn as any).kind !== undefined) {
                expect(typeof checkIn.kind).toBe('string');
            }

            // Validate number attributes
            if ((checkIn as any).number !== undefined) {
                expect(typeof checkIn.number).toBe('number');
            }

            // Validate boolean attributes
            if ((checkIn as any).one_time_guest !== undefined) {
                expect(typeof checkIn.one_time_guest).toBe('boolean');
            }

            // Validate date attributes
            if ((checkIn as any).created_at !== undefined) {
                expect(typeof checkIn.created_at).toBe('string');
                expect(new Date(checkIn.created_at).getTime()).not.toBeNaN();
            }
            if ((checkIn as any).updated_at !== undefined) {
                expect(typeof checkIn.updated_at).toBe('string');
                expect(new Date(checkIn.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Location Attributes Type Validation', () => {
        it('should validate LocationAttributes types match API response', async () => {
            const response = await client.locations.getPage({ perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const location = response.data[0];

            // Validate required fields
            expect(location.id).toBeDefined();
            expect(typeof location.id).toBe('string');
            expect(location.type).toBe('Location');

            // Validate optional string attributes
            if ((location as any).name !== undefined) {
                expect(typeof location.name).toBe('string');
            }

            // Validate date attributes
            if ((location as any).created_at !== undefined) {
                expect(typeof location.created_at).toBe('string');
                expect(new Date(location.created_at).getTime()).not.toBeNaN();
            }
            if ((location as any).updated_at !== undefined) {
                expect(typeof location.updated_at).toBe('string');
                expect(new Date(location.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('EventPeriod Attributes Type Validation', () => {
        it('should validate EventPeriodAttributes types match API response', async () => {
            // Event periods must be accessed through events
            const events = await client.events.getAll({ perPage: 1 });
            expect(events.data.length).toBeGreaterThan(0);
            
            const eventId = events.data[0].id;
            const response = await client.events.getEventPeriods(eventId);
            expect(response.data.length).toBeGreaterThan(0);
            const eventPeriod = response.data[0];

            // Validate required fields
            expect(eventPeriod.id).toBeDefined();
            expect(typeof eventPeriod.id).toBe('string');
            expect(eventPeriod.type).toBe('EventPeriod');

            // Validate optional string attributes
            if ((eventPeriod as any).starts_at !== undefined) {
                expect(typeof eventPeriod.starts_at).toBe('string');
                expect(new Date(eventPeriod.starts_at).getTime()).not.toBeNaN();
            }
            if ((eventPeriod as any).ends_at !== undefined) {
                expect(typeof eventPeriod.ends_at).toBe('string');
                expect(new Date(eventPeriod.ends_at).getTime()).not.toBeNaN();
            }

            // Validate date attributes
            if ((eventPeriod as any).created_at !== undefined) {
                expect(typeof eventPeriod.created_at).toBe('string');
                expect(new Date(eventPeriod.created_at).getTime()).not.toBeNaN();
            }
            if ((eventPeriod as any).updated_at !== undefined) {
                expect(typeof eventPeriod.updated_at).toBe('string');
                expect(new Date(eventPeriod.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('EventTime Attributes Type Validation', () => {
        it('should validate EventTimeAttributes types match API response', async () => {
            const response = await client.eventTimes.getPage({ perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const eventTime = response.data[0];

            // Validate required fields
            expect(eventTime.id).toBeDefined();
            expect(typeof eventTime.id).toBe('string');
            expect(eventTime.type).toBe('EventTime');

            // Validate optional string attributes
            if ((eventTime as any).starts_at !== undefined) {
                expect(typeof eventTime.starts_at).toBe('string');
                expect(new Date(eventTime.starts_at).getTime()).not.toBeNaN();
            }
            if ((eventTime as any).ends_at !== undefined) {
                expect(typeof eventTime.ends_at).toBe('string');
                expect(new Date(eventTime.ends_at).getTime()).not.toBeNaN();
            }

            // Validate date attributes
            if ((eventTime as any).created_at !== undefined) {
                expect(typeof eventTime.created_at).toBe('string');
                expect(new Date(eventTime.created_at).getTime()).not.toBeNaN();
            }
            if ((eventTime as any).updated_at !== undefined) {
                expect(typeof eventTime.updated_at).toBe('string');
                expect(new Date(eventTime.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Station Attributes Type Validation', () => {
        it('should validate StationAttributes types match API response', async () => {
            const response = await client.stations.getPage({ perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const station = response.data[0];

            // Validate required fields
            expect(station.id).toBeDefined();
            expect(typeof station.id).toBe('string');
            expect(station.type).toBe('Station');

            // Validate optional string attributes
            if ((station as any).name !== undefined) {
                expect(typeof station.name).toBe('string');
            }

            // Validate date attributes
            if ((station as any).created_at !== undefined) {
                expect(typeof station.created_at).toBe('string');
                expect(new Date(station.created_at).getTime()).not.toBeNaN();
            }
            if ((station as any).updated_at !== undefined) {
                expect(typeof station.updated_at).toBe('string');
                expect(new Date(station.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Label Attributes Type Validation', () => {
        it('should validate LabelAttributes types match API response', async () => {
            const response = await client.labels.getPage({ perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const label = response.data[0];

            // Validate required fields
            expect(label.id).toBeDefined();
            expect(typeof label.id).toBe('string');
            expect(label.type).toBe('Label');

            // Validate optional string attributes
            if ((label as any).name !== undefined) {
                expect(typeof label.name).toBe('string');
            }

            // Validate date attributes
            if ((label as any).created_at !== undefined) {
                expect(typeof label.created_at).toBe('string');
                expect(new Date(label.created_at).getTime()).not.toBeNaN();
            }
            if ((label as any).updated_at !== undefined) {
                expect(typeof label.updated_at).toBe('string');
                expect(new Date(label.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Option Attributes Type Validation', () => {
        it('should validate OptionAttributes types match API response', async () => {
            const response = await client.options.getPage({ perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const option = response.data[0];

            // Validate required fields
            expect(option.id).toBeDefined();
            expect(typeof option.id).toBe('string');
            expect(option.type).toBe('Option');

            // Validate optional string attributes
            if ((option as any).name !== undefined) {
                expect(typeof option.name).toBe('string');
            }

            // Validate date attributes
            if ((option as any).created_at !== undefined) {
                expect(typeof option.created_at).toBe('string');
                expect(new Date(option.created_at).getTime()).not.toBeNaN();
            }
            if ((option as any).updated_at !== undefined) {
                expect(typeof option.updated_at).toBe('string');
                expect(new Date(option.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('CheckInGroup Attributes Type Validation', () => {
        it('should validate CheckInGroupAttributes types match API response', async () => {
            const stationsPage = await client.stations.getPage({ perPage: 1, page: 1 });
            expect(stationsPage.data.length).toBeGreaterThan(0);
            const stationId = stationsPage.data[0].id;
            const response = await client.checkInGroups.getPage({ stationId, perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const checkInGroup = response.data[0];

            // Validate required fields
            expect(checkInGroup.id).toBeDefined();
            expect(typeof checkInGroup.id).toBe('string');
            expect(checkInGroup.type).toBe('CheckInGroup');

            // Validate optional string attributes
            if ((checkInGroup as any).name !== undefined) {
                expect(typeof checkInGroup.name).toBe('string');
            }

            // Validate date attributes
            if ((checkInGroup as any).created_at !== undefined) {
                expect(typeof checkInGroup.created_at).toBe('string');
                expect(new Date(checkInGroup.created_at).getTime()).not.toBeNaN();
            }
            if ((checkInGroup as any).updated_at !== undefined) {
                expect(typeof checkInGroup.updated_at).toBe('string');
                expect(new Date(checkInGroup.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('CheckInTime Attributes Type Validation', () => {
        it('should validate CheckInTimeAttributes types match API response', async () => {
            const checkInsPage = await client.checkIns.getPage({ perPage: 1 });
            expect(checkInsPage.data.length).toBeGreaterThan(0);
            const response = await client.checkIns.getCheckInTimes(checkInsPage.data[0].id);
            expect(response.data.length).toBeGreaterThan(0);
            {
                const checkInTime = response.data[0];
                expect(checkInTime.id).toBeDefined();
                expect(typeof checkInTime.id).toBe('string');
                expect(checkInTime.type).toBe('CheckInTime');
                if ((checkInTime as any).created_at !== undefined) {
                    expect(typeof (checkInTime as any).created_at).toBe('string');
                    expect(new Date((checkInTime as any).created_at).getTime()).not.toBeNaN();
                }
                if ((checkInTime as any).updated_at !== undefined) {
                    expect(typeof (checkInTime as any).updated_at).toBe('string');
                    expect(new Date((checkInTime as any).updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('PersonEvent Attributes Type Validation', () => {
        it('should validate PersonEventAttributes types match API response', async () => {
            const eventsPage = await client.events.getPage({ perPage: 1 });
            expect(eventsPage.data.length).toBeGreaterThan(0);
            const response = await client.events.getPersonEvents(eventsPage.data[0].id);
            expect(response.data.length).toBeGreaterThan(0);
            {
                const personEvent = response.data[0];
                expect(personEvent.id).toBeDefined();
                expect(typeof personEvent.id).toBe('string');
                expect(personEvent.type).toBe('PersonEvent');
                if ((personEvent as any).created_at !== undefined) {
                    expect(typeof (personEvent as any).created_at).toBe('string');
                    expect(new Date((personEvent as any).created_at).getTime()).not.toBeNaN();
                }
                if ((personEvent as any).updated_at !== undefined) {
                    expect(typeof (personEvent as any).updated_at).toBe('string');
                    expect(new Date((personEvent as any).updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('PreCheck Attributes Type Validation', () => {
        it('should validate PreCheckAttributes types match API response', async () => {
            if (!(await isPreChecksApiAvailable(client))) return;
            const response = await client.preChecks.getPage({ perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const preCheck = response.data[0];

            // Validate required fields
            expect(preCheck.id).toBeDefined();
            expect(typeof preCheck.id).toBe('string');
            expect(preCheck.type).toBe('PreCheck');

            // Validate date attributes
            if ((preCheck as any).created_at !== undefined) {
                expect(typeof preCheck.created_at).toBe('string');
                expect(new Date(preCheck.created_at).getTime()).not.toBeNaN();
            }
            if ((preCheck as any).updated_at !== undefined) {
                expect(typeof preCheck.updated_at).toBe('string');
                expect(new Date(preCheck.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Pass Attributes Type Validation', () => {
        it('should validate PassAttributes types match API response', async () => {
            const response = await client.passes.getPage({ perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const pass = response.data[0];

            // Validate required fields
            expect(pass.id).toBeDefined();
            expect(typeof pass.id).toBe('string');
            expect(pass.type).toBe('Pass');

            // Validate optional string attributes
            if ((pass as any).name !== undefined) {
                expect(typeof pass.name).toBe('string');
            }

            // Validate date attributes
            if ((pass as any).created_at !== undefined) {
                expect(typeof pass.created_at).toBe('string');
                expect(new Date(pass.created_at).getTime()).not.toBeNaN();
            }
            if ((pass as any).updated_at !== undefined) {
                expect(typeof pass.updated_at).toBe('string');
                expect(new Date(pass.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Headcount Attributes Type Validation', () => {
        it('should validate HeadcountAttributes types match API response', async () => {
            const response = await client.headcounts.getPage({ perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const headcount = response.data[0];

            // Validate required fields
            expect(headcount.id).toBeDefined();
            expect(typeof headcount.id).toBe('string');
            expect(headcount.type).toBe('Headcount');

            // Validate optional number attributes
            if ((headcount as any).count !== undefined) {
                expect(typeof headcount.count).toBe('number');
            }

            // Validate date attributes
            if ((headcount as any).created_at !== undefined) {
                expect(typeof headcount.created_at).toBe('string');
                expect(new Date(headcount.created_at).getTime()).not.toBeNaN();
            }
            if ((headcount as any).updated_at !== undefined) {
                expect(typeof headcount.updated_at).toBe('string');
                expect(new Date(headcount.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('AttendanceType Attributes Type Validation', () => {
        it('should validate AttendanceTypeAttributes types match API response', async () => {
            const response = await client.events.getPage({ perPage: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const eventId = response.data[0].id;
            const attendanceTypesResponse = await client.events.getAttendanceTypes(eventId);
            expect(attendanceTypesResponse.data.length).toBeGreaterThan(0);
            const attendanceType = attendanceTypesResponse.data[0];

            // Validate required fields
            expect(attendanceType.id).toBeDefined();
            expect(typeof attendanceType.id).toBe('string');
            expect(attendanceType.type).toBe('AttendanceType');

            // Validate optional string attributes
            if (attendanceType.attributes?.name !== undefined) {
                expect(typeof attendanceType.name).toBe('string');
            }

            // Validate date attributes
            if (attendanceType.attributes?.created_at !== undefined) {
                expect(typeof attendanceType.created_at).toBe('string');
                expect(new Date(attendanceType.created_at).getTime()).not.toBeNaN();
            }
            if (attendanceType.attributes?.updated_at !== undefined) {
                expect(typeof attendanceType.updated_at).toBe('string');
                expect(new Date(attendanceType.updated_at).getTime()).not.toBeNaN();
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
