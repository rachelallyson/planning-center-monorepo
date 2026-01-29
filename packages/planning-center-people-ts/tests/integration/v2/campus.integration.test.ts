import {
    PcoClient,
    type CampusAttributes,
} from '../../../src';
import { createTestClient, logAuthStatus } from '../test-config';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateBooleanAttribute,
    validateNumberAttribute,
} from '../../type-validators';

const TEST_PREFIX = 'TEST_V2_CAMPUS_2025';

describe('v2.0.0 Campus API Integration Tests', () => {
    let client: PcoClient;
    let testCampusId: string;

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();
    }, 30000);

    afterAll(async () => {
        // Clean up test campus if it was created
        if (testCampusId) {
            await client.campus.delete(testCampusId);
        }
    }, 30000);

    describe('v2.0 Campus Operations', () => {
        it('should get all campuses', async () => {
            const campuses = await client.campus.getAll();

            expect(campuses).toBeDefined();
            expect(campuses.data).toBeDefined();
            expect(Array.isArray(campuses.data)).toBe(true);
            expect(campuses.meta).toBeDefined();
        }, 30000);

        it('should get all campuses with pagination', async () => {
            const campuses = await client.campus.getPage({ perPage: 10 });

            expect(campuses).toBeDefined();
            expect(Array.isArray(campuses.data)).toBe(true);

            // Verify items are Campus resources
            campuses.data.forEach(campus => {
                validateResourceStructure(campus, 'Campus');
            });
        }, 30000);

        it('should create a campus', async () => {
            const timestamp = Date.now();
            const campusData: CampusAttributes = {
                name: `${TEST_PREFIX}_Test_Campus_${timestamp}`,
                description: `${TEST_PREFIX}_Test_Campus_${timestamp}`,
                street: '123 Test Street',
                city: 'Test City',
                state: 'TS',
                zip: '12345',
                country: 'US',
                phone_number: '555-123-4567',
                website: 'https://testcampus.example.com',
                twenty_four_hour_time: false,
                date_format: 1,
                church_center_enabled: true,
            };

            const campus = await client.campus.create(campusData);

            validateResourceStructure(campus, 'Campus');
            expect(campus.description).toBe(campusData.description);
            expect(campus.street).toBe(campusData.street);
            expect(campus.city).toBe(campusData.city);
            expect(campus.state).toBe(campusData.state);
            expect(campus.zip).toBe(campusData.zip);
            expect(campus.country).toBe(campusData.country);
            expect(campus.phone_number).toBe(campusData.phone_number);
            expect(campus.website).toBe(campusData.website);
            expect(campus.twenty_four_hour_time).toBe(campusData.twenty_four_hour_time);
            expect(campus.date_format).toBe(campusData.date_format);
            expect(campus.church_center_enabled).toBe(campusData.church_center_enabled);
            
            // Validate attribute types
            if (campus.name !== undefined) validateStringAttribute(campus as Record<string, unknown>, 'name');
            if (campus.description !== undefined) validateStringAttribute(campus as Record<string, unknown>, 'description');
            if (campus.street !== undefined) validateStringAttribute(campus as Record<string, unknown>, 'street');
            if (campus.city !== undefined) validateStringAttribute(campus as Record<string, unknown>, 'city');
            if (campus.state !== undefined) validateStringAttribute(campus as Record<string, unknown>, 'state');
            if (campus.zip !== undefined) validateStringAttribute(campus as Record<string, unknown>, 'zip');
            if (campus.country !== undefined) validateStringAttribute(campus as Record<string, unknown>, 'country');
            if (campus.phone_number !== undefined) validateStringAttribute(campus as Record<string, unknown>, 'phone_number');
            if (campus.website !== undefined) validateStringAttribute(campus as Record<string, unknown>, 'website');
            if (campus.twenty_four_hour_time !== undefined) validateBooleanAttribute(campus as Record<string, unknown>, 'twenty_four_hour_time');
            if (campus.date_format !== undefined) validateNumberAttribute(campus as Record<string, unknown>, 'date_format');
            if (campus.church_center_enabled !== undefined) validateBooleanAttribute(campus as Record<string, unknown>, 'church_center_enabled');

            testCampusId = campus.id || '';
            expect(testCampusId).toBeTruthy();
        }, 30000);

        it('should get campus by ID', async () => {
            expect(testCampusId).toBeTruthy();

            const campus = await client.campus.getById(testCampusId);

            validateResourceStructure(campus, 'Campus');
            expect(campus.id).toBe(testCampusId);
            // getById returns flattened resource - attributes are at top level
            expect(campus.description).toContain(TEST_PREFIX);
        }, 30000);

        it('should update a campus', async () => {
            expect(testCampusId).toBeTruthy();

            const updateData: Partial<CampusAttributes> = {
                description: `${TEST_PREFIX}_Updated_Campus_${Date.now()}`,
                city: 'Updated City',
                phone_number: '555-987-6543',
                twenty_four_hour_time: true,
            };

            const updatedCampus = await client.campus.update(testCampusId, updateData);

            validateResourceStructure(updatedCampus, 'Campus');
            expect(updatedCampus.id).toBe(testCampusId);
            expect(updatedCampus.description).toBe(updateData.description);
            expect(updatedCampus.city).toBe(updateData.city);
            expect(updatedCampus.phone_number).toBe(updateData.phone_number);
            expect(updatedCampus.twenty_four_hour_time).toBe(updateData.twenty_four_hour_time);
        }, 30000);

        it('should get campus lists', async () => {
            expect(testCampusId).toBeTruthy();

            const lists = await client.campus.getLists(testCampusId);

            expect(lists).toBeDefined();
            expect(lists.data).toBeDefined();
            expect(Array.isArray(lists.data)).toBe(true);
        }, 30000);

        it('should get campus service times', async () => {
            expect(testCampusId).toBeTruthy();

            const serviceTimes = await client.campus.getServiceTimes(testCampusId);

            expect(serviceTimes).toBeDefined();
            expect(serviceTimes.data).toBeDefined();
            expect(Array.isArray(serviceTimes.data)).toBe(true);
        }, 30000);

        it('should delete a campus', async () => {
            expect(testCampusId).toBeTruthy();

            await client.campus.delete(testCampusId);

            // Verify campus was deleted
            await expect(
                client.campus.getById(testCampusId)
            ).rejects.toThrow();

            // Clear the test campus ID since it's been deleted
            testCampusId = '';
        }, 30000);
    });

    describe('v2.0 Campus Error Handling', () => {
        it('should handle invalid campus ID gracefully', async () => {
            await expect(
                client.campus.getById('invalid-campus-id')
            ).rejects.toThrow();
        }, 30000);

        it('should handle campus creation with invalid data', async () => {
            const invalidData = {
                // Missing required fields or invalid data
                invalid_field: 'invalid_value',
            } as any;

            await expect(
                client.campus.create(invalidData)
            ).rejects.toThrow();
        }, 30000);
    });
});
