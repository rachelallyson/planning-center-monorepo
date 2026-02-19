/**
 * Check-ins API URL Verification Integration Tests
 * 
 * These tests verify that all Check-ins API endpoints are correctly constructed and accessible.
 * They make real API calls to ensure URLs, parameters, and response structures are correct.
 * 
 * To run: npm run test:integration -- --testNamePattern="URL Verification"
 */

import { PcoCheckInsClient } from '../../src';
import { createTestClient, logAuthStatus, isPreChecksApiAvailable } from './test-config';

describe('Check-ins API URL Verification Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

    }, 30000);

    describe('Events API URL Verification', () => {
        it('should access events list endpoint with correct URL structure', async () => {
            const response = await client.events.getAll({ per_page: 1 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
            expect(response).toHaveProperty('links');
            expect(response).toHaveProperty('meta');
        }, 30000);

        it('should access events list with filtering parameters', async () => {
            const response = await client.events.getAll({
                where: { name: 'Test' },
                include: ['attendance_types'],
                per_page: 5,
                page: 1
            });

            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single event endpoint with correct URL structure', async () => {
            const eventsResponse = await client.events.getPage({ per_page: 1, page: 1 });
            expect(eventsResponse.data.length).toBeGreaterThan(0);
            const eventId = eventsResponse.data[0].id;
            const event = await client.events.getById(eventId);
            expect(event).toBeDefined();
            expect(event.type).toBe('Event');
            expect(event.id).toBe(eventId);
        }, 30000);

        it('should access event attendance types endpoint', async () => {
            const eventsResponse = await client.events.getPage({ per_page: 1, page: 1 });
            expect(eventsResponse.data.length).toBeGreaterThan(0);
            const eventId = eventsResponse.data[0].id;
            const response = await client.events.getAttendanceTypes(eventId);
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access event check-ins endpoint', async () => {
            const eventsResponse = await client.events.getPage({ per_page: 1, page: 1 });
            expect(eventsResponse.data.length).toBeGreaterThan(0);
            const eventId = eventsResponse.data[0].id;
            const response = await client.events.getCheckIns(eventId, { per_page: 10 });
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 35000);

        it('should access event current event times endpoint', async () => {
            const eventsResponse = await client.events.getPage({ per_page: 1, page: 1 });
            expect(eventsResponse.data.length).toBeGreaterThan(0);
            const eventId = eventsResponse.data[0].id;
            const response = await client.events.getCurrentEventTimes(eventId);
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access event labels endpoint', async () => {
            const eventsResponse = await client.events.getPage({ per_page: 1, page: 1 });
            expect(eventsResponse.data.length).toBeGreaterThan(0);
            const eventId = eventsResponse.data[0].id;
            const response = await client.events.getEventLabels(eventId);
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access event periods endpoint', async () => {
            const eventsResponse = await client.events.getPage({ per_page: 1, page: 1 });
            expect(eventsResponse.data.length).toBeGreaterThan(0);
            const eventId = eventsResponse.data[0].id;
            const response = await client.events.getEventPeriods(eventId);
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access event integration links endpoint', async () => {
            const eventsResponse = await client.events.getPage({ per_page: 1, page: 1 });
            expect(eventsResponse.data.length).toBeGreaterThan(0);
            const eventId = eventsResponse.data[0].id;
            const response = await client.events.getIntegrationLinks(eventId);
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access event locations endpoint', async () => {
            const eventsResponse = await client.events.getPage({ per_page: 1, page: 1 });
            expect(eventsResponse.data.length).toBeGreaterThan(0);
            const eventId = eventsResponse.data[0].id;
            const response = await client.events.getLocations(eventId);
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access event person events endpoint', async () => {
            const eventsResponse = await client.events.getPage({ per_page: 1, page: 1 });
            expect(eventsResponse.data.length).toBeGreaterThan(0);
            const eventId = eventsResponse.data[0].id;
            const response = await client.events.getPersonEvents(eventId);
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);
    });

    describe('Check-ins API URL Verification', () => {
        it('should access check-ins list endpoint', async () => {
            const response = await client.checkIns.getAll({ per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access check-ins list with filtering', async () => {
            const response = await client.checkIns.getAll({
                filter: ['attendee', 'not_checked_out'],
                per_page: 5
            });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single check-in endpoint', async () => {
            const checkInsResponse = await client.checkIns.getPage({ per_page: 1, page: 1 });
            expect(checkInsResponse.data.length).toBeGreaterThan(0);
            const checkInId = checkInsResponse.data[0].id;
            const checkIn = await client.checkIns.getById(checkInId, { include: ['event', 'event_period'] });
            expect(checkIn).toBeDefined();
            expect(checkIn.type).toBe('CheckIn');
            expect(checkIn.id).toBe(checkInId);
        }, 30000);
    });

    describe('Locations API URL Verification', () => {
        it('should access locations list endpoint', async () => {
            const response = await client.locations.getAll({ per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single location endpoint', async () => {
            const locationsResponse = await client.locations.getPage({ per_page: 1, page: 1 });
            expect(locationsResponse.data.length).toBeGreaterThan(0);
            const locationId = locationsResponse.data[0].id;
            const location = await client.locations.getById(locationId, { include: ['event'] });
            expect(location).toBeDefined();
            expect(location.type).toBe('Location');
            expect(location.id).toBe(locationId);
        }, 30000);
    });

    describe('Event Periods API URL Verification', () => {
        it('should access event periods via event associations', async () => {
            // Event periods must be accessed through events
            const events = await client.events.getAll({ per_page: 1 });
            expect(events.data.length).toBeGreaterThan(0);

            const eventId = events.data[0].id;
            const response = await client.events.getEventPeriods(eventId);

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
            expect(response.data.length).toBeGreaterThan(0);
            const eventPeriod = response.data[0];
            expect(eventPeriod).toBeDefined();
            expect(eventPeriod.type).toBe('EventPeriod');
            expect(eventPeriod.id).toBeDefined();
        }, 30000);
    });

    describe('Event Times API URL Verification', () => {
        it('should access event times list endpoint', async () => {
            const response = await client.eventTimes.getAll({ per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single event time endpoint', async () => {
            const eventTimesResponse = await client.eventTimes.getPage({ per_page: 1, page: 1 });
            expect(eventTimesResponse.data.length).toBeGreaterThan(0);
            const eventTimeId = eventTimesResponse.data[0].id
            const eventTime = await client.eventTimes.getById(eventTimeId, { include: ['event', 'event_period'] });
            expect(eventTime).toBeDefined();
            expect(eventTime.type).toBe('EventTime');
            expect(eventTime.id).toBe(eventTimeId);
        }, 30000);
    });

    describe('Stations API URL Verification', () => {
        it('should access stations list endpoint', async () => {
            const response = await client.stations.getAll({ per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single station endpoint', async () => {
            const stationsResponse = await client.stations.getPage({ per_page: 1, page: 1 });
            expect(stationsResponse.data).toBeDefined();
            expect(Array.isArray(stationsResponse.data)).toBe(true);
            expect(stationsResponse.data.length).toBeGreaterThan(0);
            const stationId = stationsResponse.data[0].id;
            const station = await client.stations.getById(stationId);
            expect(station).toBeDefined();
            expect(station.type).toBe('Station');
            expect(station.id).toBe(stationId);
        }, 30000);
    });

    describe('Labels API URL Verification', () => {
        it('should access labels list endpoint', async () => {
            const response = await client.labels.getAll({ per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single label endpoint', async () => {
            const labelsResponse = await client.labels.getPage({ per_page: 1, page: 1 });
            expect(labelsResponse.data.length).toBeGreaterThan(0);
            const labelId = labelsResponse.data[0].id;
            const label = await client.labels.getById(labelId);
            expect(label).toBeDefined();
            expect(label.type).toBe('Label');
            expect(label.id).toBe(labelId);
        }, 30000);
    });

    describe('Options API URL Verification', () => {
        it('should access options list endpoint', async () => {
            const response = await client.options.getAll({ per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single option endpoint', async () => {
            const optionsResponse = await client.options.getPage({ per_page: 1, page: 1 });
            expect(optionsResponse.data).toBeDefined();
            expect(Array.isArray(optionsResponse.data)).toBe(true);
            expect(optionsResponse.data.length).toBeGreaterThan(0);
            const optionId = optionsResponse.data[0].id;
            const option = await client.options.getById(optionId);
            expect(option).toBeDefined();
            expect(option.type).toBe('Option');
            expect(option.id).toBe(optionId);
        }, 30000);
    });

    describe('Check-in Groups API URL Verification', () => {
        it('should access check-in groups list endpoint', async () => {
            const stationsPage = await client.stations.getPage({ per_page: 1, page: 1 });
            expect(stationsPage.data.length).toBeGreaterThan(0);
            const stationId = stationsPage.data[0].id;
            const response = await client.checkInGroups.getPage(stationId, { per_page: 5, page: 1 });
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single check-in group endpoint', async () => {
            const stationsPage = await client.stations.getPage({ per_page: 1, page: 1 });
            expect(stationsPage.data.length).toBeGreaterThan(0);
            const stationId = stationsPage.data[0].id;
            const checkInGroupsResponse = await client.checkInGroups.getPage(stationId, { per_page: 1, page: 1 });
            expect(checkInGroupsResponse.data.length).toBeGreaterThan(0);
            const checkInGroupId = checkInGroupsResponse.data[0].id;
            const checkInGroup = await client.checkInGroups.getById(checkInGroupId);
            expect(checkInGroup).toBeDefined();
            expect(checkInGroup.type).toBe('CheckInGroup');
            expect(checkInGroup.id).toBe(checkInGroupId);
        }, 30000);
    });

    describe('Check-in Times API URL Verification', () => {
        it('should access check-in times list endpoint', async () => {
            const checkInsPage = await client.checkIns.getPage({ per_page: 5 });
            expect(checkInsPage.data.length).toBeGreaterThan(0);
            const checkInId = checkInsPage.data[0].id;
            const response = await client.checkIns.getCheckInTimes(checkInId);
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single check-in time endpoint', async () => {
            const checkInsPage = await client.checkIns.getPage({ per_page: 1 });
            expect(checkInsPage.data.length).toBeGreaterThan(0);
            const checkInTimesResponse = await client.checkIns.getCheckInTimes(checkInsPage.data[0].id);
            expect(checkInTimesResponse.data.length).toBeGreaterThan(0);
            const checkInTime = checkInTimesResponse.data[0];
            expect(checkInTime).toBeDefined();
            expect(checkInTime.type).toBe('CheckInTime');
            expect(checkInTime.id).toBeDefined();
        }, 30000);
    });

    describe('Person Events API URL Verification', () => {
        it('should access person events list endpoint', async () => {
            const eventsPage = await client.events.getPage({ per_page: 5 });
            expect(eventsPage.data.length).toBeGreaterThan(0);
            const eventId = eventsPage.data[0].id;
            const response = await client.events.getPersonEvents(eventId);
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single person event endpoint', async () => {
            const eventsPage = await client.events.getPage({ per_page: 1 });
            expect(eventsPage.data.length).toBeGreaterThan(0);
            const personEventsResponse = await client.events.getPersonEvents(eventsPage.data[0].id);
            expect(personEventsResponse.data.length).toBeGreaterThan(0);
            const personEvent = personEventsResponse.data[0];
            expect(personEvent).toBeDefined();
            expect(personEvent.type).toBe('PersonEvent');
            expect(personEvent.id).toBeDefined();
        }, 30000);
    });

    describe('Pre-checks API URL Verification', () => {
        it('should access pre-checks list endpoint', async () => {
            expect(await isPreChecksApiAvailable(client)).toBe(true);
            const response = await client.preChecks.getPage({ per_page: 5, page: 1 });
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single pre-check endpoint', async () => {
            expect(await isPreChecksApiAvailable(client)).toBe(true);
            const preChecksResponse = await client.preChecks.getPage({ per_page: 1, page: 1 });
            expect(preChecksResponse.data.length).toBeGreaterThan(0);
            const preCheckId = preChecksResponse.data[0].id;
            const preCheck = await client.preChecks.getById(preCheckId);
            expect(preCheck).toBeDefined();
            expect(preCheck.type).toBe('PreCheck');
            expect(preCheck.id).toBe(preCheckId);
        }, 30000);
    });

    describe('Passes API URL Verification', () => {
        it('should access passes list endpoint', async () => {
            const response = await client.passes.getAll({ per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single pass endpoint', async () => {
            const passesResponse = await client.passes.getPage({ per_page: 1, page: 1 });
            expect(passesResponse.data).toBeDefined();
            expect(Array.isArray(passesResponse.data)).toBe(true);
            expect(passesResponse.data.length).toBeGreaterThan(0);
            const passId = passesResponse.data[0].id;
            const pass = await client.passes.getById(passId);
            expect(pass).toBeDefined();
            expect(pass.type).toBe('Pass');
            expect(pass.id).toBe(passId);
        }, 30000);
    });

    describe('Headcounts API URL Verification', () => {
        it('should access headcounts list endpoint', async () => {
            const response = await client.headcounts.getAll({ per_page: 5 });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single headcount endpoint', async () => {
            const headcountsResponse = await client.headcounts.getPage({ per_page: 1, page: 1 });
            expect(headcountsResponse.data).toBeDefined();
            expect(Array.isArray(headcountsResponse.data)).toBe(true);
            expect(headcountsResponse.data.length).toBeGreaterThan(0);
            const headcountId = headcountsResponse.data[0].id;
            const headcount = await client.headcounts.getById(headcountId);
            expect(headcount).toBeDefined();
            expect(headcount.type).toBe('Headcount');
            expect(headcount.id).toBe(headcountId);
        }, 30000);
    });

    describe('Error Handling URL Verification', () => {
        it('should handle 404 errors gracefully', async () => {
            await expect(client.events.getById('nonexistent-id')).rejects.toThrow();
        }, 30000);

        it('should handle invalid parameters gracefully', async () => {
            await expect(client.events.getAll({
                where: { name: 'invalid_value' },
                per_page: 1,
            })).resolves.toBeDefined();
        }, 30000);
    });
});
