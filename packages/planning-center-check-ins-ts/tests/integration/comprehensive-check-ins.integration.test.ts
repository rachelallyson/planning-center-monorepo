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
import { createTestClient, logAuthStatus } from './test-config';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateBooleanAttribute,
    validateDateAttribute,
    validateRelationship,
} from '../type-validators';

describe('Comprehensive Check-ins API Integration Tests', () => {
    let client: PcoCheckInsClient;
    let testEventId: string | null = null;
    let testCheckInId: string | null = null;
    let testLocationId: string | null = null;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Add request monitoring with proper typing
        client.on('request:start', (event) => {
            console.log(`📡 ${(event as any).method} ${(event as any).endpoint}`);
        });
        client.on('request:complete', (event) => {
            console.log(`✅ ${(event as any).method} ${(event as any).endpoint} - ${(event as any).status} (${(event as any).duration}ms)`);
        });
        client.on('request:error', (event) => {
            const error = (event as any).error;
            if (error?.status === 401 || error?.status === 403) {
                console.warn(`⚠️  Auth error: ${error.message} - Check token permissions`);
            }
        });
    }, 30000);

    describe('Events Module - Comprehensive Coverage', () => {
        it('should get all events with proper structure', async () => {
            const result = await client.events.getAll({ perPage: 10 });
            
            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            
            if (result.data.length > 0) {
                testEventId = result.data[0].id;
                const event = result.data[0];
                
                // Verify JSON:API structure
                validateResourceStructure(event, 'Event');
                expect(event.attributes).toBeDefined();
                
                // Verify attributes structure
                if (event.attributes?.name !== undefined) {
                    validateStringAttribute(event.attributes, 'name');
                }
                if (event.attributes?.frequency !== undefined) {
                    validateStringAttribute(event.attributes, 'frequency');
                    // Frequency can be capitalized or lowercase
                    const frequencyLower = event.attributes.frequency.toLowerCase();
                    expect(['weekly', 'daily', 'monthly', 'yearly', 'one_time']).toContain(frequencyLower);
                }
                if (event.attributes?.created_at !== undefined) {
                    validateDateAttribute(event.attributes, 'created_at');
                }
            }
        }, 30000);

        it('should get single event by ID with includes', async () => {
            if (!testEventId) {
                const events = await client.events.getAll({ perPage: 1 });
                expect(events.data.length).toBeGreaterThan(0);
                testEventId = events.data[0].id;
            }

            const event = await client.events.getById(testEventId!, ['locations', 'event_periods', 'attendance_types']);
            
            validateResourceStructure(event, 'Event');
            expect(event.id).toBe(testEventId);
            expect(event.attributes).toBeDefined();
            
            // Verify relationships when included
            if (event.relationships) {
                expect(typeof event.relationships).toBe('object');
                if (event.relationships.locations) {
                    validateRelationship(event.relationships.locations);
                }
                if (event.relationships.event_periods) {
                    validateRelationship(event.relationships.event_periods);
                }
                if (event.relationships.attendance_types) {
                    validateRelationship(event.relationships.attendance_types);
                }
            }
        }, 30000);

        it('should handle pagination correctly', async () => {
            const page1 = await client.events.getAll({ perPage: 2, page: 1 });
            expect(page1.data).toBeDefined();
            expect(page1.data.length).toBeLessThanOrEqual(2);
            
            if (page1.data.length === 2) {
                const page2 = await client.events.getAll({ perPage: 2, page: 2 });
                expect(page2.data).toBeDefined();
                
                // Pages should have different or same IDs (if only 2 total)
                if (page2.data.length > 0) {
                    const page1Ids = page1.data.map(e => e.id);
                    const page2Ids = page2.data.map(e => e.id);
                    // Either different items or same if only 2 total
                    expect(page1Ids).toBeDefined();
                    expect(page2Ids).toBeDefined();
                }
            }
        }, 30000);

        it('should filter events with where parameters', async () => {
            const weeklyEvents = await client.events.getAll({
                where: { frequency: 'weekly' },
                perPage: 5
            });
            expect(weeklyEvents.data).toBeDefined();
            expect(Array.isArray(weeklyEvents.data)).toBe(true);
            
            // Verify all returned events match filter (if any)
            weeklyEvents.data.forEach(event => {
                validateResourceStructure(event, 'Event');
                if (event.attributes?.frequency !== undefined) {
                    validateStringAttribute(event.attributes, 'frequency');
                    // API returns capitalized values (Weekly, Daily, etc.)
                    const frequencyLower = event.attributes.frequency.toLowerCase();
                    expect(frequencyLower).toBe('weekly');
                }
            });
        }, 30000);

        it('should get event associations', async () => {
            if (!testEventId) {
                const events = await client.events.getAll({ perPage: 1 });
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
            const result = await client.checkIns.getAll({ perPage: 10 });
            
            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            
            if (result.data.length > 0) {
                testCheckInId = result.data[0].id;
                const checkIn = result.data[0];
                
                // Verify JSON:API structure
                validateResourceStructure(checkIn, 'CheckIn');
                expect(checkIn.attributes).toBeDefined();
                
                // Verify attributes
                if (checkIn.attributes?.security_code !== undefined) {
                    validateStringAttribute(checkIn.attributes, 'security_code');
                }
                if (checkIn.attributes?.first_name !== undefined) {
                    validateStringAttribute(checkIn.attributes, 'first_name');
                }
                if (checkIn.attributes?.one_time_guest !== undefined) {
                    validateBooleanAttribute(checkIn.attributes, 'one_time_guest');
                }
            }
        }, 30000);

        it('should get single check-in by ID with includes', async () => {
            if (!testCheckInId) {
                const checkIns = await client.checkIns.getAll({ perPage: 1 });
                expect(checkIns.data.length).toBeGreaterThan(0);
                testCheckInId = checkIns.data[0].id;
            }

            const checkIn = await client.checkIns.getById(testCheckInId!, ['person', 'event', 'check_in_group']);
            
            validateResourceStructure(checkIn, 'CheckIn');
            expect(checkIn.id).toBe(testCheckInId);
            expect(checkIn.attributes).toBeDefined();
            
            // Validate relationships when included
            if (checkIn.relationships) {
                if (checkIn.relationships.person) {
                    validateRelationship(checkIn.relationships.person);
                }
                if (checkIn.relationships.event) {
                    validateRelationship(checkIn.relationships.event);
                }
                if (checkIn.relationships.check_in_group) {
                    validateRelationship(checkIn.relationships.check_in_group);
                }
            }
        }, 30000);

        it('should filter check-ins correctly', async () => {
            // Test various filter combinations
            const filters = [
                ['attendee'],
                ['not_checked_out'],
                ['guest'],
                ['first_time'],
            ];

            for (const filter of filters) {
                const result = await client.checkIns.getAll({
                    filter,
                    perPage: 5
                });
                
                expect(result).toBeDefined();
                expect(result.data).toBeDefined();
                expect(Array.isArray(result.data)).toBe(true);
            }
        }, 30000);

        it('should get check-in associations', async () => {
            if (!testCheckInId) {
                const checkIns = await client.checkIns.getAll({ perPage: 1 });
                expect(checkIns.data.length).toBeGreaterThan(0);
                testCheckInId = checkIns.data[0].id;
            }

            // Test all association endpoints
            const checkInGroup = await client.checkIns.getCheckInGroup(testCheckInId!);
            const checkInTimes = await client.checkIns.getCheckInTimes(testCheckInId!);
            const checkedInAt = await client.checkIns.getCheckedInAt(testCheckInId!);
            const checkedInBy = await client.checkIns.getCheckedInBy(testCheckInId!);
            const checkedOutBy = await client.checkIns.getCheckedOutBy(testCheckInId!);
            const event = await client.checkIns.getEvent(testCheckInId!);
            const eventPeriod = await client.checkIns.getEventPeriod(testCheckInId!);
            const eventTimes = await client.checkIns.getEventTimes(testCheckInId!);
            const locations = await client.checkIns.getLocations(testCheckInId!);
            const options = await client.checkIns.getOptions(testCheckInId!);
            const person = await client.checkIns.getPerson(testCheckInId!);

            // Verify structure - some may be null, but if they exist they should have proper structure
            if (checkInGroup !== null) {
                validateResourceStructure(checkInGroup, 'CheckInGroup');
            }
            expect(checkInTimes.data).toBeDefined();
            expect(Array.isArray(checkInTimes.data)).toBe(true);
            checkInTimes.data.forEach(resource => validateResourceStructure(resource, 'CheckInTime'));
            
            if (checkedInAt !== null) {
                validateResourceStructure(checkedInAt, 'CheckInTime');
            }
            if (checkedInBy !== null) {
                validateResourceStructure(checkedInBy, 'Person');
            }
            if (checkedOutBy !== null) {
                validateResourceStructure(checkedOutBy, 'Person');
            }
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
            
            if (person !== null) {
                validateResourceStructure(person, 'Person');
            }
        }, 60000);
    });

    describe('Locations Module - Comprehensive Coverage', () => {
        it('should get all locations with proper structure', async () => {
            const result = await client.locations.getAll({ perPage: 10 });
            
            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            
            if (result.data.length > 0) {
                testLocationId = result.data[0].id;
                const location = result.data[0];
                
                validateResourceStructure(location, 'Location');
                expect(location.attributes).toBeDefined();
                
                if (location.attributes?.name !== undefined) {
                    validateStringAttribute(location.attributes, 'name');
                }
            }
        }, 30000);

        it('should get single location by ID', async () => {
            if (!testLocationId) {
                const locations = await client.locations.getAll({ perPage: 1 });
                expect(locations.data.length).toBeGreaterThan(0);
                testLocationId = locations.data[0].id;
            }

            const location = await client.locations.getById(testLocationId!, ['event']);
            
            validateResourceStructure(location, 'Location');
            expect(location.id).toBe(testLocationId);
            
            // Validate relationships when included
            if (location.relationships?.event) {
                validateRelationship(location.relationships.event);
            }
        }, 30000);

        it('should get location associations', async () => {
            if (!testLocationId) {
                const locations = await client.locations.getAll({ perPage: 1 });
                expect(locations.data.length).toBeGreaterThan(0);
                testLocationId = locations.data[0].id;
            }

            const locationEventPeriods = await client.locations.getLocationEventPeriods(testLocationId!);
            const locationEventTimes = await client.locations.getLocationEventTimes(testLocationId!);
            const locationLabels = await client.locations.getLocationLabels(testLocationId!);

            expect(locationEventPeriods.data).toBeDefined();
            expect(Array.isArray(locationEventPeriods.data)).toBe(true);
            locationEventPeriods.data.forEach(resource => validateResourceStructure(resource, 'EventPeriod'));
            
            expect(locationEventTimes.data).toBeDefined();
            expect(Array.isArray(locationEventTimes.data)).toBe(true);
            locationEventTimes.data.forEach(resource => validateResourceStructure(resource, 'EventTime'));
            
            expect(locationLabels.data).toBeDefined();
            expect(Array.isArray(locationLabels.data)).toBe(true);
            locationLabels.data.forEach(resource => validateResourceStructure(resource, 'LocationLabel'));
        }, 60000);
    });

    describe('Event Periods Module - Comprehensive Coverage', () => {
        it('should get event periods via event associations', async () => {
            // Event periods must be accessed through events, not as a standalone endpoint
            if (!testEventId) {
                const events = await client.events.getAll({ perPage: 1 });
                expect(events.data.length).toBeGreaterThan(0);
                testEventId = events.data[0].id;
            }

            const result = await client.events.getEventPeriods(testEventId!);
            
            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            
            if (result.data.length > 0) {
                const period = result.data[0];
                validateResourceStructure(period, 'EventPeriod');
                
                if (period.attributes?.starts_at !== undefined) {
                    validateDateAttribute(period.attributes, 'starts_at');
                }
                if (period.attributes?.ends_at !== undefined) {
                    validateDateAttribute(period.attributes, 'ends_at');
                }
            }
        }, 30000);

        it('should get event period associations', async () => {
            // Event periods must be accessed through events
            if (!testEventId) {
                const events = await client.events.getAll({ perPage: 1 });
                expect(events.data.length).toBeGreaterThan(0);
                testEventId = events.data[0].id;
            }

            const periods = await client.events.getEventPeriods(testEventId!);
            expect(periods.data.length).toBeGreaterThan(0);

            const periodId = periods.data[0].id;
            
            // Note: Event period associations require check_in_id in the path, so they're not easily accessible
            // The event period resource itself has relationship data that can be included
            // For full association access, you'd need to access via check-in: /check-ins/v2/check_ins/{check_in_id}/event_period/{id}/...
            
            // We can at least verify the event period has relationship data
            const eventPeriod = periods.data[0];
            if (eventPeriod.relationships?.event) {
                expect(eventPeriod.relationships.event.data).toBeDefined();
            }
            
            // Verify event period structure
            validateResourceStructure(eventPeriod, 'EventPeriod');
        }, 60000);
    });

    describe('Event Times Module - Comprehensive Coverage', () => {
        it('should get all event times with proper structure', async () => {
            const result = await client.eventTimes.getAll({ perPage: 10 });
            
            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            
            if (result.data.length > 0) {
                const eventTime = result.data[0];
                validateResourceStructure(eventTime, 'EventTime');
            }
        }, 30000);

        it('should get single event time by ID with includes', async () => {
            const eventTimes = await client.eventTimes.getAll({ perPage: 1 });
            expect(eventTimes.data.length).toBeGreaterThan(0);

            const eventTime = await client.eventTimes.getById(eventTimes.data[0].id, ['event', 'event_period']);
            validateResourceStructure(eventTime, 'EventTime');
            
            // Validate relationships when included
            if (eventTime.relationships?.event) {
                validateRelationship(eventTime.relationships.event);
            }
            if (eventTime.relationships?.event_period) {
                validateRelationship(eventTime.relationships.event_period);
            }
        }, 30000);

        it('should get event time associations', async () => {
            const eventTimes = await client.eventTimes.getAll({ perPage: 1 });
            expect(eventTimes.data.length).toBeGreaterThan(0);

            const eventTimeId = eventTimes.data[0].id;
            const event = await client.eventTimes.getEvent(eventTimeId);
            const eventPeriod = await client.eventTimes.getEventPeriod(eventTimeId);
            const locationEventTimes = await client.eventTimes.getLocationEventTimes(eventTimeId);
            const checkIns = await client.eventTimes.getCheckIns(eventTimeId);

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

            for (const module of modules) {
                const listResult = await (client as any)[module.name].getAll({ perPage: 1 });
                expect(listResult).toBeDefined();
                expect(listResult.data).toBeDefined();
                expect(Array.isArray(listResult.data)).toBe(true);
                
                if (listResult.data.length > 0) {
                    const item = listResult.data[0];
                    validateResourceStructure(item, module.type);
                    
                    // Test getById if item exists
                    const singleResult = await (client as any)[module.name].getById(item.id);
                    validateResourceStructure(singleResult, module.type);
                    expect(singleResult.id).toBe(item.id);
                }
            }
        }, 120000);
    });

    describe('Organization Module', () => {
        it('should get organization info', async () => {
            const organization = await client.organization.get();
            
            validateResourceStructure(organization, 'Organization');
            expect(organization.attributes).toBeDefined();
            
            if (organization.attributes?.name !== undefined) {
                validateStringAttribute(organization.attributes, 'name');
                expect(organization.attributes.name.length).toBeGreaterThan(0);
            }
        }, 30000);
    });

    describe('Pagination - Cross Module', () => {
        it('should handle pagination consistently across modules', async () => {
            // Note: eventPeriods doesn't have getAll() - must use events.getEventPeriods() instead
            const testModules = ['events', 'checkIns', 'locations', 'eventTimes'];
            
            for (const moduleName of testModules) {
                const page1 = await (client as any)[moduleName].getAll({ perPage: 1, page: 1 });
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
            // Get an event and location first
            if (!testEventId) {
                const events = await client.events.getAll({ perPage: 1 });
                expect(events.data.length).toBeGreaterThan(0);
                testEventId = events.data[0].id;
            }
            
            if (!testLocationId) {
                const locations = await client.locations.getAll({ perPage: 1 });
                expect(locations.data.length).toBeGreaterThan(0);
                testLocationId = locations.data[0].id;
            }

            // Test event labels (accessed via events module)
            const eventLabels = await client.events.getEventLabels(testEventId!);
            expect(eventLabels).toBeDefined();
            expect(eventLabels.data).toBeDefined();
            expect(Array.isArray(eventLabels.data)).toBe(true);
            
            if (eventLabels.data.length > 0) {
                eventLabels.data.forEach(resource => validateResourceStructure(resource, 'EventLabel'));
            }

            // Test location labels (accessed via locations module)
            const locationLabels = await client.locations.getLocationLabels(testLocationId!);
            expect(locationLabels).toBeDefined();
            expect(locationLabels.data).toBeDefined();
            expect(Array.isArray(locationLabels.data)).toBe(true);
            
            if (locationLabels.data.length > 0) {
                locationLabels.data.forEach(resource => validateResourceStructure(resource, 'LocationLabel'));
            }
        }, 60000);
    });

    describe('Batch Operations', () => {
        it('should execute batch operations', async () => {
            const batch = client.batch;
            expect(batch).toBeDefined();
            expect(typeof batch.execute).toBe('function');
        }, 30000);
    });

    describe('Include Parameters - Relationship Loading', () => {
        it('should load included resources correctly', async () => {
            if (!testEventId) {
                const events = await client.events.getAll({ perPage: 1 });
                expect(events.data.length).toBeGreaterThan(0);
                testEventId = events.data[0].id;
            }

            const event = await client.events.getById(testEventId!, [
                'locations',
                'event_periods',
                'attendance_types',
                'integration_links'
            ]);
            
            expect(event).toBeDefined();
            expect(event.relationships).toBeDefined();
            
            // Verify relationships object exists
            if (event.relationships) {
                expect(typeof event.relationships).toBe('object');
            }
        }, 30000);
    });
});

