/**
 * Integration Test for Retry Exhaustion Bug
 * 
 * This test reproduces the bug where:
 * 1. Person is created with email/phone
 * 2. Retry logic tries to find the person but exhausts all retries
 * 3. Error is caught and a NEW person is created (DUPLICATE BUG)
 * 
 * The issue: When retry logic fails (contacts not verified yet), the catch block
 * in getPCOPerson creates a duplicate person instead of waiting longer or
 * checking if the person was created in the meantime.
 */

import { PcoClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

const TEST_PREFIX = 'TEST_RETRY_EXHAUSTION_2025';

describe('Retry Exhaustion - Duplicate Creation Bug', () => {
    let client: PcoClient;
    const createdPersonIds: string[] = [];

    beforeAll(async () => {
        logAuthStatus();
        
        try {
            client = createTestClient();
            console.log('✅ Test client created successfully');
        } catch (error) {
            console.log('❌ No credentials available for integration test');
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

    describe('Retry Exhaustion Bug Reproduction', () => {
        it('should NOT create duplicate when retry logic exhausts but person exists', async () => {
            // This test simulates the production bug scenario
            const timestamp = Date.now();
            const testEmail = `retry.exhaustion.${timestamp}@onark.app`;
            const testPhone = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
            const testFirstName = 'RetryExhaustion';
            const testLastName = `Test${timestamp}`;

            console.log('\n🧪 Test: Retry exhaustion should not create duplicate');
            console.log('📧 Test email:', testEmail);
            console.log('📞 Test phone:', testPhone);

            let firstPersonId: string;

            try {
                // Step 1: Create the person (first time)
                console.log('\nStep 1: Creating initial person...');
                const firstPerson = await client.people.findOrCreate({
                    firstName: testFirstName,
                    lastName: testLastName,
                    email: testEmail,
                    phone: testPhone,
                    createIfNotFound: true,
                    matchStrategy: 'exact',
                });

                firstPersonId = firstPerson.id;
                createdPersonIds.push(firstPersonId);
                console.log(`✅ Initial person created: ${firstPersonId}`);

                // Step 2: Immediately try to find with SHORT retry config (simulating exhaustion)
                // This simulates the bug: retry logic exhausts before contacts are verified
                console.log('\nStep 2: Searching with SHORT retry config (will exhaust quickly)...');
                console.log('⚠️  This simulates retry logic exhausting before contacts are verified');
                
                let secondPersonId: string;
                let retryExhausted = false;

                try {
                    // Use very short retry config to force exhaustion
                    const foundPerson = await client.people.findOrCreate({
                        firstName: testFirstName,
                        lastName: testLastName,
                        email: testEmail,
                        phone: testPhone,
                        createIfNotFound: false, // Don't create, just search
                        matchStrategy: 'exact',
                        retryConfig: {
                            maxRetries: 2,        // Very few retries
                            maxWaitTime: 5000,    // Very short wait (5 seconds)
                            initialDelay: 1000,   // Short initial delay
                            enabled: true,
                        },
                    });

                    secondPersonId = foundPerson.id;
                    console.log(`✅ Found person: ${secondPersonId}`);

                } catch (error: any) {
                    retryExhausted = true;
                    const errorMessage = error.message || String(error);
                    console.log(`\n❌ Retry logic exhausted (expected): ${errorMessage}`);
                    
                    // THIS IS THE BUG: In production code, this catch block would create a new person
                    // But it SHOULD NOT create a duplicate if the person exists but contacts aren't verified yet
                    
                    // Simulate what the production code does (BUGGY BEHAVIOR):
                    console.log('\n⚠️  BUG SIMULATION: Catching error and creating new person...');
                    console.log('💡 This is the bug - should NOT create duplicate if person exists!');
                    
                    // Wait a bit more to see if contacts get verified
                    console.log('⏳ Waiting additional 10 seconds to see if contacts get verified...');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    
                    // Try one more time with longer retry
                    try {
                        const foundPerson = await client.people.findOrCreate({
                            firstName: testFirstName,
                            lastName: testLastName,
                            email: testEmail,
                            phone: testPhone,
                            createIfNotFound: false,
                            matchStrategy: 'exact',
                            retryConfig: {
                                maxRetries: 5,
                                maxWaitTime: 30000,
                                initialDelay: 5000,
                            },
                        });
                        
                        secondPersonId = foundPerson.id;
                        console.log(`✅ Found person after longer wait: ${secondPersonId}`);
                        
                        // Verify it's the SAME person (not a duplicate)
                        if (secondPersonId !== firstPersonId) {
                            throw new Error(
                                `BUG DETECTED: Different person ID returned!\n` +
                                `Expected: ${firstPersonId}, Got: ${secondPersonId}\n` +
                                `This indicates a duplicate was created or wrong person was matched.`
                            );
                        }
                        
                        console.log('✅ SUCCESS: Same person found after longer wait (no duplicate created)');
                        
                    } catch (secondError: any) {
                        // If still not found, this might indicate:
                        // 1. Contacts take longer than 40 seconds to verify
                        // 2. There's a bug in the matching logic
                        // 3. The person truly doesn't exist (shouldn't happen)
                        
                        console.error(`\n❌ Still not found after longer wait: ${secondError.message}`);
                        console.error('💡 This might indicate:');
                        console.error('   1. PCO takes longer than 40 seconds to verify contacts');
                        console.error('   2. There\'s a bug in the matching logic');
                        console.error('   3. The person was never created (unlikely)');
                        
                        // Don't create a duplicate - this is the correct behavior
                        // The production code should NOT create a duplicate here
                        throw new Error(
                            `Person not found after extended retry. ` +
                            `This is expected if contacts aren't verified yet. ` +
                            `DO NOT create a duplicate person. ` +
                            `Error: ${secondError.message}`
                        );
                    }
                }

                // Verify we have the same person (no duplicate)
                if (retryExhausted && secondPersonId) {
                    expect(secondPersonId).toBe(firstPersonId);
                    console.log('\n✅ TEST PASSED: No duplicate created despite retry exhaustion');
                } else if (!retryExhausted) {
                    expect(secondPersonId).toBe(firstPersonId);
                    console.log('\n✅ TEST PASSED: Person found before retry exhaustion');
                }

            } catch (error) {
                console.error('\n❌ Test failed:', error);
                throw error;
            }
        }, 60000); // 1 minute timeout

        it('should demonstrate the bug: creating duplicate when retry exhausts', async () => {
            // This test demonstrates what happens with the BUGGY production code
            const timestamp = Date.now();
            const testEmail = `bug.demo.${timestamp}@onark.app`;
            const testPhone = `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
            const testFirstName = 'BugDemo';
            const testLastName = `Test${timestamp}`;

            console.log('\n🧪 Test: Demonstrating the bug scenario');
            console.log('📧 Test email:', testEmail);
            console.log('📞 Test phone:', testPhone);
            console.log('⚠️  This test shows what happens with buggy error handling');

            let firstPersonId: string;

            try {
                // Create person
                const firstPerson = await client.people.findOrCreate({
                    firstName: testFirstName,
                    lastName: testLastName,
                    email: testEmail,
                    phone: testPhone,
                    createIfNotFound: true,
                    matchStrategy: 'exact',
                });

                firstPersonId = firstPerson.id;
                createdPersonIds.push(firstPersonId);
                console.log(`✅ First person created: ${firstPersonId}`);

                // Simulate the buggy production code behavior
                console.log('\n⚠️  BUGGY BEHAVIOR SIMULATION:');
                console.log('   1. Try to find with short retry (will exhaust)');
                console.log('   2. Catch error and create new person (BUG!)');
                
                let duplicateCreated = false;
                let secondPersonId: string | null = null;

                try {
                    // Try with very short retry (will exhaust)
                    await client.people.findOrCreate({
                        firstName: testFirstName,
                        lastName: testLastName,
                        email: testEmail,
                        phone: testPhone,
                        createIfNotFound: false,
                        matchStrategy: 'exact',
                        retryConfig: {
                            maxRetries: 1,        // Very few retries
                            maxWaitTime: 2000,    // Very short wait (2 seconds)
                            initialDelay: 1000,
                        },
                    });
                } catch (error: any) {
                    console.log(`\n❌ Retry exhausted: ${error.message}`);
                    console.log('💡 BUGGY CODE WOULD CREATE DUPLICATE HERE');
                    
                    // THIS IS THE BUG: Creating a new person when retry exhausts
                    // This should NOT happen if the person exists but contacts aren't verified
                    try {
                        const newPerson = await client.people.findOrCreate({
                            firstName: testFirstName,
                            lastName: testLastName,
                            email: testEmail,
                            phone: testPhone,
                            createIfNotFound: true, // BUG: Creates duplicate!
                            matchStrategy: 'exact',
                        });
                        
                        secondPersonId = newPerson.id;
                        duplicateCreated = (secondPersonId !== firstPersonId);
                        
                        if (duplicateCreated) {
                            console.error(`\n❌ BUG CONFIRMED: Duplicate created!`);
                            console.error(`   First person: ${firstPersonId}`);
                            console.error(`   Duplicate: ${secondPersonId}`);
                            createdPersonIds.push(secondPersonId);
                        } else {
                            console.log(`\n✅ No duplicate: Same person ID returned`);
                        }
                    } catch (createError: any) {
                        console.error(`\n❌ Error creating person: ${createError.message}`);
                    }
                }

                // Report findings
                if (duplicateCreated && secondPersonId) {
                    console.error('\n🚨 BUG DETECTED: Duplicate person created!');
                    console.error('💡 The production code should NOT create a duplicate when retry exhausts.');
                    console.error('💡 Instead, it should:');
                    console.error('   1. Wait longer for contacts to verify');
                    console.error('   2. Check if person exists before creating');
                    console.error('   3. Throw a specific error indicating retry exhaustion');
                    
                    // This test documents the bug - it doesn't fail
                    // The actual fix should prevent this scenario
                } else {
                    console.log('\n✅ No duplicate created (correct behavior)');
                }

            } catch (error) {
                console.error('\n❌ Test error:', error);
                throw error;
            }
        }, 60000);
    });
});

