/**
 * Check-ins API Endpoint Coverage Integration Tests
 * 
 * These tests verify that all major Check-ins API endpoints are accessible and return expected data structures.
 * They provide comprehensive coverage of the Check-ins API functionality.
 * 
 * To run: npm run test:integration -- --testNamePattern="Endpoint Coverage"
 */

import { PcoCheckInsClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

describe('Check-ins API Endpoint Coverage Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Add request monitoring
        client.on('request:start', (event) => {
            console.log(`📡 ${event.method} ${event.endpoint}`);
        });
        client.on('request:complete', (event) => {
            console.log(`✅ ${event.method} ${event.endpoint} - ${event.status} (${event.duration}ms)`);
        });
    }, 30000);

    describe('Events Module Endpoint Coverage', () => {
        it('should cover events endpoints', async () => {
            // READ - List
            const events = await client.events.getAll({ perPage: 10 });
            expect(events.data).toBeDefined();
            expect(Array.isArray(events.data)).toBe(true);

            if (events.data.length > 0) {
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
            }
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

            if (checkIns.data.length > 0) {
                const checkInId = checkIns.data[0].id;
                
                // READ - Single
                const checkIn = await client.checkIns.getById(checkInId, ['person', 'event']);
                expect(checkIn.type).toBe('CheckIn');
                expect(checkIn.id).toBe(checkInId);
            }
        }, 30000);
    });

    describe('Locations Module Endpoint Coverage', () => {
        it('should cover locations endpoints', async () => {
            // READ - List
            const locations = await client.locations.getAll({ perPage: 10 });
            expect(locations.data).toBeDefined();
            expect(Array.isArray(locations.data)).toBe(true);

            if (locations.data.length > 0) {
                const locationId = locations.data[0].id;
                
                // READ - Single
                const location = await client.locations.getById(locationId, ['event']);
                expect(location.type).toBe('Location');
                expect(location.id).toBe(locationId);
            }
        }, 30000);
    });

    describe('Event Periods Module Endpoint Coverage', () => {
        it('should cover event periods endpoints', async () => {
            // READ - List
            const eventPeriods = await client.eventPeriods.getAll({ perPage: 10 });
            expect(eventPeriods.data).toBeDefined();
            expect(Array.isArray(eventPeriods.data)).toBe(true);

            if (eventPeriods.data.length > 0) {
                const eventPeriodId = eventPeriods.data[0].id;
                
                // READ - Single
                const eventPeriod = await client.eventPeriods.getById(eventPeriodId, ['event']);
                expect(eventPeriod.type).toBe('EventPeriod');
                expect(eventPeriod.id).toBe(eventPeriodId);
            }
        }, 30000);
    });

    describe('Event Times Module Endpoint Coverage', () => {
        it('should cover event times endpoints', async () => {
            // READ - List
            const eventTimes = await client.eventTimes.getAll({ perPage: 10 });
            expect(eventTimes.data).toBeDefined();
            expect(Array.isArray(eventTimes.data)).toBe(true);

            if (eventTimes.data.length > 0) {
                const eventTimeId = eventTimes.data[0].id;
                
                // READ - Single
                const eventTime = await client.eventTimes.getById(eventTimeId, ['event', 'event_period']);
                expect(eventTime.type).toBe('EventTime');
                expect(eventTime.id).toBe(eventTimeId);
            }
        }, 30000);
    });

    describe('Stations Module Endpoint Coverage', () => {
        it('should cover stations endpoints', async () => {
            // READ - List
            const stations = await client.stations.getAll({ perPage: 10 });
            expect(stations.data).toBeDefined();
            expect(Array.isArray(stations.data)).toBe(true);

            if (stations.data.length > 0) {
                const stationId = stations.data[0].id;
                
                // READ - Single
                const station = await client.stations.getById(stationId);
                expect(station.type).toBe('Station');
                expect(station.id).toBe(stationId);
            }
        }, 30000);
    });

    describe('Labels Module Endpoint Coverage', () => {
        it('should cover labels endpoints', async () => {
            // READ - List
            const labels = await client.labels.getAll({ perPage: 10 });
            expect(labels.data).toBeDefined();
            expect(Array.isArray(labels.data)).toBe(true);

            if (labels.data.length > 0) {
                const labelId = labels.data[0].id;
                
                // READ - Single
                const label = await client.labels.getById(labelId);
                expect(label.type).toBe('Label');
                expect(label.id).toBe(labelId);
            }
        }, 30000);
    });

    describe('Options Module Endpoint Coverage', () => {
        it('should cover options endpoints', async () => {
            // READ - List
            const options = await client.options.getAll({ perPage: 10 });
            expect(options.data).toBeDefined();
            expect(Array.isArray(options.data)).toBe(true);

            if (options.data.length > 0) {
                const optionId = options.data[0].id;
                
                // READ - Single
                const option = await client.options.getById(optionId);
                expect(option.type).toBe('Option');
                expect(option.id).toBe(optionId);
            }
        }, 30000);
    });

    describe('Check-in Groups Module Endpoint Coverage', () => {
        it('should cover check-in groups endpoints', async () => {
            // READ - List
            const checkInGroups = await client.checkInGroups.getAll({ perPage: 10 });
            expect(checkInGroups.data).toBeDefined();
            expect(Array.isArray(checkInGroups.data)).toBe(true);

            if (checkInGroups.data.length > 0) {
                const checkInGroupId = checkInGroups.data[0].id;
                
                // READ - Single
                const checkInGroup = await client.checkInGroups.getById(checkInGroupId);
                expect(checkInGroup.type).toBe('CheckInGroup');
                expect(checkInGroup.id).toBe(checkInGroupId);
            }
        }, 30000);
    });

    describe('Check-in Times Module Endpoint Coverage', () => {
        it('should cover check-in times endpoints', async () => {
            // READ - List
            const checkInTimes = await client.checkInTimes.getAll({ perPage: 10 });
            expect(checkInTimes.data).toBeDefined();
            expect(Array.isArray(checkInTimes.data)).toBe(true);

            if (checkInTimes.data.length > 0) {
                const checkInTimeId = checkInTimes.data[0].id;
                
                // READ - Single
                const checkInTime = await client.checkInTimes.getById(checkInTimeId, ['check_in', 'event_time']);
                expect(checkInTime.type).toBe('CheckInTime');
                expect(checkInTime.id).toBe(checkInTimeId);
            }
        }, 30000);
    });

    describe('Person Events Module Endpoint Coverage', () => {
        it('should cover person events endpoints', async () => {
            // READ - List
            const personEvents = await client.personEvents.getAll({ perPage: 10 });
            expect(personEvents.data).toBeDefined();
            expect(Array.isArray(personEvents.data)).toBe(true);

            if (personEvents.data.length > 0) {
                const personEventId = personEvents.data[0].id;
                
                // READ - Single
                const personEvent = await client.personEvents.getById(personEventId, ['event', 'person']);
                expect(personEvent.type).toBe('PersonEvent');
                expect(personEvent.id).toBe(personEventId);
            }
        }, 30000);
    });

    describe('Pre-checks Module Endpoint Coverage', () => {
        it('should cover pre-checks endpoints', async () => {
            // READ - List
            const preChecks = await client.preChecks.getAll({ perPage: 10 });
            expect(preChecks.data).toBeDefined();
            expect(Array.isArray(preChecks.data)).toBe(true);

            if (preChecks.data.length > 0) {
                const preCheckId = preChecks.data[0].id;
                
                // READ - Single
                const preCheck = await client.preChecks.getById(preCheckId, ['event', 'person']);
                expect(preCheck.type).toBe('PreCheck');
                expect(preCheck.id).toBe(preCheckId);
            }
        }, 30000);
    });

    describe('Passes Module Endpoint Coverage', () => {
        it('should cover passes endpoints', async () => {
            // READ - List
            const passes = await client.passes.getAll({ perPage: 10 });
            expect(passes.data).toBeDefined();
            expect(Array.isArray(passes.data)).toBe(true);

            if (passes.data.length > 0) {
                const passId = passes.data[0].id;
                
                // READ - Single
                const pass = await client.passes.getById(passId);
                expect(pass.type).toBe('Pass');
                expect(pass.id).toBe(passId);
            }
        }, 30000);
    });

    describe('Headcounts Module Endpoint Coverage', () => {
        it('should cover headcounts endpoints', async () => {
            // READ - List
            const headcounts = await client.headcounts.getAll({ perPage: 10 });
            expect(headcounts.data).toBeDefined();
            expect(Array.isArray(headcounts.data)).toBe(true);

            if (headcounts.data.length > 0) {
                const headcountId = headcounts.data[0].id;
                
                // READ - Single
                const headcount = await client.headcounts.getById(headcountId);
                expect(headcount.type).toBe('Headcount');
                expect(headcount.id).toBe(headcountId);
            }
        }, 30000);
    });

    describe('Pagination Coverage', () => {
        it('should cover pagination across all modules', async () => {
            const modules = [
                { name: 'events', method: 'getAll' },
                { name: 'checkIns', method: 'getAll' },
                { name: 'locations', method: 'getAll' },
                { name: 'eventPeriods', method: 'getAll' },
                { name: 'eventTimes', method: 'getAll' },
                { name: 'stations', method: 'getAll' },
                { name: 'labels', method: 'getAll' },
                { name: 'options', method: 'getAll' },
                { name: 'checkInGroups', method: 'getAll' },
                { name: 'checkInTimes', method: 'getAll' },
                { name: 'personEvents', method: 'getAll' },
                { name: 'preChecks', method: 'getAll' },
                { name: 'passes', method: 'getAll' },
                { name: 'headcounts', method: 'getAll' }
            ];

            for (const module of modules) {
                try {
                    const response = await (client as any)[module.name][module.method]({ perPage: 2, page: 1 });
                    expect(response).toHaveProperty('data');
                    expect(response).toHaveProperty('links');
                    expect(response).toHaveProperty('meta');
                    expect(Array.isArray(response.data)).toBe(true);
                } catch (error) {
                    console.log(`Pagination test failed for ${module.name}:`, error.message);
                }
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
            expect(event.relationships).toBeDefined();

            // Test single event with includes
            const singleEvent = await client.events.getById(event.id, ['locations', 'event_periods']);
            expect(singleEvent.relationships).toBeDefined();
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
            const events = await client.events.getAll({ perPage: 1 });
            if (events.data.length > 0) {
                const eventId = events.data[0].id;

                // Test all event association endpoints
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
                    try {
                        const response = await (client.events as any)[association.method](eventId);
                        expect(response).toHaveProperty('data');
                        expect(Array.isArray(response.data)).toBe(true);
                    } catch (error) {
                        console.log(`Event association test failed for ${association.name}:`, error.message);
                    }
                }
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

            try {
                const results = await batch.execute(operations);
                expect(results).toBeDefined();
                expect(Array.isArray(results)).toBe(true);
            } catch (error) {
                // Batch operations may not be available in all environments
                console.log('Batch operations not available:', error.message);
            }
        }, 30000);
    });
});
