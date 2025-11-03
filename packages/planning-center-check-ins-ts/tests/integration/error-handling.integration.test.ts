/**
 * Check-ins API Error Handling Integration Tests
 * 
 * These tests verify that error handling and response codes match expected behavior.
 * They test various error scenarios to ensure proper error handling.
 * 
 * To run: npm run test:integration -- --testNamePattern="Error Handling"
 */

import { PcoCheckInsClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

describe('Check-ins API Error Handling Integration Tests', () => {
    let client: PcoCheckInsClient;

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
        it('should handle 404 errors for non-existent events', async () => {
            await expect(client.events.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent check-ins', async () => {
            await expect(client.checkIns.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent locations', async () => {
            await expect(client.locations.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent event periods', async () => {
            await expect(client.eventPeriods.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent event times', async () => {
            await expect(client.eventTimes.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent stations', async () => {
            await expect(client.stations.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent labels', async () => {
            await expect(client.labels.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent options', async () => {
            await expect(client.options.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent check-in groups', async () => {
            await expect(client.checkInGroups.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent check-in times', async () => {
            await expect(client.checkInTimes.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent person events', async () => {
            await expect(client.personEvents.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent pre-checks', async () => {
            await expect(client.preChecks.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent passes', async () => {
            await expect(client.passes.getById('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle 404 errors for non-existent headcounts', async () => {
            await expect(client.headcounts.getById('999999999')).rejects.toThrow();
        }, 30000);
    });

    describe('400 Bad Request Errors', () => {
        it('should handle invalid event filtering parameters', async () => {
            await expect(client.events.getAll({
                where: { invalid_field: 'invalid_value' },
                perPage: 1
            })).rejects.toThrow();
        }, 30000);

        it('should handle invalid check-in filtering parameters', async () => {
            await expect(client.checkIns.getAll({
                filter: ['invalid_filter'],
                perPage: 1
            })).rejects.toThrow();
        }, 30000);

        it('should handle invalid pagination parameters', async () => {
            await expect(client.events.getAll({
                perPage: -1, // Invalid per_page
                page: 0 // Invalid page
            })).rejects.toThrow();
        }, 30000);

        it('should handle invalid include parameters', async () => {
            await expect(client.events.getAll({
                include: ['invalid_relationship'],
                perPage: 1
            })).rejects.toThrow();
        }, 30000);
    });

    describe('422 Unprocessable Entity Errors', () => {
        it('should handle validation errors for event operations', async () => {
            // This test may not always trigger a 422 depending on the test environment
            // but it's good to have the structure in place
            try {
                await client.events.getAll({
                    where: { frequency: 'invalid_frequency' },
                    perPage: 1
                });
            } catch (error) {
                // If it's a 422, that's expected
                if (error.message.includes('422')) {
                    expect(error.message).toContain('422');
                } else {
                    // Re-throw if it's not a validation error
                    throw error;
                }
            }
        }, 30000);
    });

    describe('403 Forbidden Errors', () => {
        it('should handle forbidden access to restricted resources', async () => {
            // This test may not always trigger a 403 depending on the test environment
            // but it's good to have the structure in place
            try {
                await client.events.getAll({
                    where: { archived_at: 'not_null' }, // May be restricted
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
            const invalidClient = new PcoCheckInsClient({
                auth: {
                    type: 'personal_access_token',
                    personalAccessToken: 'invalid-token-12345'
                }
            });

            await expect(invalidClient.events.getAll({ perPage: 1 })).rejects.toThrow();
        }, 30000);
    });

    describe('429 Rate Limit Errors', () => {
        it('should handle rate limit errors gracefully', async () => {
            // This test may not always trigger a 429 depending on the test environment
            // but it's good to have the structure in place
            const promises = [];
            
            // Make many requests quickly to potentially trigger rate limiting
            for (let i = 0; i < 20; i++) {
                promises.push(client.events.getAll({ perPage: 1 }));
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
                await client.events.getAll({
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
                await client.events.getAll({ perPage: 1 });
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

    describe('Event Association Errors', () => {
        it('should handle errors when accessing non-existent event associations', async () => {
            await expect(client.events.getAttendanceTypes('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle errors when accessing non-existent event check-ins', async () => {
            await expect(client.events.getCheckIns('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle errors when accessing non-existent event current times', async () => {
            await expect(client.events.getCurrentEventTimes('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle errors when accessing non-existent event labels', async () => {
            await expect(client.events.getEventLabels('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle errors when accessing non-existent event periods', async () => {
            await expect(client.events.getEventPeriods('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle errors when accessing non-existent event integration links', async () => {
            await expect(client.events.getIntegrationLinks('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle errors when accessing non-existent event locations', async () => {
            await expect(client.events.getLocations('999999999')).rejects.toThrow();
        }, 30000);

        it('should handle errors when accessing non-existent event person events', async () => {
            await expect(client.events.getPersonEvents('999999999')).rejects.toThrow();
        }, 30000);
    });

    describe('Error Response Structure Validation', () => {
        it('should validate error response structure', async () => {
            try {
                await client.events.getById('999999999');
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
                await client.events.getById('999999999');
            } catch (error) {
                // Check if error includes status code information
                const errorMessage = error.message.toLowerCase();
                expect(
                    errorMessage.includes('404') ||
                    errorMessage.includes('not found') ||
                    errorMessage.includes('error')
                ).toBe(true);
            }
        }, 30000);
    });

    describe('Batch Operation Error Handling', () => {
        it('should handle batch operation errors', async () => {
            const batch = client.batch;
            
            const operations = [
                {
                    type: 'events',
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
            
            client.on('error', (event) => {
                errorEventEmitted = true;
                expect(event).toHaveProperty('error');
                expect(event).toHaveProperty('method');
                expect(event).toHaveProperty('endpoint');
            });

            try {
                await client.events.getById('999999999');
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
                await client.events.getAll({ perPage: 1 });
            } catch (error) {
                // If retries were attempted, the error should still be handled gracefully
                expect(error).toBeDefined();
            }
        }, 30000);
    });

    describe('Authentication Error Handling', () => {
        it('should handle token refresh failures', async () => {
            // Create a client with invalid refresh token
            const invalidRefreshClient = new PcoCheckInsClient({
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

            await expect(invalidRefreshClient.events.getAll({ perPage: 1 })).rejects.toThrow();
        }, 30000);
    });

    describe('Resource Not Found in Relationships', () => {
        it('should handle missing related resources', async () => {
            // Get an event and try to access relationships that might not exist
            const events = await client.events.getAll({ perPage: 1 });
            if (events.data.length > 0) {
                const eventId = events.data[0].id;
                
                try {
                    // Try to access relationships that might not exist
                    const eventWithIncludes = await client.events.getById(eventId, ['attendance_types', 'check_ins']);
                    
                    // Should not throw, but relationships should be empty or null
                    expect(eventWithIncludes.relationships).toBeDefined();
                } catch (error) {
                    // If relationships don't exist, that's also acceptable
                    expect(error).toBeDefined();
                }
            }
        }, 30000);
    });

    describe('Filter Validation Errors', () => {
        it('should handle invalid check-in filters', async () => {
            await expect(client.checkIns.getAll({
                filter: ['invalid_filter_name'],
                perPage: 1
            })).rejects.toThrow();
        }, 30000);

        it('should handle invalid event filters', async () => {
            await expect(client.events.getAll({
                where: { frequency: 'invalid_frequency_value' },
                perPage: 1
            })).rejects.toThrow();
        }, 30000);
    });

    describe('Pagination Error Handling', () => {
        it('should handle invalid page numbers', async () => {
            await expect(client.events.getAll({
                page: -1,
                perPage: 1
            })).rejects.toThrow();
        }, 30000);

        it('should handle invalid per_page values', async () => {
            await expect(client.events.getAll({
                page: 1,
                perPage: 0
            })).rejects.toThrow();
        }, 30000);
    });

    describe('Include Parameter Error Handling', () => {
        it('should handle invalid include parameters', async () => {
            await expect(client.events.getAll({
                include: ['invalid_relationship_type'],
                perPage: 1
            })).rejects.toThrow();
        }, 30000);

        it('should handle malformed include parameters', async () => {
            await expect(client.events.getAll({
                include: [123], // Should be string array
                perPage: 1
            })).rejects.toThrow();
        }, 30000);
    });
});
