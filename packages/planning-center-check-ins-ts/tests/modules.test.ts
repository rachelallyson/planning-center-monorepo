/**
 * v1.0.0 Check-Ins Modules Tests
 * Tests module methods with mocked HTTP responses
 */

import { EventsModule } from '../src/modules/events';
import { CheckInsModule } from '../src/modules/check-ins';
import { LocationsModule } from '../src/modules/locations';
import type { EventResource, CheckInResource } from '../src';
import { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

// Create a mock HTTP client
const createMockHttpClient = () => {
    const mockRequest = jest.fn();
    return {
        request: mockRequest,
        getPerformanceMetrics: () => ({}),
        getRateLimitInfo: () => ({})
    } as unknown as PcoHttpClient;
};

// Create a mock pagination helper
const createMockPaginationHelper = () => {
    return {
        getAllPages: jest.fn().mockResolvedValue({
            data: [],
            totalCount: 0,
            pagesFetched: 1,
            duration: 10
        })
    } as unknown as PaginationHelper;
};

// Create a mock event emitter
const createMockEventEmitter = () => {
    return {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        removeAllListeners: jest.fn(),
        listenerCount: jest.fn(() => 0),
        eventTypes: jest.fn(() => [])
    } as unknown as PcoEventEmitter;
};

describe('Check-Ins Modules with Mocked Data', () => {
    let mockHttpClient: PcoHttpClient;
    let mockPaginationHelper: PaginationHelper;
    let mockEventEmitter: PcoEventEmitter;
    let mockRequest: jest.Mock;

    beforeEach(() => {
        mockHttpClient = createMockHttpClient();
        mockPaginationHelper = createMockPaginationHelper();
        mockEventEmitter = createMockEventEmitter();
        mockRequest = (mockHttpClient as any).request;
    });

    describe('Events Module', () => {
        let eventsModule: EventsModule;

        beforeEach(() => {
            eventsModule = new EventsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
        });

        it('should get all events with mocked data', async () => {
            const mockEvent: EventResource = {
                type: 'Event',
                id: 'event_1',
                attributes: {
                    name: 'Sunday Service',
                    frequency: 'weekly',
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z',
                },
                relationships: {}
            };

            mockRequest.mockResolvedValueOnce({
                data: {
                    data: [mockEvent],
                    meta: { total_count: 1 },
                    links: {}
                },
                status: 200,
                headers: {},
                requestId: 'test-request-id',
                duration: 10
            });

            const result = await eventsModule.getAll();

            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data[0].type).toBe('Event');
            expect(result.data[0].id).toBe('event_1');
            expect(mockRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'GET',
                    endpoint: '/check-ins/v2/events'
                })
            );
        });

        it('should get event by ID with mocked data', async () => {
            const mockEvent: EventResource = {
                type: 'Event',
                id: 'event_1',
                attributes: {
                    name: 'Sunday Service',
                    frequency: 'weekly',
                },
                relationships: {}
            };

            mockRequest.mockResolvedValueOnce({
                data: { data: mockEvent },
                status: 200,
                headers: {},
                requestId: 'test-request-id',
                duration: 10
            });

            const result = await eventsModule.getById('event_1');

            expect(result).toBeDefined();
            expect(result.type).toBe('Event');
            expect(result.id).toBe('event_1');
            expect(mockRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'GET',
                    endpoint: '/check-ins/v2/events/event_1'
                })
            );
        });

        it('should get check-ins for an event with filters', async () => {
            const mockCheckIn: CheckInResource = {
                type: 'CheckIn',
                id: 'checkin_1',
                attributes: {
                    first_name: 'John',
                    last_name: 'Doe',
                    security_code: 'ABC123',
                    created_at: '2024-01-01T00:00:00Z',
                },
                relationships: {}
            };

            mockRequest.mockResolvedValueOnce({
                data: {
                    data: [mockCheckIn],
                    meta: {},
                    links: {}
                },
                status: 200,
                headers: {},
                requestId: 'test-request-id',
                duration: 10
            });

            const result = await eventsModule.getCheckIns('event_1', {
                filter: ['attendee', 'not_checked_out']
            });

            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data[0].type).toBe('CheckIn');
        });
    });

    describe('CheckIns Module', () => {
        let checkInsModule: CheckInsModule;

        beforeEach(() => {
            checkInsModule = new CheckInsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
        });

        it('should get all check-ins with mocked data', async () => {
            const mockCheckIn: CheckInResource = {
                type: 'CheckIn',
                id: 'checkin_1',
                attributes: {
                    first_name: 'Jane',
                    last_name: 'Smith',
                    number: 1,
                    security_code: 'XYZ789',
                },
                relationships: {}
            };

            mockRequest.mockResolvedValueOnce({
                data: {
                    data: [mockCheckIn],
                    meta: { total_count: 1 },
                    links: {}
                },
                status: 200,
                headers: {},
                requestId: 'test-request-id',
                duration: 10
            });

            const result = await checkInsModule.getAll({
                filter: ['attendee']
            });

            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data[0].type).toBe('CheckIn');
            expect(mockRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'GET',
                    endpoint: '/check-ins/v2/check_ins'
                })
            );
        });

        it('should get check-in by ID with mocked data', async () => {
            const mockCheckIn: CheckInResource = {
                type: 'CheckIn',
                id: 'checkin_1',
                attributes: {
                    first_name: 'John',
                    last_name: 'Doe',
                    security_code: 'ABC123',
                },
                relationships: {}
            };

            mockRequest.mockResolvedValueOnce({
                data: { data: mockCheckIn },
                status: 200,
                headers: {},
                requestId: 'test-request-id',
                duration: 10
            });

            const result = await checkInsModule.getById('checkin_1');

            expect(result).toBeDefined();
            expect(result.type).toBe('CheckIn');
            expect(result.id).toBe('checkin_1');
        });
    });

    describe('Locations Module', () => {
        let locationsModule: LocationsModule;

        beforeEach(() => {
            locationsModule = new LocationsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
        });

        it('should get all locations with mocked data', async () => {
            mockRequest.mockResolvedValueOnce({
                data: {
                    data: [{
                        type: 'Location',
                        id: 'location_1',
                        attributes: {
                            name: 'Main Building',
                            created_at: '2024-01-01T00:00:00Z',
                        },
                        relationships: {}
                    }],
                    meta: {},
                    links: {}
                },
                status: 200,
                headers: {},
                requestId: 'test-request-id',
                duration: 10
            });

            const result = await locationsModule.getAll();

            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data[0].type).toBe('Location');
            expect(mockRequest).toHaveBeenCalledWith(
                expect.objectContaining({
                    method: 'GET',
                    endpoint: '/check-ins/v2/locations'
                })
            );
        });
    });
});
