/**
 * Check-ins API Endpoint Coverage Integration Tests
 * 
 * These tests verify that all major Check-ins API endpoints are accessible and return expected data structures.
 * They provide comprehensive coverage of the Check-ins API functionality.
 * 
 * To run: npm run test:integration -- --testNamePattern="Endpoint Coverage"
 */

import { PcoCheckInsClient } from '../../src';
import { createTestClient, logAuthStatus, isPreChecksApiAvailable } from './test-config';

describe('Check-ins API Endpoint Coverage Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

    }, 30000);

    describe('Events Module Endpoint Coverage', () => {
        it('should cover events endpoints', async () => {
            // READ - List
            const events = await client.events.getPage({ perPage: 10, page: 1 });
            expect(events.data).toBeDefined();
            expect(Array.isArray(events.data)).toBe(true);
            expect(events.data.length).toBeGreaterThan(0);

            const eventId = events.data[0].id;

            // READ - Single
            const event = await client.events.getById(eventId, ['locations', 'event_periods']);
            expect(event.type).toBe('Event');
            expect(event.id).toBe(eventId);

            // Test event associations
            const attendanceTypes = await client.events.getAttendanceTypes(eventId);
            expect(attendanceTypes.data).toBeDefined();
            expect(Array.isArray(attendanceTypes.data)).toBe(true);

            const checkIns = await client.events.getCheckIns(eventId, { filter: ['attendee'] });
            expect(checkIns.data).toBeDefined();
            expect(Array.isArray(checkIns.data)).toBe(true);

            const currentEventTimes = await client.events.getCurrentEventTimes(eventId);
            expect(currentEventTimes.data).toBeDefined();
            expect(Array.isArray(currentEventTimes.data)).toBe(true);

            const eventLabels = await client.events.getEventLabels(eventId);
            expect(eventLabels.data).toBeDefined();
            expect(Array.isArray(eventLabels.data)).toBe(true);

            const eventPeriods = await client.events.getEventPeriods(eventId);
            expect(eventPeriods.data).toBeDefined();
            expect(Array.isArray(eventPeriods.data)).toBe(true);

            const integrationLinks = await client.events.getIntegrationLinks(eventId);
            expect(integrationLinks.data).toBeDefined();
            expect(Array.isArray(integrationLinks.data)).toBe(true);

            const locations = await client.events.getLocations(eventId);
            expect(locations.data).toBeDefined();
            expect(Array.isArray(locations.data)).toBe(true);

            const personEvents = await client.events.getPersonEvents(eventId);
            expect(personEvents.data).toBeDefined();
            expect(Array.isArray(personEvents.data)).toBe(true);
        }, 60000);
    });

    describe('Check-ins Module Endpoint Coverage', () => {
        it('should cover check-ins endpoints', async () => {
            // READ - List
            const checkIns = await client.checkIns.getAll({ perPage: 10 });
            expect(checkIns.data).toBeDefined();
            expect(Array.isArray(checkIns.data)).toBe(true);

            // READ - List with filters
            const filteredCheckIns = await client.checkIns.getAll({
                filter: ['attendee', 'not_checked_out'],
                perPage: 5
            });
            expect(filteredCheckIns.data).toBeDefined();
            expect(Array.isArray(filteredCheckIns.data)).toBe(true);

            expect(checkIns.data.length).toBeGreaterThan(0);
            const checkInId = checkIns.data[0].id;

            // READ - Single
            const checkIn = await client.checkIns.getById(checkInId, ['person', 'event']);
            expect(checkIn.type).toBe('CheckIn');
            expect(checkIn.id).toBe(checkInId);
        }, 30000);
    });

    describe('Locations Module Endpoint Coverage', () => {
        it('should cover locations endpoints', async () => {
            // READ - List
            const locations = await client.locations.getPage({ perPage: 10, page: 1 });
            expect(locations.data).toBeDefined();
            expect(Array.isArray(locations.data)).toBe(true);
            expect(locations.data.length).toBeGreaterThan(0);

            const locationId = locations.data[0].id;

            // READ - Single
            const location = await client.locations.getById(locationId, ['event']);
            expect(location.type).toBe('Location');
            expect(location.id).toBe(locationId);
        }, 30000);
    });

    describe('Event Periods Module Endpoint Coverage', () => {
        it('should cover event periods endpoints via event associations', async () => {
            // Event periods must be accessed through events
            const events = await client.events.getAll({ perPage: 1 });
            expect(events.data.length).toBeGreaterThan(0);
            
            const eventId = events.data[0].id;
            const eventPeriods = await client.events.getEventPeriods(eventId);
            expect(eventPeriods.data).toBeDefined();
            expect(Array.isArray(eventPeriods.data)).toBe(true);
            expect(eventPeriods.data.length).toBeGreaterThan(0);

            const eventPeriod = eventPeriods.data[0];
            expect(eventPeriod.type).toBe('EventPeriod');
            expect(eventPeriod.id).toBeDefined();
        }, 30000);
    });

    describe('Event Times Module Endpoint Coverage', () => {
        it('should cover event times endpoints', async () => {
            // READ - List
            const eventTimes = await client.eventTimes.getPage({ perPage: 10, page: 1 });
            expect(eventTimes.data).toBeDefined();
            expect(Array.isArray(eventTimes.data)).toBe(true);
            expect(eventTimes.data.length).toBeGreaterThan(0);

            const eventTimeId = eventTimes.data[0].id;

            // READ - Single
            const eventTime = await client.eventTimes.getById(eventTimeId, ['event', 'event_period']);
            expect(eventTime.type).toBe('EventTime');
            expect(eventTime.id).toBe(eventTimeId);
        }, 30000);
    });

    describe('Stations Module Endpoint Coverage', () => {
        it('should cover stations endpoints', async () => {
            // READ - List
            const stations = await client.stations.getPage({ perPage: 10, page: 1 });
            expect(stations.data).toBeDefined();
            expect(Array.isArray(stations.data)).toBe(true);
            expect(stations.data.length).toBeGreaterThan(0);

            const stationId = stations.data[0].id;

            // READ - Single
            const station = await client.stations.getById(stationId);
            expect(station.type).toBe('Station');
            expect(station.id).toBe(stationId);
        }, 30000);
    });

    describe('Labels Module Endpoint Coverage', () => {
        it('should cover labels endpoints', async () => {
            // READ - List
            const labels = await client.labels.getPage({ perPage: 10, page: 1 });
            expect(labels.data).toBeDefined();
            expect(Array.isArray(labels.data)).toBe(true);
            expect(labels.data.length).toBeGreaterThan(0);

            const labelId = labels.data[0].id;

            // READ - Single
            const label = await client.labels.getById(labelId);
            expect(label.type).toBe('Label');
            expect(label.id).toBe(labelId);
        }, 30000);
    });

    describe('Options Module Endpoint Coverage', () => {
        it('should cover options endpoints', async () => {
            // READ - List
            const options = await client.options.getPage({ perPage: 10, page: 1 });
            expect(options.data).toBeDefined();
            expect(Array.isArray(options.data)).toBe(true);
            expect(options.data.length).toBeGreaterThan(0);

            const optionId = options.data[0].id;

            // READ - Single
            const option = await client.options.getById(optionId);
            expect(option.type).toBe('Option');
            expect(option.id).toBe(optionId);
        }, 30000);
    });

    describe('Check-in Groups Module Endpoint Coverage', () => {
        it('should cover check-in groups endpoints', async () => {
            const stationsPage = await client.stations.getPage({ perPage: 1, page: 1 });
            expect(stationsPage.data.length).toBeGreaterThan(0);
            const stationId = stationsPage.data[0].id;
            const checkInGroups = await client.checkInGroups.getPage({ stationId, perPage: 10, page: 1 });
            expect(checkInGroups.data).toBeDefined();
            expect(Array.isArray(checkInGroups.data)).toBe(true);
            expect(checkInGroups.data.length).toBeGreaterThan(0);
            const checkInGroupId = checkInGroups.data[0].id;
            const checkInGroup = await client.checkInGroups.getById(checkInGroupId);
            expect(checkInGroup.type).toBe('CheckInGroup');
            expect(checkInGroup.id).toBe(checkInGroupId);
        }, 30000);
    });

    describe('Check-in Times Module Endpoint Coverage', () => {
        it('should cover check-in times endpoints', async () => {
            const checkInsPage = await client.checkIns.getPage({ perPage: 10 });
            expect(checkInsPage.data.length).toBeGreaterThan(0);
            const checkInTimes = await client.checkIns.getCheckInTimes(checkInsPage.data[0].id);
            expect(checkInTimes.data).toBeDefined();
            expect(Array.isArray(checkInTimes.data)).toBe(true);
            expect(checkInTimes.data.length).toBeGreaterThan(0);
            const checkInTime = checkInTimes.data[0];
            expect(checkInTime.type).toBe('CheckInTime');
            expect(checkInTime.id).toBeDefined();
        }, 30000);
    });

    describe('Person Events Module Endpoint Coverage', () => {
        it('should cover person events endpoints', async () => {
            const eventsPage = await client.events.getPage({ perPage: 10 });
            expect(eventsPage.data.length).toBeGreaterThan(0);
            const personEvents = await client.events.getPersonEvents(eventsPage.data[0].id);
            expect(personEvents.data).toBeDefined();
            expect(Array.isArray(personEvents.data)).toBe(true);
            expect(personEvents.data.length).toBeGreaterThan(0);
            const personEvent = personEvents.data[0];
            expect(personEvent.type).toBe('PersonEvent');
            expect(personEvent.id).toBeDefined();
        }, 30000);
    });

    describe('Pre-checks Module Endpoint Coverage', () => {
        it('should cover pre-checks endpoints', async () => {
            if (!(await isPreChecksApiAvailable(client))) return;
            const preChecks = await client.preChecks.getPage({ perPage: 10, page: 1 });
            expect(preChecks.data).toBeDefined();
            expect(Array.isArray(preChecks.data)).toBe(true);
            expect(preChecks.data.length).toBeGreaterThan(0);
            const preCheckId = preChecks.data[0].id;
            const preCheck = await client.preChecks.getById(preCheckId, ['event', 'person']);
            expect(preCheck.type).toBe('PreCheck');
            expect(preCheck.id).toBe(preCheckId);
        }, 30000);
    });

    describe('Passes Module Endpoint Coverage', () => {
        it('should cover passes endpoints', async () => {
            const passes = await client.passes.getPage({ perPage: 10, page: 1 });
            expect(passes.data).toBeDefined();
            expect(Array.isArray(passes.data)).toBe(true);
            expect(passes.data.length).toBeGreaterThan(0);
            const passId = passes.data[0].id;
            const pass = await client.passes.getById(passId);
            expect(pass.type).toBe('Pass');
            expect(pass.id).toBe(passId);
        }, 30000);
    });

    describe('Headcounts Module Endpoint Coverage', () => {
        it('should cover headcounts endpoints', async () => {
            const headcounts = await client.headcounts.getPage({ perPage: 10, page: 1 });
            expect(headcounts.data).toBeDefined();
            expect(Array.isArray(headcounts.data)).toBe(true);
            expect(headcounts.data.length).toBeGreaterThan(0);
            const headcountId = headcounts.data[0].id;
            const headcount = await client.headcounts.getById(headcountId);
            expect(headcount.type).toBe('Headcount');
            expect(headcount.id).toBe(headcountId);
        }, 30000);
    });

    describe('Pagination Coverage', () => {
        it('should cover pagination across all modules', async () => {
            const preChecksAvailable = await isPreChecksApiAvailable(client);
            const modules = [
                { name: 'events', method: 'getPage' },
                { name: 'checkIns', method: 'getPage' },
                { name: 'locations', method: 'getPage' },
                { name: 'eventTimes', method: 'getPage' },
                { name: 'stations', method: 'getPage' },
                { name: 'labels', method: 'getPage' },
                { name: 'options', method: 'getPage' },
                { name: 'checkInGroups', method: 'getPage' },
                ...(preChecksAvailable ? [{ name: 'preChecks', method: 'getPage' }] : []),
                { name: 'passes', method: 'getPage' },
                { name: 'headcounts', method: 'getPage' }
            ];

            let stationId: string | undefined;
            for (const module of modules) {
                if (module.name === 'checkInGroups') {
                    if (!stationId) {
                        const stationsPage = await client.stations.getPage({ perPage: 1, page: 1 });
                        expect(stationsPage.data.length).toBeGreaterThan(0);
                        stationId = stationsPage.data[0].id;
                    }
                }
                const params = module.name === 'checkInGroups' && stationId
                    ? { stationId, perPage: 2, page: 1 }
                    : { perPage: 2, page: 1 };
                const response = await (client as any)[module.name][module.method](params);
                expect(response).toHaveProperty('data');
                expect(response).toHaveProperty('links');
                expect(response).toHaveProperty('meta');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 60000);
    });

    describe('Include Parameter Coverage', () => {
        it('should cover include parameters across major endpoints', async () => {
            const eventsWithIncludes = await client.events.getAll({
                perPage: 1,
                include: ['locations', 'event_periods', 'attendance_types']
            });
            expect(eventsWithIncludes.data).toBeDefined();
            expect(eventsWithIncludes.data.length).toBeGreaterThan(0);

            const event = eventsWithIncludes.data[0];
            expect(event).toBeDefined();
            expect(event.id).toBeDefined();
            expect(event.type).toBe('Event');

            // Test single event with includes (flattened: included data at top level)
            const singleEvent = await client.events.getById(event.id, ['locations', 'event_periods']);
            expect(singleEvent).toBeDefined();
            expect(singleEvent.id).toBe(event.id);
        }, 30000);
    });

    describe('Filtering Coverage', () => {
        it('should cover where filtering across major endpoints', async () => {
            // Test events filtering
            const weeklyEvents = await client.events.getAll({
                where: { frequency: 'weekly' },
                perPage: 5
            });
            expect(weeklyEvents.data).toBeDefined();

            // Test check-ins filtering
            const attendeeCheckIns = await client.checkIns.getAll({
                filter: ['attendee'],
                perPage: 5
            });
            expect(attendeeCheckIns.data).toBeDefined();
        }, 30000);
    });

    describe('Event Association Coverage', () => {
        it('should cover all event association endpoints', async () => {
            const events = await client.events.getPage({ perPage: 1, page: 1 });
            expect(events.data.length).toBeGreaterThan(0);

            const eventId = events.data[0].id;
            const associations = [
                { name: 'attendanceTypes', method: 'getAttendanceTypes' },
                { name: 'checkIns', method: 'getCheckIns' },
                { name: 'currentEventTimes', method: 'getCurrentEventTimes' },
                { name: 'eventLabels', method: 'getEventLabels' },
                { name: 'eventPeriods', method: 'getEventPeriods' },
                { name: 'integrationLinks', method: 'getIntegrationLinks' },
                { name: 'locations', method: 'getLocations' },
                { name: 'personEvents', method: 'getPersonEvents' }
            ];

            for (const association of associations) {
                const response = await (client.events as any)[association.method](eventId);
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 60000);
    });

    describe('Batch Operations Coverage', () => {
        it('should cover batch operations', async () => {
            const batch = client.batch;
            expect(batch).toBeDefined();

            // Test batch execution
            const operations = [
                {
                    type: 'events',
                    method: 'getAll',
                    params: [{ perPage: 1 }]
                }
            ];

            const summary = await batch.execute(operations);
            expect(summary).toBeDefined();
            expect(summary.results).toBeDefined();
            expect(Array.isArray(summary.results)).toBe(true);
        }, 30000);
    });
});
