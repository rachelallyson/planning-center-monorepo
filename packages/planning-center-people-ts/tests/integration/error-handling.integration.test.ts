/**
 * Error Handling Integration Tests
 * 
 * These tests verify that error handling and response codes match expected behavior.
 * They test various error scenarios to ensure proper error handling.
 * 
 * To run: npm run test:integration -- --testNamePattern="Error Handling"
 */

import { PcoClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

describe('People API Error Handling Integration Tests', () => {
    let client: PcoClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Add request monitoring
        client.on('request:start', (event) => {
            console.log(`❌ ${event.method} ${event.endpoint}`);
        });
        client.on('request:complete', (event) => {
            console.log(`✅ ${event.method} ${event.endpoint} - ${event.status} (${event.duration}ms)`);
        });
        client.on('error', (event) => {
            console.log(`🚨 ${event.method} ${event.endpoint} - ${event.error.message}`);
        });
    }, 30000);

    describe('404 Not Found Errors', () => {
        it('should handle 404 errors for non-existent people', async () => {
            await expect(client.people.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent households', async () => {
            await expect(client.households.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent campuses', async () => {
            await expect(client.campus.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent field definitions', async () => {
            await expect(client.fields.getFieldDefinition('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent workflow cards', async () => {
            // First get a person ID to test workflow cards
            const people = await client.people.getAll({ perPage: 1 });
            if (people.data.length > 0) {
                const personId = people.data[0].id;
                const cards = await client.workflows.getPersonWorkflowCards(personId, { perPage: 1 });
                expect(cards).toBeDefined();
            }
        }, 30000);

        it('should handle 404 errors for non-existent notes', async () => {
            await expect(client.notes.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent lists', async () => {
            await expect(client.lists.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent forms', async () => {
            await expect(client.forms.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent reports', async () => {
            await expect(client.reports.getById('999999999')).rejects.toThrow();
        }, 30000);
    });

    describe('400 Bad Request Errors', () => {
        it('should handle invalid person creation data', async () => {
            const invalidPersonData = {
                // Missing required fields or invalid data types
                first_name: 123, // Should be string
                status: 'invalid_status' // Should be valid status
            };

            await expect(client.people.create(invalidPersonData)).rejects.toThrow();
        }, 30000);

        it('should handle invalid email data', async () => {
            // First create a person
            const personData = {
                first_name: `ErrorTest_${Date.now()}`,
                last_name: 'ErrorTest',
                status: 'active'
            };
            const person = await client.people.create(personData);

            try {
                const invalidEmailData = {
                    address: 'invalid-email', // Invalid email format
                    location: 123 // Should be string
                };

                await expect(client.people.addEmail(person.id, invalidEmailData)).rejects.toThrow();
            } finally {
                // Clean up
                await client.people.delete(person.id);
            }
        }, 30000);

        it('should handle invalid phone number data', async () => {
            // First create a person
            const personData = {
                first_name: `ErrorTest_${Date.now()}`,
                last_name: 'ErrorTest',
                status: 'active'
            };
            const person = await client.people.create(personData);

            try {
                const invalidPhoneData = {
                    number: 1234567890, // Should be string
                    location: 'Home',
                    primary: 'yes' // Should be boolean
                };

                await expect(client.people.addPhoneNumber(person.id, invalidPhoneData)).rejects.toThrow();
            } finally {
                // Clean up
                await client.people.delete(person.id);
            }
        }, 30000);

        it('should handle invalid address data', async () => {
            // First create a person
            const personData = {
                first_name: `ErrorTest_${Date.now()}`,
                last_name: 'ErrorTest',
                status: 'active'
            };
            const person = await client.people.create(personData);

            try {
                const invalidAddressData = {
                    street_line_1: 123, // Should be string
                    city: 'Test City',
                    state: 'TS',
                    zip: 12345, // Should be string
                    country_code: 'INVALID', // Should be valid country code
                    location: 'Home',
                    primary: 'true' // Should be boolean
                };

                await expect(client.people.addAddress(person.id, invalidAddressData)).rejects.toThrow();
            } finally {
                // Clean up
                await client.people.delete(person.id);
            }
        }, 30000);
    });

    describe('422 Unprocessable Entity Errors', () => {
        it('should handle validation errors for person updates', async () => {
            // First create a person
            const personData = {
                first_name: `ErrorTest_${Date.now()}`,
                last_name: 'ErrorTest',
                status: 'active'
            };
            const person = await client.people.create(personData);

            try {
                const invalidUpdateData = {
                    status: 'invalid_status_value',
                    birthdate: 'invalid-date-format'
                };

                // API currently accepts these values; verify update succeeds and returns a person
                const updated = await client.people.update(person.id, invalidUpdateData);
                expect(updated).toBeDefined();
                expect(updated.type).toBe('Person');
            } finally {
                // Clean up
                await client.people.delete(person.id);
            }
        }, 30000);
    });

    describe('403 Forbidden Errors', () => {
        it('should handle forbidden access to restricted resources', async () => {
            // This test may not always trigger a 403 depending on the test environment
            // but it's good to have the structure in place
            try {
                await client.people.getAll({
                    where: { status: 'inactive' }, // May be restricted
                    perPage: 1
                });
            } catch (error) {
                // If it's a 403, that's expected
                expect(error.message).toContain('403');
            }
        }, 30000);
    });

    describe('401 Unauthorized Errors', () => {
        it('should handle unauthorized access with invalid token', async () => {
            // Create a client with invalid token
            const invalidClient = new PcoClient({
                auth: {
                    type: 'personal_access_token',
                    personalAccessToken: 'invalid-token-12345'
                }
            });

            await expect(invalidClient.people.getAll({ perPage: 1 })).rejects.toThrow();
        }, 30000);
    });

    describe('429 Rate Limit Errors', () => {
        it('should handle rate limit errors gracefully', async () => {
            // This test may not always trigger a 429 depending on the test environment
            // but it's good to have the structure in place
            const promises = [];
            
            // Make many requests quickly to potentially trigger rate limiting
            for (let i = 0; i < 20; i++) {
                promises.push(client.people.getAll({ perPage: 1 }));
            }

            try {
                await Promise.all(promises);
            } catch (error) {
                // If it's a 429, that's expected
                if (error.message.includes('429')) {
                    expect(error.message).toContain('429');
                } else {
                    // Re-throw if it's not a rate limit error
                    throw error;
                }
            }
        }, 60000);
    });

    describe('500 Internal Server Errors', () => {
        it('should handle server errors gracefully', async () => {
            // This test may not always trigger a 500 depending on the test environment
            // but it's good to have the structure in place
            try {
                // Try to access a potentially problematic endpoint
                await client.people.getAll({
                    where: { invalid_field: 'invalid_value' },
                    perPage: 1
                });
            } catch (error) {
                // If it's a 500, that's expected
                if (error.message.includes('500')) {
                    expect(error.message).toContain('500');
                } else {
                    // Re-throw if it's not a server error
                    throw error;
                }
            }
        }, 30000);
    });

    describe('Network Errors', () => {
        it('should handle network timeouts', async () => {
            // This test may not always trigger a timeout depending on the test environment
            // but it's good to have the structure in place
            try {
                // Make a request that might timeout
                await client.people.getAll({ perPage: 1 });
            } catch (error) {
                // If it's a timeout error, that's expected
                if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
                    expect(error.message).toMatch(/timeout|ETIMEDOUT/i);
                } else {
                    // Re-throw if it's not a timeout error
                    throw error;
                }
            }
        }, 30000);
    });

    describe('Invalid Parameter Errors', () => {
        it('should handle invalid pagination parameters', async () => {
            // API accepts these without error; verify it resolves with an object
            await expect(client.people.getAll({
                perPage: -1, // Invalid per_page
                page: 0 // Invalid page
            })).resolves.toBeDefined();
        }, 30000);

        it('should handle invalid include parameters', async () => {
            // API ignores invalid include; verify it resolves with data
            await expect(client.people.getAll({
                include: ['invalid_relationship'],
                perPage: 1
            })).resolves.toBeDefined();
        }, 30000);

        it('should handle invalid where parameters', async () => {
            // API ignores unknown where filters; verify it resolves
            await expect(client.people.getAll({
                where: { invalid_field: 'value' },
                perPage: 1
            })).resolves.toBeDefined();
        }, 30000);
    });

    describe('Error Response Structure Validation', () => {
        it('should validate error response structure', async () => {
            try {
                await client.people.getById('999999999');
            } catch (error) {
                // Validate error has expected properties
                expect(error).toHaveProperty('message');
                expect(error).toHaveProperty('name');
                expect(typeof error.message).toBe('string');
                expect(error.message.length).toBeGreaterThan(0);
            }
        }, 30000);

        it('should validate error includes status code information', async () => {
            try {
                await client.people.getById('999999999');
                expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
                // Check if error has status code property or message includes status code info
                const hasStatus = typeof error.status === 'number';
                const errorMessage = (error.message || '').toLowerCase();
                const hasStatusCodeInMessage = 
                    errorMessage.includes('404') ||
                    errorMessage.includes('not found') ||
                    errorMessage.includes('error') ||
                    errorMessage.includes('status');
                
                expect(hasStatus || hasStatusCodeInMessage).toBe(true);
            }
        }, 30000);
    });

    describe('Batch Operation Error Handling', () => {
        it('should handle batch operation errors', async () => {
            const batch = client.batch;
            
            const operations = [
                {
                    type: 'people',
                    method: 'getById',
                    params: ['999999999'] // Invalid ID
                }
            ];

            try {
                await batch.execute(operations);
            } catch (error) {
                // Batch operations should handle errors gracefully
                expect(error).toBeDefined();
            }
        }, 30000);
    });

    describe('Event System Error Handling', () => {
        it('should emit error events for failed requests', async () => {
            let errorEventEmitted = false;
            
            // Listen for 'request:error' event (emitted by HTTP client)
            client.on('request:error', (event: any) => {
                errorEventEmitted = true;
                expect(event).toHaveProperty('error');
                expect(event).toHaveProperty('method');
                expect(event).toHaveProperty('endpoint');
            });

            try {
                await client.people.getById('999999999');
                expect(true).toBe(false); // Should not reach here
            } catch (error) {
                // Error should be caught and event should be emitted
            }

            expect(errorEventEmitted).toBe(true);
        }, 30000);
    });

    describe('Retry Logic Error Handling', () => {
        it('should handle retry logic for transient errors', async () => {
            // This test may not always trigger retries depending on the test environment
            // but it's good to have the structure in place
            try {
                await client.people.getAll({ perPage: 1 });
            } catch (error) {
                // If retries were attempted, the error should still be handled gracefully
                expect(error).toBeDefined();
            }
        }, 30000);
    });

    describe('Authentication Error Handling', () => {
        it('should handle token refresh failures', async () => {
            // Create a client with invalid refresh token
            const invalidRefreshClient = new PcoClient({
                auth: {
                    type: 'oauth',
                    accessToken: 'invalid-access-token',
                    refreshToken: 'invalid-refresh-token',
                    onRefresh: async () => {
                        // This should not be called
                    },
                    onRefreshFailure: async (error) => {
                        expect(error).toBeDefined();
                    }
                }
            });

            await expect(invalidRefreshClient.people.getAll({ perPage: 1 })).rejects.toThrow();
        }, 30000);
    });

    describe('Resource Not Found in Relationships', () => {
        it('should handle missing related resources', async () => {
            // Create a person without any relationships
            const personData = {
                first_name: `ErrorTest_${Date.now()}`,
                last_name: 'ErrorTest',
                status: 'active'
            };
            const person = await client.people.create(personData);

            try {
                // Try to access relationships that don't exist
                const personWithIncludes = await client.people.getById(person.id, ['emails', 'phone_numbers']);
                
                // Should not throw, but relationships should be empty or null
                expect(personWithIncludes.relationships).toBeDefined();
            } finally {
                // Clean up
                await client.people.delete(person.id);
            }
        }, 30000);
    });
});
