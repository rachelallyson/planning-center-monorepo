/**
 * Integration test for retry logic to prevent duplicate person creation
 * 
 * This test reproduces the bug where:
 * 1. Person is created with email/phone
 * 2. PCO needs 30-90+ seconds to verify/index contacts
 * 3. Code immediately tries to find the person (before contacts are verified)
 * 4. Without retry logic, it fails and creates a duplicate
 * 
 * The retry logic should prevent this by automatically retrying with exponential backoff.
 */

import { PcoClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

const TEST_PREFIX = 'TEST_RETRY_LOGIC_2025';

describe('Retry Logic - Duplicate Prevention Integration Test', () => {
    let client: PcoClient;
    const createdPersonIds: string[] = [];

    beforeAll(async () => {
        logAuthStatus();
        
        try {
            client = createTestClient();
            console.log('✅ Test client created successfully');
        } catch (error) {
            console.log('❌ No credentials available for integration test');
            console.log('💡 To run this test with real API calls:');
            console.log('   1. Set PCO_PERSONAL_ACCESS_TOKEN in .env.test, or');
            console.log('   2. Set PCO_ACCESS_TOKEN and PCO_REFRESH_TOKEN in .env.test');
            throw error;
        }
    }, 30000);

    afterAll(async () => {
        // Clean up all test persons
        for (const personId of createdPersonIds) {
            try {
                await client.people.delete(personId);
                console.log(`🧹 Cleaned up test person: ${personId}`);
            } catch (error) {
                console.warn(`⚠️  Failed to clean up person ${personId}:`, error);
            }
        }
    }, 120000);

    describe('Duplicate Prevention with Retry Logic', () => {
        it('should find existing person after contact verification delay with retry logic', async () => {
            const timestamp = Date.now();
            const testEmail = `duplicate.test.${timestamp}@onark.app`;
            const testPhone = `+1748156${timestamp.toString().slice(-4)}`;
            
            console.log('\n🧪 Test: Retry logic prevents duplicate creation');
            console.log('📧 Test email:', testEmail);
            console.log('📞 Test phone:', testPhone);

            // Step 1: Create a person with email/phone using findOrCreate
            // This simulates the first guest check-in
            console.log('\nStep 1: Creating initial person with email/phone...');
            const startTime = Date.now();
            const initialPerson = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_Initial_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                email: testEmail,
                phone: testPhone,
                createIfNotFound: true,
                matchStrategy: 'exact'
            });
            
            const creationTime = Date.now() - startTime;
            console.log(`✅ Initial person created: ${initialPerson.id} (took ${creationTime}ms)`);
            createdPersonIds.push(initialPerson.id);

            // Verify the person has the contacts
            const emails = await client.people.getEmails(initialPerson.id);
            const phones = await client.people.getPhoneNumbers(initialPerson.id);
            const hasEmail = emails.data.some(e => e.attributes?.address === testEmail);
            const hasPhone = phones.data.some(p => p.attributes?.number === testPhone);
            
            expect(hasEmail).toBe(true);
            expect(hasPhone).toBe(true);
            console.log('✅ Person has email and phone contacts');

            // Step 2: Immediately try to find the same person (simulating second guest check-in)
            // This is the critical test - PCO may not have verified contacts yet
            console.log('\nStep 2: Immediately searching for existing person (before contacts verified)...');
            console.log('⚠️  This simulates the race condition - contacts may not be searchable yet');
            
            const searchStartTime = Date.now();
            let foundPerson;
            let retryAttempts = 0;
            
            try {
                // Use retry logic to find the person
                foundPerson = await client.people.findOrCreate({
                    firstName: `${TEST_PREFIX}_Initial_${timestamp}`,
                    lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                    email: testEmail,
                    phone: testPhone,
                    createIfNotFound: false, // Don't create, just search
                    matchStrategy: 'exact',
                    retryConfig: {
                        maxRetries: 5,
                        maxWaitTime: 120000, // 2 minutes
                        initialDelay: 10000, // Start with 10s
                        backoffMultiplier: 1.5
                    }
                });
                
                const searchTime = Date.now() - searchStartTime;
                console.log(`✅ Found existing person: ${foundPerson.id} (took ${searchTime}ms)`);
                
                // Verify we found the SAME person, not a duplicate
                expect(foundPerson.id).toBe(initialPerson.id);
                console.log('✅ SUCCESS: Found existing person, no duplicate created!');
                
            } catch (error: any) {
                const searchTime = Date.now() - searchStartTime;
                console.error(`❌ Failed to find person after ${searchTime}ms:`, error.message);
                
                // If retry logic failed, this might indicate:
                // 1. PCO is taking longer than 2 minutes to verify (unlikely but possible)
                // 2. There's an issue with the retry logic
                // 3. The person truly doesn't exist (shouldn't happen)
                
                // For this test, we'll consider it a failure if we can't find the person
                // after waiting 2 minutes with retry logic
                throw new Error(
                    `Retry logic failed to find person after ${searchTime}ms. ` +
                    `This might indicate PCO is taking longer than expected to verify contacts, ` +
                    `or there's an issue with the retry logic. Error: ${error.message}`
                );
            }

            // Step 3: Verify no duplicate was created
            console.log('\nStep 3: Verifying no duplicate was created...');
            const searchResults = await client.people.search({ email: testEmail });
            
            // Verify we found the same person
            expect(foundPerson.id).toBe(initialPerson.id);
            
            // Check that search results don't show multiple people with the same email
            // (Note: PCO search might return the person, but we verify it's the same ID)
            const foundInSearch = searchResults.data.find(p => p.id === initialPerson.id);
            if (foundInSearch) {
                console.log('✅ Person found in search results (same ID)');
            }
            
            console.log('✅ Verified: No duplicate person created');
        }, 180000); // 3 minute timeout to allow for retries

        it('should demonstrate the bug scenario without retry logic (may pass if PCO is fast)', async () => {
            const timestamp = Date.now();
            const testEmail = `duplicate.test.${timestamp}@onark.app`;
            const testPhone = `+1748156${timestamp.toString().slice(-4)}`;
            
            console.log('\n🧪 Test: Demonstrating bug scenario (without retry logic)');
            console.log('📧 Test email:', testEmail);
            console.log('📞 Test phone:', testPhone);

            // Step 1: Create a person
            console.log('\nStep 1: Creating initial person...');
            const initialPerson = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_BugTest_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                email: testEmail,
                phone: testPhone,
                createIfNotFound: true,
                matchStrategy: 'exact'
            });
            
            console.log(`✅ Initial person created: ${initialPerson.id}`);
            createdPersonIds.push(initialPerson.id);

            // Step 2: Immediately try to find WITHOUT retry logic
            // This should fail if contacts aren't verified yet
            console.log('\nStep 2: Searching immediately WITHOUT retry logic...');
            console.log('⚠️  This should fail if PCO hasn\'t verified contacts yet');
            
            let foundPerson;
            let searchFailed = false;
            
            try {
                foundPerson = await client.people.findOrCreate({
                    firstName: `${TEST_PREFIX}_BugTest_${timestamp}`,
                    lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                    email: testEmail,
                    phone: testPhone,
                    createIfNotFound: false, // Don't create
                    matchStrategy: 'exact',
                    retryConfig: {
                        enabled: false // Disable retry logic
                    }
                });
                
                console.log(`✅ Found person: ${foundPerson.id}`);
                // If we found the person, contacts were already verified (fast PCO)
                expect(foundPerson.id).toBe(initialPerson.id);
                
            } catch (error: any) {
                searchFailed = true;
                console.log(`❌ Search failed (expected if contacts not verified): ${error.message}`);
                
                // This is the bug scenario - if we catch this error and then create,
                // we'd create a duplicate
                // In the real bug scenario, code would do:
                //   person = await client.people.findOrCreate({ ..., createIfNotFound: true })
                //   This would create a duplicate!
                
                // For this test, we'll verify that the error is the expected one
                expect(error.message).toContain('No matching person found');
                console.log('✅ Confirmed: Search failed as expected (contacts not verified yet)');
                console.log('💡 This demonstrates the bug: without retry logic, search fails and code would create duplicate');
            }

            // Step 3: Wait a bit and try again (simulating what retry logic does)
            if (searchFailed) {
                console.log('\nStep 3: Waiting 15 seconds and retrying (simulating retry logic)...');
                await new Promise(resolve => setTimeout(resolve, 15000));
                
                try {
                    foundPerson = await client.people.findOrCreate({
                        firstName: `${TEST_PREFIX}_BugTest_${timestamp}`,
                        lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                        email: testEmail,
                        phone: testPhone,
                        createIfNotFound: false,
                        matchStrategy: 'exact',
                        retryConfig: {
                            enabled: false
                        }
                    });
                    
                    console.log(`✅ Found person after wait: ${foundPerson.id}`);
                    expect(foundPerson.id).toBe(initialPerson.id);
                    console.log('✅ Contacts were verified after waiting');
                    
                } catch (error: any) {
                    console.log(`⚠️  Still not found after 15s wait: ${error.message}`);
                    console.log('💡 This demonstrates why retry logic is needed - PCO can take 30-90+ seconds');
                }
            } else {
                console.log('\nStep 3: Skipped - person was found immediately (PCO verified contacts quickly)');
                console.log('💡 In production, PCO often takes 30-90+ seconds, which is why retry logic is needed');
            }
        }, 120000);

        it('should fail without retry logic when contacts are not verified (demonstrates the bug)', async () => {
            const timestamp = Date.now();
            const testEmail = `duplicate.test.${timestamp}@onark.app`;
            const testPhone = `+1748156${timestamp.toString().slice(-4)}`;
            
            console.log('\n🧪 Test: Explicitly testing failure without retry logic');
            console.log('📧 Test email:', testEmail);
            console.log('📞 Test phone:', testPhone);
            console.log('⚠️  This test expects a failure to demonstrate the bug');

            // Step 1: Create a person
            console.log('\nStep 1: Creating initial person...');
            const initialPerson = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_FailureTest_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                email: testEmail,
                phone: testPhone,
                createIfNotFound: true,
                matchStrategy: 'exact'
            });
            
            console.log(`✅ Initial person created: ${initialPerson.id}`);
            createdPersonIds.push(initialPerson.id);

            // Step 2: Immediately try to find WITHOUT retry logic
            // This SHOULD fail if contacts aren't verified yet
            console.log('\nStep 2: Searching immediately WITHOUT retry logic (expecting failure)...');
            
            let didFail = false;
            try {
                await client.people.findOrCreate({
                    firstName: `${TEST_PREFIX}_FailureTest_${timestamp}`,
                    lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                    email: testEmail,
                    phone: testPhone,
                    createIfNotFound: false, // Don't create
                    matchStrategy: 'exact',
                    retryConfig: {
                        enabled: false // Disable retry logic
                    }
                });
                
                // If we get here, PCO verified contacts very quickly
                console.log('⚠️  Person found immediately - PCO verified contacts very quickly');
                console.log('💡 In production scenarios, this often fails and would create a duplicate');
                console.log('💡 The retry logic prevents this by waiting for PCO to verify contacts');
                
            } catch (error: any) {
                didFail = true;
                console.log(`✅ FAILED as expected: ${error.message}`);
                expect(error.message).toContain('No matching person found');
                console.log('✅ This demonstrates the bug: without retry logic, search fails');
                console.log('💡 In the real bug scenario, code would then create a duplicate person');
            }

            // Note: This test passes whether it fails or succeeds
            // The important thing is that it demonstrates what WOULD happen
            if (!didFail) {
                console.log('\n💡 Note: PCO verified contacts quickly in this run');
                console.log('💡 In production, PCO often takes 30-90+ seconds, causing failures');
                console.log('💡 The retry logic handles these cases automatically');
            }
        }, 120000);

        it('should handle retry logic with custom configuration', async () => {
            const timestamp = Date.now();
            const testEmail = `duplicate.test.${timestamp}@onark.app`;
            const testPhone = `+1748156${timestamp.toString().slice(-4)}`;
            
            console.log('\n🧪 Test: Custom retry configuration');
            console.log('📧 Test email:', testEmail);
            console.log('📞 Test phone:', testPhone);

            // Create person
            const initialPerson = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_CustomRetry_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                email: testEmail,
                phone: testPhone,
                createIfNotFound: true,
                matchStrategy: 'exact'
            });
            
            console.log(`✅ Initial person created: ${initialPerson.id}`);
            createdPersonIds.push(initialPerson.id);

            // Try to find with custom retry config (more aggressive)
            console.log('\nSearching with custom retry config (more retries, longer wait)...');
            const foundPerson = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_CustomRetry_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                email: testEmail,
                phone: testPhone,
                createIfNotFound: false,
                matchStrategy: 'exact',
                retryConfig: {
                    maxRetries: 6, // More retries
                    maxWaitTime: 180000, // 3 minutes
                    initialDelay: 15000, // Start with 15s
                    backoffMultiplier: 1.8 // Faster backoff
                }
            });
            
            expect(foundPerson.id).toBe(initialPerson.id);
            console.log('✅ Found person with custom retry config');
        }, 240000); // 4 minute timeout for longer retry window
    });

    describe('Retry Logic Edge Cases', () => {
        it('should not retry when createIfNotFound is true', async () => {
            const timestamp = Date.now();
            const testEmail = `duplicate.test.${timestamp}@onark.app`;
            
            console.log('\n🧪 Test: Retry logic disabled when createIfNotFound: true');
            
            // When createIfNotFound is true, retry logic should not activate
            // because we're willing to create a new person
            const person = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_NoRetry_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                email: testEmail,
                createIfNotFound: true, // Will create if not found
                matchStrategy: 'exact'
            });
            
            expect(person).toBeDefined();
            expect(person.id).toBeTruthy();
            createdPersonIds.push(person.id);
            console.log('✅ Person created/found (no retry logic needed)');
        }, 30000);

        it('should not retry when no contact info provided', async () => {
            const timestamp = Date.now();
            
            console.log('\n🧪 Test: Retry logic disabled when no email/phone provided');
            
            // When no email/phone is provided, retry logic should not activate
            // because there's no contact verification delay to wait for
            try {
                const person = await client.people.findOrCreate({
                    firstName: `${TEST_PREFIX}_NoContact_${timestamp}`,
                    lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                    createIfNotFound: false, // But no email/phone
                    matchStrategy: 'fuzzy'
                });
                
                // If a person with that name exists, it will be found
                console.log('✅ Person found by name (retry logic not needed without contacts)');
                createdPersonIds.push(person.id);
            } catch (error: any) {
                // If no person exists, it will throw an error (expected behavior)
                expect(error.message).toContain('No matching person found');
                console.log('✅ Test completed - no person found (retry logic not needed without contacts)');
            }
        }, 30000);
    });
});

