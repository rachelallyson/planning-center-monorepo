/**
 * Check-ins API Attribute Type Validation Integration Tests
 * 
 * These tests verify that TypeScript attribute types match actual Check-ins API responses.
 * They make real API calls and validate that the response data matches the expected types.
 * 
 * To run: npm run test:integration -- --testNamePattern="Attribute Type Validation"
 */

import { PcoCheckInsClient, type EventResource, type CheckInResource, type HeadcountResource } from '../../src';
import { createTestClient, logAuthStatus, isPreChecksApiAvailable } from './test-config';
import { validateResourceStructure, validateRelationshipKeys } from '../type-validators';
import { getResourceId } from './test-utils';

function assertEventRequiredAndStrings(event: EventResource): void {
    expect(event.id).toBeDefined();
    expect(typeof event.id).toBe('string');
    expect(event.type).toBe('Event');
    if (event.name !== undefined) expect(typeof event.name).toBe('string');
    if (event.frequency !== undefined) expect(typeof event.frequency).toBe('string');
    if (event.integration_key !== undefined && event.integration_key != null) expect(['string', 'object'].includes(typeof event.integration_key)).toBe(true);
}

function assertEventOptionalStringsAndArchived(event: EventResource): void {
    if (event.app_source !== undefined) expect(typeof event.app_source).toBe('string');
    if (event.archived_at !== undefined && event.archived_at !== null) expect(typeof event.archived_at).toBe('string');
}

function assertEventBooleans(event: EventResource): void {
    if (event.enable_services_integration !== undefined) expect(typeof event.enable_services_integration).toBe('boolean');
    if (event.location_times_enabled !== undefined) expect(typeof event.location_times_enabled).toBe('boolean');
    if (event.pre_select_enabled !== undefined) expect(typeof event.pre_select_enabled).toBe('boolean');
}

function assertEventDates(event: EventResource): void {
    if (event.created_at !== undefined) {
        expect(typeof event.created_at).toBe('string');
        expect(new Date(event.created_at).getTime()).not.toBeNaN();
    }
    if (event.updated_at !== undefined) {
        expect(typeof event.updated_at).toBe('string');
        expect(new Date(event.updated_at).getTime()).not.toBeNaN();
    }
}

function assertEventAttributeTypes(event: EventResource): void {
    assertEventRequiredAndStrings(event);
    assertEventOptionalStringsAndArchived(event);
    assertEventBooleans(event);
    assertEventDates(event);
}

function assertCheckInStringsPart1a(checkIn: CheckInResource): void {
    if (checkIn.first_name !== undefined) expect(typeof checkIn.first_name).toBe('string');
    if (checkIn.last_name !== undefined) expect(typeof checkIn.last_name).toBe('string');
    if (checkIn.medical_notes !== undefined && checkIn.medical_notes != null) expect(['string', 'object'].includes(typeof checkIn.medical_notes)).toBe(true);
}

function assertCheckInStringsPart1b(checkIn: CheckInResource): void {
    if (checkIn.security_code !== undefined) expect(typeof checkIn.security_code).toBe('string');
    if (checkIn.checked_out_at !== undefined && checkIn.checked_out_at !== null) expect(typeof checkIn.checked_out_at).toBe('string');
}

function assertCheckInStringsPart1(checkIn: CheckInResource): void {
    assertCheckInStringsPart1a(checkIn);
    assertCheckInStringsPart1b(checkIn);
}

function assertCheckInStringsPart2a(checkIn: CheckInResource): void {
    if (checkIn.confirmed_at !== undefined && checkIn.confirmed_at !== null) expect(typeof checkIn.confirmed_at).toBe('string');
    if (checkIn.emergency_contact_name !== undefined && checkIn.emergency_contact_name !== null) expect(typeof checkIn.emergency_contact_name).toBe('string');
}

function assertCheckInStringsPart2b(checkIn: CheckInResource): void {
    if (checkIn.emergency_contact_phone_number !== undefined && checkIn.emergency_contact_phone_number !== null) expect(typeof checkIn.emergency_contact_phone_number).toBe('string');
    if (checkIn.kind !== undefined) expect(typeof checkIn.kind).toBe('string');
}

function assertCheckInStringsPart2(checkIn: CheckInResource): void {
    assertCheckInStringsPart2a(checkIn);
    assertCheckInStringsPart2b(checkIn);
}

function assertCheckInStrings(checkIn: CheckInResource): void {
    assertCheckInStringsPart1(checkIn);
    assertCheckInStringsPart2(checkIn);
}

function assertCheckInNumbersDates(checkIn: CheckInResource): void {
    if (checkIn.number !== undefined) expect(typeof checkIn.number).toBe('number');
    if (checkIn.one_time_guest !== undefined) expect(typeof checkIn.one_time_guest).toBe('boolean');
    if (checkIn.created_at !== undefined) {
        expect(typeof checkIn.created_at).toBe('string');
        expect(new Date(checkIn.created_at).getTime()).not.toBeNaN();
    }
    if (checkIn.updated_at !== undefined) {
        expect(typeof checkIn.updated_at).toBe('string');
        expect(new Date(checkIn.updated_at).getTime()).not.toBeNaN();
    }
}

function assertCheckInAttributeTypes(checkIn: CheckInResource): void {
    expect(checkIn.id).toBeDefined();
    expect(typeof checkIn.id).toBe('string');
    expect(checkIn.type).toBe('CheckIn');
    assertCheckInStrings(checkIn);
    assertCheckInNumbersDates(checkIn);
}

function assertHeadcountBase(h: HeadcountResource): void {
    expect(h).toBeDefined();
    expect(typeof h === 'object').toBe(true);
    expect(h).toHaveProperty('type');
    expect(h).toHaveProperty('id');
    expect(typeof h.type).toBe('string');
    expect(typeof h.id).toBe('string');
}

function assertHeadcountCount(h: HeadcountResource): void {
    expect(h.type).toBe('Headcount');
    if ('count' in h && h.count !== undefined) expect(typeof h.count).toBe('number');
}

function assertHeadcountCreatedAt(h: HeadcountResource): void {
    expect(h.type).toBe('Headcount');
    if (h.created_at !== undefined && h.created_at !== null) {
        expect(typeof h.created_at).toBe('string');
        expect(new Date(h.created_at).getTime()).not.toBeNaN();
    }
}

function assertHeadcountCountAndCreatedAt(h: HeadcountResource): void {
    assertHeadcountCount(h);
    assertHeadcountCreatedAt(h);
}

function assertHeadcountUpdatedAt(h: HeadcountResource): void {
    expect(h.type).toBe('Headcount');
    if (h.updated_at !== undefined && h.updated_at !== null) {
        expect(typeof h.updated_at).toBe('string');
        expect(new Date(h.updated_at).getTime()).not.toBeNaN();
    }
}

function assertHeadcountCountAndDates(h: HeadcountResource): void {
    assertHeadcountCountAndCreatedAt(h);
    assertHeadcountUpdatedAt(h);
}

function assertHeadcountAttendanceType(h: HeadcountResource): void {
    expect(h.type).toBe('Headcount');
    expect(h.attendance_type).toBeDefined();
    expect(h.attendance_type).not.toBeNull();
    const at = h.attendance_type!;
    expect(typeof at === 'object').toBe(true);
    if (at.type !== undefined) expect(typeof at.type).toBe('string');
    if (at.id !== undefined) expect(typeof at.id).toBe('string');
}

function assertHeadcountWhenTypeHeadcount(h: HeadcountResource): void {
    assertHeadcountCountAndDates(h);
    assertHeadcountAttendanceType(h);
}

function assertHeadcountItemShape(h: HeadcountResource): void {
    assertHeadcountBase(h);
    assertHeadcountWhenTypeHeadcount(h);
}

function hasResolvedAttendanceType(hc: HeadcountResource): boolean {
    return (
        hc?.attendance_type != null &&
        typeof hc.attendance_type === 'object' &&
        Object.keys(hc.attendance_type).length > 2
    );
}

async function findPeriodWithHeadcountsForEvent(
    client: PcoCheckInsClient,
    eventId: string,
    options: { include: ('headcounts' | 'headcounts.attendance_type')[]; per_page: number }
): Promise<{ result: Awaited<ReturnType<PcoCheckInsClient['events']['getEventTimesForPeriod']>>; periodId: string } | null> {
    const periodsRes = await client.events.getEventPeriods(eventId, { per_page: 5, page: 1 });
    for (const period of periodsRes.data) {
        const pid = getResourceId(period);
        if (!pid) continue;
        const page = await client.events.getEventTimesForPeriod(eventId, pid, options);
        const allHeadcounts = page.data.flatMap((et) => et.headcounts ?? []);
        if (allHeadcounts.some(hasResolvedAttendanceType)) {
            return { result: page, periodId: pid };
        }
    }
    return null;
}

async function findEventPeriodWithHeadcounts(
    client: PcoCheckInsClient,
    options: { include: ('headcounts' | 'headcounts.attendance_type')[]; per_page: number }
): Promise<{ result: Awaited<ReturnType<PcoCheckInsClient['events']['getEventTimesForPeriod']>>; eventId: string; periodId: string } | null> {
    const eventsRes = await client.events.getPage({ per_page: 10, page: 1 });
    for (const event of eventsRes.data) {
        const eid = getResourceId(event);
        if (!eid) continue;
        const found = await findPeriodWithHeadcountsForEvent(client, eid, options);
        if (found) return { result: found.result, eventId: eid, periodId: found.periodId };
    }
    return null;
}

/** Accepts API TopLevelLinks (Link = string | { href: string }) */
type PaginationLinksLike = {
    self?: string | { href?: string } | null;
    first?: string | { href?: string } | null;
    last?: string | { href?: string } | null;
    prev?: string | { href?: string } | null;
    next?: string | { href?: string } | null;
};
type PaginationMeta = { count?: number; total_count?: number; total_pages?: number; per_page?: number; current_page?: number };

const PAGINATION_LINK_KEYS: (keyof PaginationLinksLike)[] = ['self', 'first', 'last', 'prev', 'next'];
const PAGINATION_META_KEYS: (keyof PaginationMeta)[] = ['count', 'total_count', 'total_pages', 'per_page', 'current_page'];

function assertPaginationLinks(links: PaginationLinksLike | undefined): void {
    expect(links).toBeDefined();
    PAGINATION_LINK_KEYS.forEach((k) => {
        const v = links![k];
        if (v != null) {
            if (typeof v === 'string') expect(typeof v).toBe('string');
            else expect(typeof v === 'object' && v !== null).toBe(true);
        }
    });
}

function assertPaginationMeta(meta: PaginationMeta | undefined): void {
    expect(meta).toBeDefined();
    PAGINATION_META_KEYS.forEach((k) => {
        if (meta![k] !== undefined) expect(typeof meta![k]).toBe('number');
    });
}

describe('Check-ins API Attribute Type Validation Integration Tests', () => {
    let client: PcoCheckInsClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

    }, 30000);

    describe('Event Attributes Type Validation', () => {
        it('should validate EventAttributes types match API response', async () => {
            const response = await client.events.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            assertEventAttributeTypes(response.data[0]);
        }, 30000);

        it('should validate EventRelationships structure', async () => {
            const response = await client.events.getPage({
                per_page: 1,
                page: 1,
                include: ['attendance_types']
            });
            expect(response.data.length).toBeGreaterThan(0);
            const event = response.data[0];

            // Flattened: relationships at top level (event.attendance_types, etc.)
            if (event.attendance_types !== undefined) {
                expect(Array.isArray(event.attendance_types) || typeof event.attendance_types === 'object').toBe(true);
            }
            if (event.locations !== undefined) {
                expect(Array.isArray(event.locations) || typeof event.locations === 'object').toBe(true);
            }
        }, 30000);
    });

    describe('CheckIn Attributes Type Validation', () => {
        it('should validate CheckInAttributes types match API response', async () => {
            const response = await client.checkIns.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            assertCheckInAttributeTypes(response.data[0]);
        }, 30000);
    });

    describe('Location Attributes Type Validation', () => {
        it('should validate LocationAttributes types match API response', async () => {
            const response = await client.locations.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const location = response.data[0];

            // Validate required fields
            expect(location.id).toBeDefined();
            expect(typeof location.id).toBe('string');
            expect(location.type).toBe('Location');

            // Validate optional string attributes
            if (location.name !== undefined) {
                expect(typeof location.name).toBe('string');
            }

            // Validate date attributes
            if (location.created_at !== undefined) {
                expect(typeof location.created_at).toBe('string');
                expect(new Date(location.created_at!).getTime()).not.toBeNaN();
            }
            if (location.updated_at !== undefined) {
                expect(typeof location.updated_at).toBe('string');
                expect(new Date(location.updated_at!).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('EventPeriod Attributes Type Validation', () => {
        it('should validate EventPeriodAttributes types match API response', async () => {
            // Event periods must be accessed through events
            const events = await client.events.getAll({ per_page: 1 });
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
            if (eventPeriod.starts_at !== undefined) {
                expect(typeof eventPeriod.starts_at).toBe('string');
                expect(new Date(eventPeriod.starts_at!).getTime()).not.toBeNaN();
            }
            if (eventPeriod.ends_at !== undefined) {
                expect(typeof eventPeriod.ends_at).toBe('string');
                expect(new Date(eventPeriod.ends_at!).getTime()).not.toBeNaN();
            }

            // Validate date attributes
            if (eventPeriod.created_at !== undefined) {
                expect(typeof eventPeriod.created_at).toBe('string');
                expect(new Date(eventPeriod.created_at!).getTime()).not.toBeNaN();
            }
            if (eventPeriod.updated_at !== undefined) {
                expect(typeof eventPeriod.updated_at).toBe('string');
                expect(new Date(eventPeriod.updated_at!).getTime()).not.toBeNaN();
            }
        }, 30000);

        it('should return JSON from getAllEventPeriods that matches EventPeriodResource type', async () => {
            const events = await client.events.getPage({ per_page: 1, page: 1 });
            expect(events.data.length).toBeGreaterThan(0);
            const eventId = events.data[0].id;

            const result = await client.events.getAllEventPeriods(eventId);

            expect(result).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);

            result.data.forEach((item, index: number) => {
                validateResourceStructure(item, 'EventPeriod', `getAllEventPeriods[${index}]`);

                if (item.starts_at !== undefined) {
                    expect(typeof item.starts_at).toBe('string');
                    expect(new Date(item.starts_at).getTime()).not.toBeNaN();
                }
                if (item.ends_at !== undefined) {
                    expect(typeof item.ends_at).toBe('string');
                    expect(new Date(item.ends_at).getTime()).not.toBeNaN();
                }
                if (item.created_at !== undefined) {
                    expect(typeof item.created_at).toBe('string');
                    expect(new Date(item.created_at).getTime()).not.toBeNaN();
                }
                if (item.updated_at !== undefined) {
                    expect(typeof item.updated_at).toBe('string');
                    expect(new Date(item.updated_at).getTime()).not.toBeNaN();
                }

                validateRelationshipKeys(item, ['event', 'event_times', 'check_ins', 'location_event_periods']);
            });
        }, 30000);

        it('should return JSON from getEventTimesForPeriod that matches EventTimeResource type', async () => {
            const events = await client.events.getPage({ per_page: 1, page: 1 });
            expect(events.data.length).toBeGreaterThan(0);
            const eventId = events.data[0].id;

            const periods = await client.events.getEventPeriods(eventId);
            expect(periods.data.length).toBeGreaterThan(0);
            const periodId = periods.data[0].id;

            const result = await client.events.getEventTimesForPeriod(eventId, periodId);

            expect(result).toBeDefined();
            expect(result).toHaveProperty('data');
            expect(Array.isArray(result.data)).toBe(true);
            expect(result).not.toHaveProperty('included');

            result.data.forEach((item, index: number) => {
                validateResourceStructure(item, 'EventTime', `getEventTimesForPeriod[${index}]`);

                if (item.starts_at !== undefined) {
                    expect(typeof item.starts_at).toBe('string');
                    expect(new Date(item.starts_at).getTime()).not.toBeNaN();
                }
                if (item.ends_at !== undefined) {
                    expect(typeof item.ends_at).toBe('string');
                    expect(new Date(item.ends_at).getTime()).not.toBeNaN();
                }
                if (item.created_at !== undefined) {
                    expect(typeof item.created_at).toBe('string');
                    expect(new Date(item.created_at).getTime()).not.toBeNaN();
                }
                if (item.updated_at !== undefined) {
                    expect(typeof item.updated_at).toBe('string');
                    expect(new Date(item.updated_at).getTime()).not.toBeNaN();
                }

                validateRelationshipKeys(item, ['event', 'event_period', 'location_event_times', 'check_ins']);
            });
        }, 30000);

        it('getEventTimesForPeriod with include headcounts: client sends include; when API returns headcounts, validate shape', async () => {
            const includeOpt: { include: ('headcounts' | 'headcounts.attendance_type')[]; per_page: number } = {
                include: ['headcounts', 'headcounts.attendance_type'],
                per_page: 100,
            };
            const found = await findEventPeriodWithHeadcounts(client, includeOpt);
            expect(found).not.toBeNull();
            expect(found!.eventId).toBeTruthy();
            expect(found!.periodId).toBeTruthy();

            const result = found!.result;
            expect(result).toBeDefined();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result).not.toHaveProperty('included');

            const data = result.data;
            const eventTimesWithHeadcounts = data.filter((et) => (et.headcounts?.length ?? 0) > 0);
            const allHeadcounts = eventTimesWithHeadcounts.flatMap((et) => (et.headcounts ?? []));
            const withResolvedAttendanceType = allHeadcounts.filter(
                (hc) =>
                    hc?.attendance_type != null &&
                    typeof hc.attendance_type === 'object' &&
                    Object.keys(hc.attendance_type).length > 2
            );
            expect(withResolvedAttendanceType.length).toBeGreaterThan(0);

            eventTimesWithHeadcounts.forEach((eventTime) => {
                const headcounts = eventTime.headcounts ?? [];
                headcounts.forEach((hc) => assertHeadcountItemShape(hc));
            });
        }, 60000);
    });

    describe('EventTime Attributes Type Validation', () => {
        it('should validate EventTimeAttributes types match API response', async () => {
            const response = await client.eventTimes.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const eventTime = response.data[0];

            // Validate required fields
            expect(eventTime.id).toBeDefined();
            expect(typeof eventTime.id).toBe('string');
            expect(eventTime.type).toBe('EventTime');

            // Validate optional string attributes
            const et = eventTime;
            if (et.starts_at !== undefined) {
                expect(typeof et.starts_at).toBe('string');
                expect(new Date(et.starts_at).getTime()).not.toBeNaN();
            }
            if (et.ends_at !== undefined) {
                expect(typeof et.ends_at).toBe('string');
                expect(new Date(et.ends_at).getTime()).not.toBeNaN();
            }
            if (et.created_at !== undefined) {
                expect(typeof et.created_at).toBe('string');
                expect(new Date(et.created_at).getTime()).not.toBeNaN();
            }
            if (et.updated_at !== undefined) {
                expect(typeof et.updated_at).toBe('string');
                expect(new Date(et.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Station Attributes Type Validation', () => {
        it('should validate StationAttributes types match API response', async () => {
            const response = await client.stations.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const station = response.data[0];

            // Validate required fields
            expect(station.id).toBeDefined();
            expect(typeof station.id).toBe('string');
            expect(station.type).toBe('Station');

            // Validate optional string attributes
            if (station.name !== undefined) {
                expect(typeof station.name).toBe('string');
            }

            // Validate date attributes
            if (station.created_at !== undefined) {
                expect(typeof station.created_at).toBe('string');
                expect(new Date(station.created_at!).getTime()).not.toBeNaN();
            }
            if (station.updated_at !== undefined) {
                expect(typeof station.updated_at).toBe('string');
                expect(new Date(station.updated_at!).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Label Attributes Type Validation', () => {
        it('should validate LabelAttributes types match API response', async () => {
            const response = await client.labels.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const label = response.data[0];

            // Validate required fields
            expect(label.id).toBeDefined();
            expect(typeof label.id).toBe('string');
            expect(label.type).toBe('Label');

            // Validate optional string attributes
            if (label.name !== undefined) {
                expect(typeof label.name).toBe('string');
            }

            // Validate date attributes
            if (label.created_at !== undefined) {
                expect(typeof label.created_at).toBe('string');
                expect(new Date(label.created_at!).getTime()).not.toBeNaN();
            }
            if (label.updated_at !== undefined) {
                expect(typeof label.updated_at).toBe('string');
                expect(new Date(label.updated_at!).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Option Attributes Type Validation', () => {
        it('should validate OptionAttributes types match API response', async () => {
            const response = await client.options.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const option = response.data[0];

            // Validate required fields
            expect(option.id).toBeDefined();
            expect(typeof option.id).toBe('string');
            expect(option.type).toBe('Option');

            // Validate optional string attributes
            if (option.name !== undefined) {
                expect(typeof option.name).toBe('string');
            }

            // Validate date attributes
            if (option.created_at !== undefined) {
                expect(typeof option.created_at).toBe('string');
                expect(new Date(option.created_at!).getTime()).not.toBeNaN();
            }
            if (option.updated_at !== undefined) {
                expect(typeof option.updated_at).toBe('string');
                expect(new Date(option.updated_at!).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('CheckInGroup Attributes Type Validation', () => {
        it('should validate CheckInGroupAttributes types match API response', async () => {
            const stationsPage = await client.stations.getPage({ per_page: 1, page: 1 });
            expect(stationsPage.data.length).toBeGreaterThan(0);
            const stationId = stationsPage.data[0].id;
            const response = await client.checkInGroups.getPage(stationId, { per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const checkInGroup = response.data[0];

            // Validate required fields
            expect(checkInGroup.id).toBeDefined();
            expect(typeof checkInGroup.id).toBe('string');
            expect(checkInGroup.type).toBe('CheckInGroup');

            // Validate optional string attributes
            if (checkInGroup.name !== undefined) {
                expect(typeof checkInGroup.name).toBe('string');
            }

            // Validate date attributes
            if (checkInGroup.created_at !== undefined) {
                expect(typeof checkInGroup.created_at).toBe('string');
                expect(new Date(checkInGroup.created_at!).getTime()).not.toBeNaN();
            }
            if (checkInGroup.updated_at !== undefined) {
                expect(typeof checkInGroup.updated_at).toBe('string');
                expect(new Date(checkInGroup.updated_at!).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('CheckInTime Attributes Type Validation', () => {
        it('should validate CheckInTimeAttributes types match API response', async () => {
            const checkInsPage = await client.checkIns.getPage({ per_page: 1 });
            expect(checkInsPage.data.length).toBeGreaterThan(0);
            const response = await client.checkIns.getCheckInTimes(checkInsPage.data[0].id);
            expect(response.data.length).toBeGreaterThan(0);
            {
                const checkInTime = response.data[0];
                expect(checkInTime.id).toBeDefined();
                expect(typeof checkInTime.id).toBe('string');
                expect(checkInTime.type).toBe('CheckInTime');
                if (checkInTime.created_at !== undefined) {
                    expect(typeof checkInTime.created_at).toBe('string');
                    expect(new Date(checkInTime.created_at).getTime()).not.toBeNaN();
                }
                if (checkInTime.updated_at !== undefined) {
                    expect(typeof checkInTime.updated_at).toBe('string');
                    expect(new Date(checkInTime.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('PersonEvent Attributes Type Validation', () => {
        it('should validate PersonEventAttributes types match API response', async () => {
            const eventsPage = await client.events.getPage({ per_page: 1 });
            expect(eventsPage.data.length).toBeGreaterThan(0);
            const response = await client.events.getPersonEvents(eventsPage.data[0].id);
            expect(response.data.length).toBeGreaterThan(0);
            {
                const personEvent = response.data[0];
                expect(personEvent.id).toBeDefined();
                expect(typeof personEvent.id).toBe('string');
                expect(personEvent.type).toBe('PersonEvent');
                if (personEvent.created_at !== undefined) {
                    expect(typeof personEvent.created_at).toBe('string');
                    expect(new Date(personEvent.created_at).getTime()).not.toBeNaN();
                }
                if (personEvent.updated_at !== undefined) {
                    expect(typeof personEvent.updated_at).toBe('string');
                    expect(new Date(personEvent.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('PreCheck Attributes Type Validation', () => {
        it('should validate PreCheckAttributes types match API response', async () => {
            expect(await isPreChecksApiAvailable(client)).toBe(true);
            const response = await client.preChecks.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const preCheck = response.data[0];

            // Validate required fields
            expect(preCheck.id).toBeDefined();
            expect(typeof preCheck.id).toBe('string');
            expect(preCheck.type).toBe('PreCheck');

            // Validate date attributes
            if (preCheck.created_at !== undefined) {
                expect(typeof preCheck.created_at).toBe('string');
                expect(new Date(preCheck.created_at!).getTime()).not.toBeNaN();
            }
            if (preCheck.updated_at !== undefined) {
                expect(typeof preCheck.updated_at).toBe('string');
                expect(new Date(preCheck.updated_at!).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Pass Attributes Type Validation', () => {
        it('should validate PassAttributes types match API response', async () => {
            const response = await client.passes.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const pass = response.data[0];

            // Validate required fields
            expect(pass.id).toBeDefined();
            expect(typeof pass.id).toBe('string');
            expect(pass.type).toBe('Pass');

            // Validate optional string attributes (see pass.html vertex)
            if (pass.code !== undefined) {
                expect(typeof pass.code).toBe('string');
            }
            if (pass.kind !== undefined) {
                expect(typeof pass.kind).toBe('string');
            }

            // Validate date attributes
            if (pass.created_at !== undefined) {
                expect(typeof pass.created_at).toBe('string');
                expect(new Date(pass.created_at!).getTime()).not.toBeNaN();
            }
            if (pass.updated_at !== undefined) {
                expect(typeof pass.updated_at).toBe('string');
                expect(new Date(pass.updated_at!).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Headcount Attributes Type Validation', () => {
        it('should validate HeadcountAttributes types match API response', async () => {
            const response = await client.headcounts.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const headcount = response.data[0];

            // Validate required fields
            expect(headcount.id).toBeDefined();
            expect(typeof headcount.id).toBe('string');
            expect(headcount.type).toBe('Headcount');

            // Validate optional number attributes
            if (headcount.count !== undefined) {
                expect(typeof headcount.count).toBe('number');
            }

            // Validate date attributes
            const hcDates = headcount;
            if (hcDates.created_at !== undefined) {
                expect(typeof hcDates.created_at).toBe('string');
                expect(new Date(hcDates.created_at).getTime()).not.toBeNaN();
            }
            if (hcDates.updated_at !== undefined) {
                expect(typeof hcDates.updated_at).toBe('string');
                expect(new Date(hcDates.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('AttendanceType Attributes Type Validation', () => {
        it('should validate AttendanceTypeAttributes types match API response', async () => {
            const response = await client.events.getPage({ per_page: 1, page: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            const eventId = response.data[0].id;
            const attendanceTypesResponse = await client.events.getAttendanceTypes(eventId);
            expect(attendanceTypesResponse.data.length).toBeGreaterThan(0);
            const attendanceType = attendanceTypesResponse.data[0];

            // Validate required fields
            expect(attendanceType.id).toBeDefined();
            expect(typeof attendanceType.id).toBe('string');
            expect(attendanceType.type).toBe('AttendanceType');

            // Validate optional string attributes (flattened: at top level)
            if (attendanceType.name !== undefined) {
                expect(typeof attendanceType.name).toBe('string');
            }

            // Validate date attributes
            if (attendanceType.created_at !== undefined) {
                expect(typeof attendanceType.created_at).toBe('string');
                expect(new Date(attendanceType.created_at!).getTime()).not.toBeNaN();
            }
            if (attendanceType.updated_at !== undefined) {
                expect(typeof attendanceType.updated_at).toBe('string');
                expect(new Date(attendanceType.updated_at!).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Pagination and Meta Type Validation', () => {
        it('should validate pagination structure types', async () => {
            const response = await client.events.getAll({ per_page: 5 });
            assertPaginationLinks(response.links);
            assertPaginationMeta(response.meta);
        }, 30000);
    });
});
