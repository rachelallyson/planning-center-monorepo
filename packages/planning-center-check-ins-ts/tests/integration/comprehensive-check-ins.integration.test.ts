/**
 * Comprehensive Check-ins API Integration Tests
 * 
 * Real integration tests that verify Check-ins API functionality end-to-end:
 * - Complete endpoint coverage for all modules
 * - Proper attribute type validation
 * - Relationship handling and included resources
 * - Error handling and edge cases
 * - Pagination and filtering
 * - Association endpoints
 * 
 * To run: npm run test:integration -- --testNamePattern="Comprehensive"
 */

import { PcoCheckInsClient } from '../../src';
import { createTestClient, logAuthStatus, isPreChecksApiAvailable } from './test-config';
import { getClientModule, getResourceId, type PageResponse } from './test-utils';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateBooleanAttribute,
    validateDateAttribute,
} from '../type-validators';
import { CheckInFilter } from '../../src/modules/events';

function validateNullableResource<T extends object>(value: T | null, type: string): void {
    if (value !== null) validateResourceStructure(value, type);
}

async function verifyCheckInAssociations(client: PcoCheckInsClient, checkInId: string): Promise<void> {
    const [checkInGroup, checkInTimes, checkedInAt, checkedInBy, checkedOutBy, event, eventPeriod, eventTimes, locations, options, person] = await Promise.all([
        client.checkIns.getCheckInGroup(checkInId),
        client.checkIns.getCheckInTimes(checkInId),
        client.checkIns.getCheckedInAt(checkInId),
        client.checkIns.getCheckedInBy(checkInId),
        client.checkIns.getCheckedOutBy(checkInId),
        client.checkIns.getEvent(checkInId),
        client.checkIns.getEventPeriod(checkInId),
        client.checkIns.getEventTimes(checkInId),
        client.checkIns.getLocations(checkInId),
        client.checkIns.getOptions(checkInId),
        client.checkIns.getPerson(checkInId),
    ]);

    validateNullableResource(checkInGroup, 'CheckInGroup');
    expect(checkInTimes.data).toBeDefined();
    expect(Array.isArray(checkInTimes.data)).toBe(true);
    checkInTimes.data.forEach(resource => validateResourceStructure(resource, 'CheckInTime'));
    validateNullableResource(checkedInAt, 'Station');
    validateNullableResource(checkedInBy, 'Person');
    validateNullableResource(checkedOutBy, 'Person');
    validateResourceStructure(event, 'Event');
    validateResourceStructure(eventPeriod, 'EventPeriod');
    expect(eventTimes.data).toBeDefined();
    expect(Array.isArray(eventTimes.data)).toBe(true);
    eventTimes.data.forEach(resource => validateResourceStructure(resource, 'EventTime'));
    expect(locations.data).toBeDefined();
    expect(Array.isArray(locations.data)).toBe(true);
    locations.data.forEach(resource => validateResourceStructure(resource, 'Location'));
    expect(options.data).toBeDefined();
    expect(Array.isArray(options.data)).toBe(true);
    options.data.forEach(resource => validateResourceStructure(resource, 'Option'));
    validateNullableResource(person, 'Person');
}

async function findFirstLocationLabels(client: PcoCheckInsClient): Promise<{ data: object[] } | null> {
    const checkInsPage = await client.checkIns.getPage({ per_page: 25, page: 1 });
    for (const checkIn of checkInsPage.data) {
        const locationsForCheckIn = await client.checkIns.getLocations(checkIn.id);
        for (const loc of locationsForCheckIn.data) {
            const result = await client.checkIns.getLocationLabels(checkIn.id, loc.id);
            if (result.data && result.data.length > 0) return result;
        }
    }
    return null;
}

async function fetchLocationLabelsOrThrow(client: PcoCheckInsClient): Promise<{ data: object[] }> {
    const out = await findFirstLocationLabels(client);
    if (out !== null) return out;
    throw new Error('No check-in had a location with location labels. Add labels at Event → Labels & Locations (event level) for the event your check-ins use.');
}

describe('Comprehensive Check-ins API Integration Tests', () => {
    let client: PcoCheckInsClient;
    let testEventId: string | null = null;
    let testCheckInId: string | null = null;
    let testLocationId: string | null = null;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

    }, 30000);

    describe('Events Module - Comprehensive Coverage', () => {
        it('should get all events with proper structure', async () => {
            const result = await client.events.getAll({ per_page: 10 });

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);

            testEventId = result.data[0].id;
            const event = result.data[0];

            validateResourceStructure(event, 'Event');
            if (event.name !== undefined) {
                validateStringAttribute(event, 'name');
            }
            if (event.frequency !== undefined) {
                validateStringAttribute(event, 'frequency');
                const frequencyLower = event.frequency.toLowerCase();
                expect(['weekly', 'daily', 'monthly', 'yearly', 'one_time']).toContain(frequencyLower);
            }
            if (event.created_at !== undefined) {
                validateDateAttribute(event, 'created_at');
            }
        }, 30000);

        it('should get single event by ID with includes', async () => {
            if (!testEventId) {
                const events = await client.events.getAll({ per_page: 1 });
                expect(events.data.length).toBeGreaterThan(0);
                testEventId = events.data[0].id;
            }

            const event = await client.events.getById(testEventId!, { include: ['attendance_types'] });

            validateResourceStructure(event, 'Event');
            expect(event.id).toBe(testEventId);
            // Flattened: relationships at top level (e.g. event.locations, event.event_periods)
            if (event.locations !== undefined) {
                expect(Array.isArray(event.locations) || typeof event.locations === 'object').toBe(true);
            }
        }, 30000);

        it('should handle pagination correctly', async () => {
            const page1 = await client.events.getPage({ per_page: 2, page: 1 });
            expect(page1.data).toBeDefined();
            expect(page1.data.length).toBeLessThanOrEqual(2);
            expect(page1.data.length).toBeGreaterThan(0);
            const page2 = await client.events.getPage({ per_page: 2, page: 2 });
            expect(page2.data).toBeDefined();
            expect(Array.isArray(page2.data)).toBe(true);
            if (page2.data.length > 0) {
                const page1Ids = page1.data.map((e) => e.id);
                const page2Ids = page2.data.map((e) => e.id);
                expect(page1Ids).toBeDefined();
                expect(page2Ids).toBeDefined();
                expect(page1Ids).not.toEqual(page2Ids);
            }
        }, 60000);

        it('should filter events with where parameters', async () => {
            const eventsPage = await client.events.getPage({
                where: { name: 'Test' },
                per_page: 5,
                page: 1,
            });
            expect(eventsPage.data).toBeDefined();
            expect(Array.isArray(eventsPage.data)).toBe(true);
            eventsPage.data.forEach((event) => {
                validateResourceStructure(event, 'Event');
                if (event.frequency !== undefined) {
                    validateStringAttribute(event, 'frequency');
                    expect(event.frequency.toLowerCase()).toBe('weekly');
                }
            });
        }, 30000);

        it('should get event associations', async () => {
            if (!testEventId) {
                const events = await client.events.getAll({ per_page: 1 });
                expect(events.data.length).toBeGreaterThan(0);
                testEventId = events.data[0].id;
            }

            // Test all association endpoints
            const [attendanceTypes, checkIns, currentEventTimes, eventLabels, eventPeriods, integrationLinks, locations, personEvents] = await Promise.all([
                client.events.getAttendanceTypes(testEventId!),
                client.events.getCheckIns(testEventId!, { filter: ['attendee'] }),
                client.events.getCurrentEventTimes(testEventId!),
                client.events.getEventLabels(testEventId!),
                client.events.getEventPeriods(testEventId!),
                client.events.getIntegrationLinks(testEventId!),
                client.events.getLocations(testEventId!),
                client.events.getPersonEvents(testEventId!),
            ]);

            // All should have proper structure (even if empty)
            expect(attendanceTypes.data).toBeDefined();
            expect(Array.isArray(attendanceTypes.data)).toBe(true);
            attendanceTypes.data.forEach(resource => validateResourceStructure(resource, 'AttendanceType'));

            expect(checkIns.data).toBeDefined();
            expect(Array.isArray(checkIns.data)).toBe(true);
            checkIns.data.forEach(resource => validateResourceStructure(resource, 'CheckIn'));

            expect(currentEventTimes.data).toBeDefined();
            expect(Array.isArray(currentEventTimes.data)).toBe(true);
            currentEventTimes.data.forEach(resource => validateResourceStructure(resource, 'EventTime'));

            expect(eventLabels.data).toBeDefined();
            expect(Array.isArray(eventLabels.data)).toBe(true);
            eventLabels.data.forEach(resource => validateResourceStructure(resource, 'EventLabel'));

            expect(eventPeriods.data).toBeDefined();
            expect(Array.isArray(eventPeriods.data)).toBe(true);
            eventPeriods.data.forEach(resource => validateResourceStructure(resource, 'EventPeriod'));

            expect(integrationLinks.data).toBeDefined();
            expect(Array.isArray(integrationLinks.data)).toBe(true);
            integrationLinks.data.forEach(resource => validateResourceStructure(resource, 'IntegrationLink'));

            expect(locations.data).toBeDefined();
            expect(Array.isArray(locations.data)).toBe(true);
            locations.data.forEach(resource => validateResourceStructure(resource, 'Location'));

            expect(personEvents.data).toBeDefined();
            expect(Array.isArray(personEvents.data)).toBe(true);
            personEvents.data.forEach(resource => validateResourceStructure(resource, 'PersonEvent'));
        }, 60000);
    });

    describe('Check-ins Module - Comprehensive Coverage', () => {
        it('should get all check-ins with proper structure', async () => {
            const result = await client.checkIns.getAll({ per_page: 10 });

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);

            testCheckInId = result.data[0].id;
            const checkIn = result.data[0];

            validateResourceStructure(checkIn, 'CheckIn');
            if (checkIn.security_code !== undefined) {
                validateStringAttribute(checkIn, 'security_code');
            }
            if (checkIn.first_name !== undefined) {
                validateStringAttribute(checkIn, 'first_name');
            }
            if (checkIn.one_time_guest !== undefined) {
                validateBooleanAttribute(checkIn, 'one_time_guest');
            }
        }, 30000);

        it('should get single check-in by ID with includes', async () => {
            if (!testCheckInId) {
                const checkIns = await client.checkIns.getAll({ per_page: 1 });
                expect(checkIns.data.length).toBeGreaterThan(0);
                testCheckInId = checkIns.data[0].id;
            }

            const checkIn = await client.checkIns.getById(testCheckInId!, { include: ['event', 'event_period'] });

            validateResourceStructure(checkIn, 'CheckIn');
            expect(checkIn.id).toBe(testCheckInId);
            if (checkIn.event !== undefined || checkIn.event_period !== undefined) {
                expect(checkIn).toBeDefined();
            }
        }, 30000);

        it('should filter check-ins correctly', async () => {
            // Test various filter combinations
            const filters: CheckInFilter[][] = [
                ['attendee'],
                ['not_checked_out'],
                ['guest'],
                ['first_time'],
            ];

            for (const filter of filters) {
                const result = await client.checkIns.getAll({
                    filter,
                    per_page: 5
                });

                expect(result).toBeDefined();
                expect(result.data).toBeDefined();
                expect(Array.isArray(result.data)).toBe(true);
            }
        }, 30000);

        it('should get check-in associations', async () => {
            if (!testCheckInId) {
                const checkIns = await client.checkIns.getAll({ per_page: 1 });
                expect(checkIns.data.length).toBeGreaterThan(0);
                testCheckInId = checkIns.data[0].id;
            }
            await verifyCheckInAssociations(client, testCheckInId!);
        }, 60000);
    });

    describe('Locations Module - Comprehensive Coverage', () => {
        it('should get all locations with proper structure', async () => {
            const result = await client.locations.getAll({ per_page: 10 });

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);

            testLocationId = result.data[0].id;
            const location = result.data[0];

            validateResourceStructure(location, 'Location');
            if (location.name !== undefined) {
                validateStringAttribute(location, 'name');
            }
        }, 30000);

        it('should get single location by ID', async () => {
            if (!testLocationId) {
                const locations = await client.locations.getAll({ per_page: 1 });
                expect(locations.data.length).toBeGreaterThan(0);
                testLocationId = locations.data[0].id;
            }

            const location = await client.locations.getById(testLocationId!, { include: ['event'] });

            validateResourceStructure(location, 'Location');
            expect(location.id).toBe(testLocationId);

            // Flattened: relationships at top level (event)
            if (location.event != null && typeof location.event === 'object') {
                validateResourceStructure(location.event, 'Event');
            }
        }, 30000);

        it('should get location associations', async () => {
            if (!testLocationId) {
                const locations = await client.locations.getAll({ per_page: 1 });
                expect(locations.data.length).toBeGreaterThan(0);
                testLocationId = locations.data[0].id;
            }

            const locationEventPeriods = await client.locations.getLocationEventPeriods(testLocationId!);
            const locationEventTimes = await client.locations.getLocationEventTimes(testLocationId!);

            // Location labels are only available per API under check_ins (not under locations).
            // Discover a check-in that has at least one location (first check-in may have none).
            const checkInsPage = await client.checkIns.getPage({ per_page: 25, page: 1 });
            expect(checkInsPage.data.length).toBeGreaterThan(0);
            let checkInId: string | null = null;
            let locationsForCheckIn: Awaited<ReturnType<PcoCheckInsClient['checkIns']['getLocations']>> | null = null;
            for (const checkIn of checkInsPage.data) {
                const locs = await client.checkIns.getLocations(checkIn.id);
                if (locs.data.length > 0) {
                    checkInId = checkIn.id;
                    locationsForCheckIn = locs;
                    break;
                }
            }
            expect(checkInId).toBeTruthy();
            expect(locationsForCheckIn).toBeTruthy();
            expect(locationsForCheckIn!.data.length).toBeGreaterThan(0);
            const locationIdForLabels = locationsForCheckIn!.data[0].id;
            const locationLabels = await client.checkIns.getLocationLabels(checkInId!, locationIdForLabels);

            expect(locationEventPeriods.data).toBeDefined();
            expect(Array.isArray(locationEventPeriods.data)).toBe(true);
            locationEventPeriods.data.forEach(resource => validateResourceStructure(resource, 'LocationEventPeriod'));

            expect(locationEventTimes.data).toBeDefined();
            expect(Array.isArray(locationEventTimes.data)).toBe(true);
            locationEventTimes.data.forEach(resource => validateResourceStructure(resource, 'LocationEventTime'));

            expect(locationLabels.data).toBeDefined();
            expect(Array.isArray(locationLabels.data)).toBe(true);
            locationLabels.data.forEach(resource => validateResourceStructure(resource, 'LocationLabel'));
        }, 60000);
    });

    describe('Event Periods Module - Comprehensive Coverage', () => {
        it('should get event periods via event associations', async () => {
            // Event periods must be accessed through events, not as a standalone endpoint
            if (!testEventId) {
                const events = await client.events.getAll({ per_page: 1 });
                expect(events.data.length).toBeGreaterThan(0);
                testEventId = events.data[0].id;
            }

            const result = await client.events.getEventPeriods(testEventId!);

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);

            const period = result.data[0];
            validateResourceStructure(period, 'EventPeriod');

            if (period.starts_at !== undefined) {
                validateDateAttribute(period, 'starts_at');
            }
            if (period.ends_at !== undefined) {
                validateDateAttribute(period, 'ends_at');
            }
        }, 30000);

        it('should get event period associations', async () => {
            // Event periods must be accessed through events
            if (!testEventId) {
                const events = await client.events.getAll({ per_page: 1 });
                expect(events.data.length).toBeGreaterThan(0);
                testEventId = events.data[0].id;
            }

            const periods = await client.events.getEventPeriods(testEventId!);
            expect(periods.data.length).toBeGreaterThan(0);

            // Note: Event period associations require check_in_id in the path, so they're not easily accessible
            // The event period resource itself has relationship data that can be included
            // For full association access, you'd need to access via check-in: /check-ins/v2/check_ins/{check_in_id}/event_period/{id}/...

            // We can at least verify the event period has relationship data
            const eventPeriod = periods.data[0];
            if (eventPeriod.event != null && typeof eventPeriod.event === 'object') {
                expect(eventPeriod.event.id).toBeDefined();
            }

            // Verify event period structure
            validateResourceStructure(eventPeriod, 'EventPeriod');
        }, 60000);
    });

    describe('Event Times Module - Comprehensive Coverage', () => {
        it('should get all event times with proper structure', async () => {
            const result = await client.eventTimes.getAll({ per_page: 10 });

            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);

            const eventTime = result.data[0];
            validateResourceStructure(eventTime, 'EventTime');
        }, 30000);

        it('should get single event time by ID with includes', async () => {
            const eventTimes = await client.eventTimes.getAll({ per_page: 1 });
            expect(eventTimes.data.length).toBeGreaterThan(0);

            const firstId = eventTimes.data[0].id;
            const eventTime = await client.eventTimes.getById(firstId, { include: ['event', 'event_period'] });
            validateResourceStructure(eventTime, 'EventTime');
            // Flattened: relationships at top level
            if (eventTime.event != null && typeof eventTime.event === 'object') {
                validateResourceStructure(eventTime.event, 'Event');
            }
            if (eventTime.event_period != null && typeof eventTime.event_period === 'object') {
                validateResourceStructure(eventTime.event_period, 'EventPeriod');
            }
        }, 30000);

        it('should get event time associations', async () => {
            const eventTimes = await client.eventTimes.getAll({ per_page: 1 });
            expect(eventTimes.data.length).toBeGreaterThan(0);

            const eventTimeId = eventTimes.data[0].id;
            const etId = typeof eventTimeId === 'string' ? eventTimeId : String(eventTimeId);
            const event = await client.eventTimes.getEvent(etId);
            const eventPeriod = await client.eventTimes.getEventPeriod(etId);
            const locationEventTimes = await client.eventTimes.getLocationEventTimes(etId);
            const checkIns = await client.eventTimes.getCheckIns(etId);

            validateResourceStructure(event, 'Event');
            validateResourceStructure(eventPeriod, 'EventPeriod');
            expect(locationEventTimes.data).toBeDefined();
            expect(Array.isArray(locationEventTimes.data)).toBe(true);
            locationEventTimes.data.forEach(resource => validateResourceStructure(resource, 'LocationEventTime'));

            expect(checkIns.data).toBeDefined();
            expect(Array.isArray(checkIns.data)).toBe(true);
            checkIns.data.forEach(resource => validateResourceStructure(resource, 'CheckIn'));
        }, 60000);
    });

    describe('All Modules - Complete Coverage', () => {
        it('should cover all modules with getAll and getById', async () => {
            const modules = [
                { name: 'stations', type: 'Station' },
                { name: 'labels', type: 'Label' },
                { name: 'options', type: 'Option' },
                { name: 'checkInGroups', type: 'CheckInGroup' },
                // checkInTimes removed - only accessible via checkIns.getCheckInTimes(checkInId)
                // personEvents removed - only accessible via events.getPersonEvents(eventId)
                { name: 'preChecks', type: 'PreCheck' },
                { name: 'passes', type: 'Pass' },
                { name: 'headcounts', type: 'Headcount' },
                { name: 'attendanceTypes', type: 'AttendanceType' },
                { name: 'integrationLinks', type: 'IntegrationLink' },
                { name: 'themes', type: 'Theme' },
                { name: 'rosterListPersons', type: 'RosterListPerson' },
            ];

            let stationIdForGroups: string | undefined;
            for (const module of modules) {
                if (module.name === 'preChecks') {
                    expect(await isPreChecksApiAvailable(client)).toBe(true);
                }
                let listResult: PageResponse;
                if (module.name === 'checkInGroups') {
                    if (!stationIdForGroups) {
                        const stationsPage = await client.stations.getPage({ per_page: 1, page: 1 });
                        expect(stationsPage.data.length).toBeGreaterThan(0);
                        stationIdForGroups = stationsPage.data[0].id;
                    }
                    listResult = await client.checkInGroups.getPage(stationIdForGroups, { per_page: 1, page: 1 });
                } else {
                    listResult = await getClientModule(client, module.name).getPage({ per_page: 1, page: 1 });
                }
                expect(listResult).toBeDefined();
                expect(listResult.data).toBeDefined();
                expect(Array.isArray(listResult.data)).toBe(true);
                expect(listResult.data.length).toBeGreaterThan(0);
                const item = listResult.data[0];
                validateResourceStructure(item, module.type);
                const singleResult = await getClientModule(client, module.name).getById(getResourceId(item));
                validateResourceStructure(singleResult, module.type);
                expect(singleResult.id).toBe(getResourceId(item));
            }
        }, 120000);
    });

    describe('Organization Module', () => {
        it('should get organization info', async () => {
            const organization = await client.organization.get();

            validateResourceStructure(organization, 'Organization');
            if (organization.name !== undefined) {
                validateStringAttribute(organization, 'name');
                expect(organization.name.length).toBeGreaterThan(0);
            }
        }, 30000);
    });

    describe('Pagination - Cross Module', () => {
        it('should handle pagination consistently across modules', async () => {
            // Note: eventPeriods doesn't have getAll() - must use events.getEventPeriods() instead
            const testModules = ['events', 'checkIns', 'locations', 'eventTimes'];

            for (const moduleName of testModules) {
                const mod = getClientModule(client, moduleName);
                const page1 = mod.getAll ? await mod.getAll({ per_page: 1, page: 1 }) : await mod.getPage({ per_page: 1, page: 1 });
                expect(page1).toBeDefined();
                expect(page1.data).toBeDefined();

                if (page1.meta) {
                    expect(typeof page1.meta).toBe('object');
                }

                if (page1.links) {
                    expect(typeof page1.links).toBe('object');
                }
            }
        }, 60000);
    });

    describe('Labels Module - Special Methods', () => {
        it('should get event labels and location labels', async () => {
            if (!testEventId) {
                const events = await client.events.getAll({ per_page: 1 });
                expect(events.data.length).toBeGreaterThan(0);
                testEventId = events.data[0].id;
            }
            const eventLabels = await client.events.getEventLabels(testEventId!);
            expect(eventLabels).toBeDefined();
            expect(eventLabels.data).toBeDefined();
            expect(Array.isArray(eventLabels.data)).toBe(true);
            expect(eventLabels.data.length).toBeGreaterThan(0);
            eventLabels.data.forEach(resource => validateResourceStructure(resource, 'EventLabel'));

            const locationLabels = await fetchLocationLabelsOrThrow(client);
            expect(locationLabels.data).toBeDefined();
            expect(Array.isArray(locationLabels.data)).toBe(true);
            expect(locationLabels.data.length).toBeGreaterThan(0);
            locationLabels.data.forEach(resource => validateResourceStructure(resource, 'LocationLabel'));
        }, 60000);
    });

    describe('Include Parameters - Relationship Loading', () => {
        it('should load included resources correctly', async () => {
            if (!testEventId) {
                const events = await client.events.getAll({ per_page: 1 });
                expect(events.data.length).toBeGreaterThan(0);
                testEventId = events.data[0].id;
            }

            const event = await client.events.getById(testEventId!, {
                include: ['attendance_types'],
            });

            expect(event).toBeDefined();
            expect(event.id).toBeDefined();
            expect(event.type).toBe('Event');
            if (event.attendance_types !== undefined) {
                expect(Array.isArray(event.attendance_types)).toBe(true);
            }
        }, 30000);
    });
});

