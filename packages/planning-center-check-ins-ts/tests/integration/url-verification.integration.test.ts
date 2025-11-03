/**
 * Check-ins API URL Verification Integration Tests
 * 
 * These tests verify that all Check-ins API endpoints are correctly constructed and accessible.
 * They make real API calls to ensure URLs, parameters, and response structures are correct.
 * 
 * To run: npm run test:integration -- --testNamePattern="URL Verification"
 */

import { PcoCheckInsClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

describe('Check-ins API URL Verification Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Add request monitoring
        client.on('request:start', (event) => {
            console.log(`🌐 ${event.method} ${event.endpoint}`);
        });
        client.on('request:complete', (event) => {
            console.log(`✅ ${event.method} ${event.endpoint} - ${event.status} (${event.duration}ms)`);
        });
        client.on('error', (event) => {
            console.error(`❌ ${event.method} ${event.endpoint} - ${event.error.message}`);
        });
    }, 30000);

    describe('Events API URL Verification', () => {
        it('should access events list endpoint with correct URL structure', async () => {
            const response = await client.events.getAll({ perPage: 1 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
            expect(response).toHaveProperty('links');
            expect(response).toHaveProperty('meta');
        }, 30000);

        it('should access events list with filtering parameters', async () => {
            const response = await client.events.getAll({
                where: { frequency: 'weekly' },
                include: ['locations', 'event_periods'],
                perPage: 5,
                page: 1
            });
            
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single event endpoint with correct URL structure', async () => {
            // First get an event ID
            const eventsResponse = await client.events.getAll({ perPage: 1 });
            if (eventsResponse.data.length > 0) {
                const eventId = eventsResponse.data[0].id;
                const event = await client.events.getById(eventId, ['locations', 'event_periods']);
                
                expect(event).toBeDefined();
                expect(event.type).toBe('Event');
                expect(event.id).toBe(eventId);
            }
        }, 30000);

        it('should access event attendance types endpoint', async () => {
            // First get an event ID
            const eventsResponse = await client.events.getAll({ perPage: 1 });
            if (eventsResponse.data.length > 0) {
                const eventId = eventsResponse.data[0].id;
                const response = await client.events.getAttendanceTypes(eventId);
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access event check-ins endpoint', async () => {
            // First get an event ID
            const eventsResponse = await client.events.getAll({ perPage: 1 });
            if (eventsResponse.data.length > 0) {
                const eventId = eventsResponse.data[0].id;
                const response = await client.events.getCheckIns(eventId, { filter: ['attendee'] });
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access event current event times endpoint', async () => {
            // First get an event ID
            const eventsResponse = await client.events.getAll({ perPage: 1 });
            if (eventsResponse.data.length > 0) {
                const eventId = eventsResponse.data[0].id;
                const response = await client.events.getCurrentEventTimes(eventId);
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access event labels endpoint', async () => {
            // First get an event ID
            const eventsResponse = await client.events.getAll({ perPage: 1 });
            if (eventsResponse.data.length > 0) {
                const eventId = eventsResponse.data[0].id;
                const response = await client.events.getEventLabels(eventId);
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access event periods endpoint', async () => {
            // First get an event ID
            const eventsResponse = await client.events.getAll({ perPage: 1 });
            if (eventsResponse.data.length > 0) {
                const eventId = eventsResponse.data[0].id;
                const response = await client.events.getEventPeriods(eventId);
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access event integration links endpoint', async () => {
            // First get an event ID
            const eventsResponse = await client.events.getAll({ perPage: 1 });
            if (eventsResponse.data.length > 0) {
                const eventId = eventsResponse.data[0].id;
                const response = await client.events.getIntegrationLinks(eventId);
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access event locations endpoint', async () => {
            // First get an event ID
            const eventsResponse = await client.events.getAll({ perPage: 1 });
            if (eventsResponse.data.length > 0) {
                const eventId = eventsResponse.data[0].id;
                const response = await client.events.getLocations(eventId);
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access event person events endpoint', async () => {
            // First get an event ID
            const eventsResponse = await client.events.getAll({ perPage: 1 });
            if (eventsResponse.data.length > 0) {
                const eventId = eventsResponse.data[0].id;
                const response = await client.events.getPersonEvents(eventId);
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);
    });

    describe('Check-ins API URL Verification', () => {
        it('should access check-ins list endpoint', async () => {
            const response = await client.checkIns.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access check-ins list with filtering', async () => {
            const response = await client.checkIns.getAll({
                filter: ['attendee', 'not_checked_out'],
                perPage: 5
            });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single check-in endpoint', async () => {
            // First get a check-in ID
            const checkInsResponse = await client.checkIns.getAll({ perPage: 1 });
            if (checkInsResponse.data.length > 0) {
                const checkInId = checkInsResponse.data[0].id;
                const checkIn = await client.checkIns.getById(checkInId, ['person', 'event']);
                
                expect(checkIn).toBeDefined();
                expect(checkIn.type).toBe('CheckIn');
                expect(checkIn.id).toBe(checkInId);
            }
        }, 30000);
    });

    describe('Locations API URL Verification', () => {
        it('should access locations list endpoint', async () => {
            const response = await client.locations.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single location endpoint', async () => {
            // First get a location ID
            const locationsResponse = await client.locations.getAll({ perPage: 1 });
            if (locationsResponse.data.length > 0) {
                const locationId = locationsResponse.data[0].id;
                const location = await client.locations.getById(locationId, ['event']);
                
                expect(location).toBeDefined();
                expect(location.type).toBe('Location');
                expect(location.id).toBe(locationId);
            }
        }, 30000);
    });

    describe('Event Periods API URL Verification', () => {
        it('should access event periods list endpoint', async () => {
            const response = await client.eventPeriods.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single event period endpoint', async () => {
            // First get an event period ID
            const eventPeriodsResponse = await client.eventPeriods.getAll({ perPage: 1 });
            if (eventPeriodsResponse.data.length > 0) {
                const eventPeriodId = eventPeriodsResponse.data[0].id;
                const eventPeriod = await client.eventPeriods.getById(eventPeriodId, ['event']);
                
                expect(eventPeriod).toBeDefined();
                expect(eventPeriod.type).toBe('EventPeriod');
                expect(eventPeriod.id).toBe(eventPeriodId);
            }
        }, 30000);
    });

    describe('Event Times API URL Verification', () => {
        it('should access event times list endpoint', async () => {
            const response = await client.eventTimes.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single event time endpoint', async () => {
            // First get an event time ID
            const eventTimesResponse = await client.eventTimes.getAll({ perPage: 1 });
            if (eventTimesResponse.data.length > 0) {
                const eventTimeId = eventTimesResponse.data[0].id;
                const eventTime = await client.eventTimes.getById(eventTimeId, ['event', 'event_period']);
                
                expect(eventTime).toBeDefined();
                expect(eventTime.type).toBe('EventTime');
                expect(eventTime.id).toBe(eventTimeId);
            }
        }, 30000);
    });

    describe('Stations API URL Verification', () => {
        it('should access stations list endpoint', async () => {
            const response = await client.stations.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single station endpoint', async () => {
            // First get a station ID
            const stationsResponse = await client.stations.getAll({ perPage: 1 });
            if (stationsResponse.data.length > 0) {
                const stationId = stationsResponse.data[0].id;
                const station = await client.stations.getById(stationId);
                
                expect(station).toBeDefined();
                expect(station.type).toBe('Station');
                expect(station.id).toBe(stationId);
            }
        }, 30000);
    });

    describe('Labels API URL Verification', () => {
        it('should access labels list endpoint', async () => {
            const response = await client.labels.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single label endpoint', async () => {
            // First get a label ID
            const labelsResponse = await client.labels.getAll({ perPage: 1 });
            if (labelsResponse.data.length > 0) {
                const labelId = labelsResponse.data[0].id;
                const label = await client.labels.getById(labelId);
                
                expect(label).toBeDefined();
                expect(label.type).toBe('Label');
                expect(label.id).toBe(labelId);
            }
        }, 30000);
    });

    describe('Options API URL Verification', () => {
        it('should access options list endpoint', async () => {
            const response = await client.options.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single option endpoint', async () => {
            // First get an option ID
            const optionsResponse = await client.options.getAll({ perPage: 1 });
            if (optionsResponse.data.length > 0) {
                const optionId = optionsResponse.data[0].id;
                const option = await client.options.getById(optionId);
                
                expect(option).toBeDefined();
                expect(option.type).toBe('Option');
                expect(option.id).toBe(optionId);
            }
        }, 30000);
    });

    describe('Check-in Groups API URL Verification', () => {
        it('should access check-in groups list endpoint', async () => {
            const response = await client.checkInGroups.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single check-in group endpoint', async () => {
            // First get a check-in group ID
            const checkInGroupsResponse = await client.checkInGroups.getAll({ perPage: 1 });
            if (checkInGroupsResponse.data.length > 0) {
                const checkInGroupId = checkInGroupsResponse.data[0].id;
                const checkInGroup = await client.checkInGroups.getById(checkInGroupId);
                
                expect(checkInGroup).toBeDefined();
                expect(checkInGroup.type).toBe('CheckInGroup');
                expect(checkInGroup.id).toBe(checkInGroupId);
            }
        }, 30000);
    });

    describe('Check-in Times API URL Verification', () => {
        it('should access check-in times list endpoint', async () => {
            const response = await client.checkInTimes.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single check-in time endpoint', async () => {
            // First get a check-in time ID
            const checkInTimesResponse = await client.checkInTimes.getAll({ perPage: 1 });
            if (checkInTimesResponse.data.length > 0) {
                const checkInTimeId = checkInTimesResponse.data[0].id;
                const checkInTime = await client.checkInTimes.getById(checkInTimeId, ['check_in', 'event_time']);
                
                expect(checkInTime).toBeDefined();
                expect(checkInTime.type).toBe('CheckInTime');
                expect(checkInTime.id).toBe(checkInTimeId);
            }
        }, 30000);
    });

    describe('Person Events API URL Verification', () => {
        it('should access person events list endpoint', async () => {
            const response = await client.personEvents.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single person event endpoint', async () => {
            // First get a person event ID
            const personEventsResponse = await client.personEvents.getAll({ perPage: 1 });
            if (personEventsResponse.data.length > 0) {
                const personEventId = personEventsResponse.data[0].id;
                const personEvent = await client.personEvents.getById(personEventId, ['event', 'person']);
                
                expect(personEvent).toBeDefined();
                expect(personEvent.type).toBe('PersonEvent');
                expect(personEvent.id).toBe(personEventId);
            }
        }, 30000);
    });

    describe('Pre-checks API URL Verification', () => {
        it('should access pre-checks list endpoint', async () => {
            const response = await client.preChecks.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single pre-check endpoint', async () => {
            // First get a pre-check ID
            const preChecksResponse = await client.preChecks.getAll({ perPage: 1 });
            if (preChecksResponse.data.length > 0) {
                const preCheckId = preChecksResponse.data[0].id;
                const preCheck = await client.preChecks.getById(preCheckId, ['event', 'person']);
                
                expect(preCheck).toBeDefined();
                expect(preCheck.type).toBe('PreCheck');
                expect(preCheck.id).toBe(preCheckId);
            }
        }, 30000);
    });

    describe('Passes API URL Verification', () => {
        it('should access passes list endpoint', async () => {
            const response = await client.passes.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single pass endpoint', async () => {
            // First get a pass ID
            const passesResponse = await client.passes.getAll({ perPage: 1 });
            if (passesResponse.data.length > 0) {
                const passId = passesResponse.data[0].id;
                const pass = await client.passes.getById(passId);
                
                expect(pass).toBeDefined();
                expect(pass.type).toBe('Pass');
                expect(pass.id).toBe(passId);
            }
        }, 30000);
    });

    describe('Headcounts API URL Verification', () => {
        it('should access headcounts list endpoint', async () => {
            const response = await client.headcounts.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single headcount endpoint', async () => {
            // First get a headcount ID
            const headcountsResponse = await client.headcounts.getAll({ perPage: 1 });
            if (headcountsResponse.data.length > 0) {
                const headcountId = headcountsResponse.data[0].id;
                const headcount = await client.headcounts.getById(headcountId);
                
                expect(headcount).toBeDefined();
                expect(headcount.type).toBe('Headcount');
                expect(headcount.id).toBe(headcountId);
            }
        }, 30000);
    });

    describe('Error Handling URL Verification', () => {
        it('should handle 404 errors gracefully', async () => {
            await expect(client.events.getById('nonexistent-id')).rejects.toThrow();
        }, 30000);

        it('should handle invalid parameters gracefully', async () => {
            await expect(client.events.getAll({
                where: { invalid_field: 'invalid_value' }
            })).resolves.toBeDefined();
        }, 30000);
    });
});
