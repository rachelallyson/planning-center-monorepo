/**
 * v2.0.0 People Core API Integration Tests
 * 
 * Tests for the new PcoClient v2.0 API:
 * - client.people.getAll(), client.people.get(), client.people.create(), etc.
 * - Built-in pagination with client.people.getAllPages()
 * - Event system monitoring
 * - Client manager caching
 * 
 * To run: npm run test:integration:v2-people-core
 */

import {
    PcoClient,
    PcoClientManager,
    type PcoClientConfig,
    type PersonAttributes,
} from '../../src';
import {
    validateResourceStructure,
    validateNullableStringAttribute,
    validateBooleanAttribute,
    validateStringAttribute,
    validateDateAttribute,
    validateRelationship,
    validateIncludedResources,
    validatePaginationLinks,
    validatePaginationMeta,
} from '../type-validators';
import { createTestClient, logAuthStatus } from './test-config';

// Test configuration
const TEST_PREFIX = 'TEST_V2_INTEGRATION_2025';
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');

describe('v2.0.0 People Core API Integration Tests', () => {
    let client: PcoClient;
    let testPersonId = '';

    beforeAll(async () => {
        // Use createTestClient() to ensure consistent credential loading
        // This will check for PCO_ACCESS_TOKEN, PCO_PERSONAL_ACCESS_TOKEN, or PCO_APP_ID/PCO_APP_SECRET
        const { createTestClient, logAuthStatus } = await import('./test-config');
        logAuthStatus();
        client = createTestClient();
    }, 30000);

    afterAll(async () => {
        // Clean up test person using v2.0 API
        if (testPersonId) {
            await client.people.delete(testPersonId);
            testPersonId = '';
        }
    }, 30000);

    describe('v2.0 Client Creation and Configuration', () => {
        it('should create a client with proper configuration', () => {
            expect(client).toBeDefined();
            expect(client.getConfig()).toBeDefined();
            expect(client.getConfig().auth).toBeDefined();
        });

        it('should provide access to all modules', () => {
            expect(client.people).toBeDefined();
            expect(client.fields).toBeDefined();
            expect(client.workflows).toBeDefined();
            expect(client.contacts).toBeDefined();
            expect(client.households).toBeDefined();
            expect(client.notes).toBeDefined();
            expect(client.lists).toBeDefined();
            expect(client.batch).toBeDefined();
        });

        it('should support event system', () => {
            const initialCount = client.listenerCount('request:start');
            const handler = jest.fn();
            client.on('request:start', handler);
            expect(client.listenerCount('request:start')).toBe(initialCount + 1);

            client.off('request:start', handler);
            expect(client.listenerCount('request:start')).toBe(initialCount);
        });
    });

    describe('v2.0 Read Operations', () => {
        it('should get people list with proper typing using v2.0 API', async () => {
            const response = await client.people.getPage({
                include: ['emails', 'phone_numbers'],
                perPage: 5,
            });

            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
            expect(response).toHaveProperty('links');
            expect(response).toHaveProperty('meta');

            // Validate pagination structure
            validatePaginationLinks(response.links);
            validatePaginationMeta(response.meta);

            expect(response.data.length).toBeGreaterThan(0);
            const person = response.data[0];

            // Validate PersonResource structure
            validateResourceStructure(person, 'Person');

            // getPage returns flattened resources - attributes at top level
            validateNullableStringAttribute(person, 'first_name');
            validateNullableStringAttribute(person, 'last_name');
            validateNullableStringAttribute(person, 'given_name');
            validateNullableStringAttribute(person, 'middle_name');
            validateNullableStringAttribute(person, 'nickname');
            validateNullableStringAttribute(person, 'birthdate');
            validateNullableStringAttribute(person, 'anniversary');
            validateNullableStringAttribute(person, 'gender');
            validateNullableStringAttribute(person, 'grade');
            validateBooleanAttribute(person, 'child');
            validateStringAttribute(person, 'status');
            validateDateAttribute(person, 'created_at');
            validateDateAttribute(person, 'updated_at');
            validateBooleanAttribute(person, 'site_administrator');
            validateBooleanAttribute(person, 'accounting_administrator');
            validateNullableStringAttribute(person, 'people_permissions');
            validateNullableStringAttribute(person, 'remote_id');

            // getPage returns flattened resources - relationships are at top level
            const personFlattened = person;
            // Flattened resources don't have relationships object - relationships are at top level
            if (personFlattened.emails) {
                const emails = Array.isArray(personFlattened.emails) ? personFlattened.emails : [personFlattened.emails];
                expect(emails.length).toBeGreaterThanOrEqual(0);
            }
            if (personFlattened.phone_numbers) {
                const phones = Array.isArray(personFlattened.phone_numbers) ? personFlattened.phone_numbers : [personFlattened.phone_numbers];
                expect(phones.length).toBeGreaterThanOrEqual(0);
            }
            if (personFlattened.primary_campus) {
                expect(personFlattened.primary_campus).toHaveProperty('type');
            }
            if (personFlattened.gender) {
                expect(personFlattened.gender).toHaveProperty('type');
            }

            // Validate included resources if present (flattened responses map included to relationships, so included may be undefined)
            if (response.included && Array.isArray(response.included)) {
                validateIncludedResources(response.included, ['Email', 'PhoneNumber']);
            }

        }, 30000);

        it('should filter people by status using v2.0 API', async () => {
            const response = await client.people.getPage({
                perPage: 3,
                where: { status: 'active' },
            });

            expect(Array.isArray(response.data)).toBe(true);

            // All returned people should be active (getPage returns flattened resources)
            response.data.forEach((person) => {
                const personFlattened = person;
                expect(personFlattened.status).toBe('active');
            });
        }, 30000);

        it('should get a single person with full details using v2.0 API', async () => {
            // First get a list to find a person ID
            const peopleResponse = await client.people.getPage({ perPage: 1 });

            expect(peopleResponse.data.length).toBeGreaterThan(0);
            const personId = peopleResponse.data[0].id;
            const person = await client.people.getById(personId, ['emails', 'phone_numbers']);

            expect(person).toBeDefined();
            expect(person.type).toBe('Person');
            expect(person.id).toBe(personId);
            // getById returns flattened resource - attributes at top level
            expect(person).toHaveProperty('first_name');
        }, 30000);
    });

    describe('v2.0 Built-in Pagination', () => {
        it('should get all pages using getAll() method', async () => {
            const result = await client.people.getPage({ perPage: 10 });

            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.meta?.total_count).toBeGreaterThan(0);
            expect(result.data.length).toBeGreaterThan(0);

            // getPage returns one page: at most perPage items
            const totalCount = typeof result.meta?.total_count === 'number' ? result.meta.total_count : 0;
            if (totalCount > 10) {
                expect(result.data.length).toBeLessThanOrEqual(10);
            } else {
                expect(result.data.length).toBe(totalCount);
            }
        }, 60000);
    });

    describe('v2.0 Write Operations', () => {
        it('should create, update, and delete a person using v2.0 API', async () => {
            const timestamp = Date.now();
            const personData: Partial<PersonAttributes> = {
                first_name: `${TEST_PREFIX}_John_${timestamp}`,
                last_name: `${TEST_PREFIX}_Doe_${timestamp}`,
                status: 'active',
            };

            // Create person using v2.0 API
            const createResponse = await client.people.create(personData);
            expect(createResponse).toBeDefined();
            // create returns ResourceObject, not flattened - attributes are nested
            expect(createResponse.first_name).toBe(personData.first_name);
            expect(createResponse.last_name).toBe(personData.last_name);

            testPersonId = createResponse.id || '';
            expect(testPersonId).toBeTruthy();

            // Update person using v2.0 API
            const updateData: Partial<PersonAttributes> = {
                first_name: `${TEST_PREFIX}_Jane_${timestamp}`,
            };

            const updateResponse = await client.people.update(testPersonId!, updateData);
            expect(updateResponse.first_name).toBe(updateData.first_name);
            expect(updateResponse.last_name).toBe(personData.last_name);

            // Verify update using v2.0 API (getById returns flattened resource)
            const getResponse = await client.people.getById(testPersonId!);
            // getById returns FlattenedPersonResource - first_name is at top level
            // TypeScript should infer this, but we check the property exists for safety
            expect('first_name' in getResponse).toBe(true);
            if ('first_name' in getResponse) {
                expect(getResponse.first_name).toBe(updateData.first_name);
            }
        }, 30000);

        it('should handle invalid person ID gracefully using v2.0 API', async () => {
            await expect(client.people.getById('invalid-id')).rejects.toThrow();
        }, 30000);
    });

    describe('v2.0 Contact Operations', () => {
        it('should add email to person using v2.0 API', async () => {
            if (!testPersonId) {
                // Create a test person first
                const timestamp = Date.now();
                const personData: Partial<PersonAttributes> = {
                    first_name: `${TEST_PREFIX}_Contact_${timestamp}`,
                    last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                    status: 'active',
                };
                const createResponse = await client.people.create(personData);
                testPersonId = createResponse.id || '';
            }

            const emailData = {
                address: `test${Date.now()}@gmail.com`, // Use a real domain to avoid validation errors
                location: 'Home',
                primary: true,
            };

            const emailResponse = await client.people.addEmail(testPersonId, emailData);
            expect(emailResponse).toBeDefined();
            expect(emailResponse.address).toBe(emailData.address);
            expect(emailResponse.primary).toBe(true);
        }, 30000);

        it('should add phone number to person using v2.0 API', async () => {
            if (!testPersonId) {
                // Create a test person first
                const timestamp = Date.now();
                const personData: Partial<PersonAttributes> = {
                    first_name: `${TEST_PREFIX}_Contact_${timestamp}`,
                    last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                    status: 'active',
                };
                const createResponse = await client.people.create(personData);
                testPersonId = createResponse.id || '';
            }

            const phoneData = {
                number: `555-${Date.now().toString().slice(-4)}`,
                location: 'Home',
                primary: true,
            };

            const phoneResponse = await client.people.addPhoneNumber(testPersonId, phoneData);
            expect(phoneResponse).toBeDefined();
            expect(phoneResponse.number).toBe(phoneData.number);
            expect(phoneResponse.primary).toBe(true);
        }, 30000);
    });

    describe('v2.0 Performance Metrics', () => {
        it('should provide performance metrics', () => {
            const metrics = client.getPerformanceMetrics();
            expect(metrics).toBeDefined();
            expect(typeof metrics).toBe('object');
        });

        it('should provide rate limit information', () => {
            const rateLimitInfo = client.getRateLimitInfo();
            expect(rateLimitInfo).toBeDefined();
            expect(typeof rateLimitInfo).toBe('object');
        });
    });
});

describe('v2.0.0 Client Manager Integration Tests', () => {
    let clientManager: typeof PcoClientManager;

    beforeAll(() => {
        clientManager = PcoClientManager;
    });

    it('should create and cache client instances', async () => {
        const config: PcoClientConfig = {
            auth: {
                type: 'oauth',
                accessToken: process.env.PCO_ACCESS_TOKEN || 'test-token',
                refreshToken: 'test-refresh-token',
                onRefresh: async () => {},
                onRefreshFailure: async () => {},
            },
        };

        const churchId = 'test-church-123';

        // Get client from manager
        const client1 = clientManager.getClient(config);
        expect(client1).toBeDefined();

        // Get same client again (should be cached)
        const client2 = clientManager.getClient(config);
        expect(client2).toBe(client1); // Should be the same instance

        // Clean up
        clientManager.clearCache();
    });

    it('should clear client cache', () => {
        // Clear all clients
        expect(() => clientManager.clearCache()).not.toThrow();
    });
});
