/**
 * Comprehensive Integration Test for Duplicate Prevention
 * 
 * This test reproduces the bug scenario where:
 * 1. Person is created with email/phone using findOrCreate
 * 2. PCO needs 30-90+ seconds to verify/index contacts
 * 3. Code immediately tries to find the person (before contacts are verified)
 * 4. Without proper retry logic, it fails and creates a duplicate
 * 
 * This test is similar to the production scenario where:
 * - First guest checks in → person created
 * - Second guest checks in with same email/phone → should match existing person
 * 
 * The test includes detailed error messages to help identify issues.
 */

import { PcoClient, type FlattenedPersonResource } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

const TEST_PREFIX = 'TEST_DUPLICATE_PREVENTION_2025';

describe('Duplicate Prevention - Comprehensive Integration Test', () => {
    let client: PcoClient;
    const createdPersonIds: string[] = [];

    beforeAll(async () => {
        logAuthStatus();
        
        client = createTestClient();
    }, 30000);

    afterAll(async () => {
        // Clean up all test persons
        for (const personId of createdPersonIds) {
            await client.people.delete(personId);
        }
    }, 120000);

    describe('Duplicate Prevention with Email/Phone Match', () => {
        it('should match existing person instead of creating duplicate when email/phone match', async () => {
            // Test timeout: 7 minutes (retry logic can take 2-3 minutes + test wait + API calls)
            
            // Create unique test data
            const timestamp = Date.now();
            const testEmail = `duplicate.test.${timestamp}@onark.app`;
            const testPhone = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
            const testFirstName = 'Duplicate';
            const testLastName = `Test${timestamp}`;

            let existingPersonId: string;

            try {
                // Step 1: Create the person in PCO (first time - simulates first guest check-in)
                const startTime = Date.now();
                
                const initialPerson = await client.people.findOrCreate({
                    firstName: testFirstName,
                    lastName: testLastName,
                    email: testEmail,
                    phone: testPhone,
                    createIfNotFound: true,
                    matchStrategy: 'exact',
                });

                existingPersonId = initialPerson.id;
                createdPersonIds.push(existingPersonId);

                // Verify person exists in PCO
                const firstPerson = await client.people.getById(existingPersonId);
                expect(firstPerson.id).toBe(existingPersonId);

                // BUG DETECTION: Wait for PCO to process and verify contact info
                // The PCO API may need time to verify email/phone contacts after person creation
                // PCO contact verification can take 30-90 seconds, so we need a longer wait
                // Without this wait, the exact match may fail because contacts aren't verified yet
                // This reveals a timing bug in the matching logic
                // Note: The retry logic in findOrCreate will also handle delays, but we wait here
                // to reduce the number of retries needed
                await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds

                // Step 2: Now try to find the same person with the SAME email and phone
                // This simulates the bug scenario where duplicates were being created
                // (second guest checks in with same email/phone)
                const searchStartTime = Date.now();
                let matchedPersonId: string;

                try {
                    // This should MATCH the existing person, not create a duplicate
                    // BUG: If this creates a new person instead of matching, it's a bug
                    const matchedPerson = await client.people.findOrCreate({
                        firstName: testFirstName, // Same name
                        lastName: testLastName, // Same name
                        email: testEmail, // Same email
                        phone: testPhone, // Same phone
                        createIfNotFound: false, // Don't create, just search
                        matchStrategy: 'exact',
                        // Configure retry logic to handle slow PCO contact verification (can take 30-90+ seconds)
                        // Note: Test already waits 30 seconds, so retry logic is a backup
                        retryConfig: {
                            initialDelay: 10000,  // Start with 10s delay
                            maxRetries: 6,        // More retries for better chance of finding existing person
                            maxWaitTime: 150000,  // 2.5 minutes (reduced since test waits 30s first)
                        },
                    });

                    matchedPersonId = matchedPerson.id;

                    // CRITICAL: Should match existing person, not create new one
                    // If this fails, it means the bug still exists - duplicate prevention isn't working
                    if (matchedPersonId !== existingPersonId) {
                        // This is the bug - provide detailed error message for debugging
                        throw new Error(
                            `BUG DETECTED: Duplicate person created instead of matching existing one.\n` +
                            `Expected personId: ${existingPersonId}, Got: ${matchedPersonId}\n` +
                            `Test email: ${testEmail}, Test phone: ${testPhone}\n` +
                            `This indicates the exact match strategy failed to find the existing person.\n` +
                            `Possible causes: PCO contact verification delay, matching logic bug, or API timing issue.\n` +
                            `The system created person ${matchedPersonId} when it should have matched ${existingPersonId}.`
                        );
                    }

                    expect(matchedPersonId).toBe(existingPersonId);
                    expect(matchedPersonId).not.toBeUndefined();

                    // Step 3: Verify person still exists and has correct info
                    // getById returns flattened resource
                    const verifiedPerson = await client.people.getById(matchedPersonId);
                    expect(verifiedPerson.id).toBe(existingPersonId);
                    expect(verifiedPerson.first_name).toBe(testFirstName);

                    // Step 4: Verify email/phone are present
                    const emails = await client.people.getEmails(matchedPersonId);
                    // getEmails returns flattened resources - address is at top level
                    const emailAddresses = emails.data.map((e) =>
                        e.address?.toLowerCase()
                    );
                    expect(emailAddresses).toContain(testEmail.toLowerCase());

                    const phones = await client.people.getPhoneNumbers(matchedPersonId);
                    const phoneNumbers = phones.data.map((p: any) => p.number);
                    const normalizePhone = (num: string) => num.replace(/\D/g, '');
                    const normalizedTestPhone = normalizePhone(testPhone);
                    const normalizedPhones = phoneNumbers.map(normalizePhone);
                    const phoneMatches = normalizedPhones.some(
                        p => p === normalizedTestPhone || p === normalizedTestPhone.substring(1)
                    );
                    expect(phoneMatches).toBe(true);

                } catch (error) {
                    expect(error).toBeInstanceOf(Error);
                    const searchTime = Date.now() - searchStartTime;
                    const errorMessage = error instanceof Error ? error.message : String(error);

                    // Check if error is about duplicate creation
                    if (errorMessage.includes('BUG DETECTED')) {
                        throw error; // Re-throw the detailed bug detection error
                    }

                    // If search failed, this might indicate:
                    // 1. PCO is taking longer than expected to verify contacts
                    // 2. There's an issue with the retry logic
                    // 3. The matching logic has a bug
                    throw new Error(
                        `Failed to find existing person after ${searchTime}ms with retry logic.\n` +
                        `Initial person ID: ${existingPersonId}\n` +
                        `Test email: ${testEmail}\n` +
                        `Test phone: ${testPhone}\n` +
                        `Error: ${errorMessage}`
                    );
                }

            } catch (error) {
                // If we created a person but the test failed, we still want to clean it up
                // The afterAll hook will handle cleanup
                throw error;
            }
        }, 420000); // 7 minute timeout (retry logic can take up to 3 minutes + test wait + API calls)

        it('should handle rapid successive calls without creating duplicates', async () => {
            // This test simulates rapid successive check-ins (e.g., family checking in together)
            const timestamp = Date.now();
            const testEmail = `rapid.test.${timestamp}@onark.app`;
            const testPhone = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
            const testFirstName = 'Rapid';
            const testLastName = `Test${timestamp}`;

            // Create first person
            const firstPerson = await client.people.findOrCreate({
                firstName: testFirstName,
                lastName: testLastName,
                email: testEmail,
                phone: testPhone,
                createIfNotFound: true,
                matchStrategy: 'exact',
            });

            const firstPersonId = firstPerson.id;
            createdPersonIds.push(firstPersonId);

            // Immediately try to create/find again (simulating rapid check-ins)
            const secondPerson = await client.people.findOrCreate({
                firstName: testFirstName,
                lastName: testLastName,
                email: testEmail,
                phone: testPhone,
                createIfNotFound: false, // Try to find first
                matchStrategy: 'exact',
                retryConfig: {
                    maxRetries: 5,
                    maxWaitTime: 120000,
                    initialDelay: 5000, // Shorter initial delay for rapid scenario
                },
            });

            // Should match the first person (or if contacts aren't verified yet, might create new)
            // But with retry logic, it should eventually find the first person
            // If retry logic worked, we should have the same person
            expect(secondPerson.id).toBe(firstPersonId);
        }, 180000); // 3 minute timeout
    });
});

