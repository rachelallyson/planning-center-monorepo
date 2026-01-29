import { PcoClient, ServiceTimeAttributes, ServiceTimeResource } from '../../../src';
import { createTestClient, logAuthStatus } from '../test-config';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateNumberAttribute,
} from '../../type-validators';

const TEST_PREFIX = 'TEST_V2_SERVICETIME_2025';

describe('v2.3.0 ServiceTime API Integration Tests', () => {
    let client: PcoClient;
    let testCampusId: string;
    let testServiceTimeId: string;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Get or create a test campus
        const campuses = await client.campus.getAll();
        if (campuses.data.length > 0) {
            testCampusId = campuses.data[0].id || '';
        } else {
            // Create a test campus if none exists
            const testCampus = await client.campus.create({
                name: `${TEST_PREFIX}_Test_Campus_${Date.now()}`,
                description: `Test campus for service time tests`
            });
            testCampusId = testCampus.id || '';
        }
        expect(testCampusId).toBeTruthy();

        // Clean up any previous test service times
        const existingServiceTimes = await client.serviceTime.getAll(testCampusId!);
        for (const serviceTime of existingServiceTimes.data) {
            if (serviceTime.id) {
                await client.serviceTime.delete(testCampusId, serviceTime.id);
            }
        }
    }, 60000);

    it('should create, update, and delete a service time', async () => {
        const timestamp = Date.now();
        const serviceTimeData: ServiceTimeAttributes = {
            start_time: 540, // 9:00 AM as minutes from midnight (9 * 60 = 540)
            day: 0, // Sunday
            description: `${TEST_PREFIX}_Main_Service_${timestamp}`
        };

        // Create service time
        const newServiceTime = await client.serviceTime.create(testCampusId, serviceTimeData);
        validateResourceStructure(newServiceTime, 'ServiceTime');
        expect(newServiceTime.description).toBe(serviceTimeData.description);
        expect(newServiceTime.start_time).toBe(serviceTimeData.start_time);
        expect(newServiceTime.day).toBe('sunday'); // API returns day as string
        
        // Validate attribute types
        if (newServiceTime.description !== undefined) validateStringAttribute(newServiceTime as Record<string, unknown>, 'description');
        if (newServiceTime.start_time !== undefined) validateNumberAttribute(newServiceTime as Record<string, unknown>, 'start_time');
        if (newServiceTime.day !== undefined) validateStringAttribute(newServiceTime as Record<string, unknown>, 'day');
        testServiceTimeId = newServiceTime.id || '';
        expect(testServiceTimeId).toBeTruthy();

        // Update service time
        const updateData: Partial<ServiceTimeAttributes> = {
            start_time: 630, // 10:30 AM as minutes from midnight (10 * 60 + 30 = 630)
            description: `${TEST_PREFIX}_Updated_Service_${timestamp}`
        };
        const updatedServiceTime = await client.serviceTime.update(testCampusId, testServiceTimeId, updateData);
        validateResourceStructure(updatedServiceTime, 'ServiceTime');
        expect(updatedServiceTime.id).toBe(testServiceTimeId);
        expect(updatedServiceTime.start_time).toBe(updateData.start_time);
        expect(updatedServiceTime.description).toBe(updateData.description);

        // Get service time by ID (getById returns flattened resource)
        const fetchedServiceTime = await client.serviceTime.getById(testCampusId, testServiceTimeId);
        validateResourceStructure(fetchedServiceTime, 'ServiceTime');
        expect(fetchedServiceTime.id).toBe(testServiceTimeId);
        // getById returns flattened resource - description and start_time are at top level
        if ('description' in fetchedServiceTime) {
          expect(fetchedServiceTime.description).toBe(updateData.description);
        }
        if ('start_time' in fetchedServiceTime) {
          expect(fetchedServiceTime.start_time).toBe(updateData.start_time);
        }

        // Delete service time
        await client.serviceTime.delete(testCampusId, testServiceTimeId);
        await expect(client.serviceTime.getById(testCampusId, testServiceTimeId)).rejects.toThrow();
    }, 60000);

    it('should get all service times for a campus', async () => {
        const serviceTimes = await client.serviceTime.getAll(testCampusId);
        expect(serviceTimes).toBeDefined();
        expect(Array.isArray(serviceTimes.data)).toBe(true);
        serviceTimes.data.forEach(resource => validateResourceStructure(resource, 'ServiceTime'));
    }, 30000);

    it('should get all pages of service times with pagination', async () => {
        // Create a few test service times to ensure pagination works
        const serviceTime1 = await client.serviceTime.create(testCampusId, {
            start_time: 480, // 8:00 AM as minutes from midnight (8 * 60 = 480)
            day: 1,
            description: `${TEST_PREFIX}_Page_Service_1_${Date.now()}`
        });
        const serviceTime2 = await client.serviceTime.create(testCampusId, {
            start_time: 660, // 11:00 AM as minutes from midnight (11 * 60 = 660)
            day: 2,
            description: `${TEST_PREFIX}_Page_Service_2_${Date.now()}`
        });

        const allServiceTimes = await client.serviceTime.getPage(testCampusId, { perPage: 10 });
        expect(allServiceTimes).toBeDefined();
        expect(Array.isArray(allServiceTimes.data)).toBe(true);
        expect(allServiceTimes.data.length).toBeGreaterThanOrEqual(2); // Should fetch at least the two we created

        // Clean up test service times
        await client.serviceTime.delete(testCampusId, serviceTime1.id || '');
        await client.serviceTime.delete(testCampusId, serviceTime2.id || '');
    }, 120000);

    it('should handle invalid campus ID gracefully', async () => {
        const invalidCampusId = 'invalid-campus-id';

        await expect(client.serviceTime.getAll(invalidCampusId)).rejects.toThrow();
        await expect(client.serviceTime.getById(invalidCampusId, 'some-id')).rejects.toThrow();
        await expect(client.serviceTime.create(invalidCampusId, {
            start_time: 540, // 9:00 AM in minutes from midnight
            day: 0,
            description: 'Test Service'
        })).rejects.toThrow();
    }, 60000);

    it('should handle invalid service time ID gracefully', async () => {
        const invalidServiceTimeId = 'invalid-service-time-id';

        await expect(client.serviceTime.getById(testCampusId, invalidServiceTimeId)).rejects.toThrow();
        await expect(client.serviceTime.update(testCampusId, invalidServiceTimeId, {
            description: 'Updated'
        })).rejects.toThrow();
        await expect(client.serviceTime.delete(testCampusId, invalidServiceTimeId)).rejects.toThrow();
    }, 120000);

    afterAll(async () => {
        // Clean up any remaining test service times
        if (testCampusId) {
            const remainingServiceTimes = await client.serviceTime.getAll(testCampusId!);
            for (const serviceTime of remainingServiceTimes.data) {
                if (serviceTime.id) {
                    await client.serviceTime.delete(testCampusId, serviceTime.id);
                }
            }
        }
    }, 30000);
});
