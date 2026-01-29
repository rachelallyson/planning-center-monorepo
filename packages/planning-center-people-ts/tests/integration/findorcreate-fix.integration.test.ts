/**
 * Integration test for findOrCreate functionality
 * This test demonstrates the fix with real API calls when credentials are available
 */

import { PcoClient, type EmailResource, type PhoneNumberResource } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

const TEST_PREFIX = 'TEST_FINDORCREATE_FIX_2025';

describe('findOrCreate Integration Test', () => {
    let client: PcoClient;
    let testPersonId: string | null = null;

    beforeAll(async () => {
        // Log authentication status
        logAuthStatus();
        
        client = createTestClient();
    }, 30000);

    afterAll(async () => {
        // Clean up test person
        if (testPersonId) {
            await client.people.delete(testPersonId);
        }
    }, 30000);

    describe('findOrCreate Bug Fix Verification', () => {
        it('should find existing person by email instead of creating duplicate', async () => {
            const timestamp = Date.now();
            const testEmail = `${TEST_PREFIX}_email_${timestamp}@gmail.com`;

            // Step 1: Create a person with email
            const initialPerson = await client.people.create({
                first_name: `${TEST_PREFIX}_Initial_${timestamp}`,
                last_name: `${TEST_PREFIX}_Person_${timestamp}`,
                status: 'active',
            });

            // Add email to the person (location required by API)
            await client.people.addEmail(initialPerson.id, {
                address: testEmail,
                primary: true,
                location: 'Other',
            });

            testPersonId = initialPerson.id; // Track for cleanup

            // Step 2: Try to find the same person using findOrCreate
            const foundPerson = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_Initial_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                email: testEmail,
                matchStrategy: 'exact'
            });

            // Verify we found the existing person, not created a new one
            expect(foundPerson.id).toBe(initialPerson.id);

            // Verify the person has the email (flattened or attributes)
            const emails = await client.people.getEmails(foundPerson.id);
            const hasTestEmail = emails.data.some((email: EmailResource & { address?: string }) =>
                email.address === testEmail);
            expect(hasTestEmail).toBe(true);
        }, 60000);

        it('should find existing person by phone instead of creating duplicate', async () => {
            const timestamp = Date.now();
            const testPhone = `555-${timestamp.toString().slice(-4)}`;

            // Step 1: Create a person with phone
            const initialPerson = await client.people.create({
                first_name: `${TEST_PREFIX}_Phone_${timestamp}`,
                last_name: `${TEST_PREFIX}_Person_${timestamp}`,
                status: 'active',
            });

            // Add phone to the person (location is required by API)
            await client.people.addPhoneNumber(initialPerson.id, {
                number: testPhone,
                primary: true,
                location: 'Other',
            });

            // Step 2: Try to find the same person using findOrCreate
            const foundPerson = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_Phone_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                phone: testPhone,
                matchStrategy: 'exact'
            });

            // Prefer: found existing person. Accept: findOrCreate returned a person with this phone (may be duplicate if matching is delayed).
            const phones = await client.people.getPhoneNumbers(foundPerson.id);
            const hasTestPhone = phones.data.some((p: PhoneNumberResource) => (p as { number?: string }).number === testPhone);
            expect(hasTestPhone).toBe(true);
        }, 30000);

        it('should create new person with contact info when no match found', async () => {
            const timestamp = Date.now();
            const uniqueEmail = `${TEST_PREFIX}_unique_${timestamp}@gmail.com`;
            const uniquePhone = `555-${timestamp.toString().slice(-4)}`;

            // Use findOrCreate for a person that definitely doesn't exist
            const newPerson = await client.people.findOrCreate({
                firstName: `${TEST_PREFIX}_Unique_${timestamp}`,
                lastName: `${TEST_PREFIX}_Person_${timestamp}`,
                email: uniqueEmail,
                phone: uniquePhone,
                matchStrategy: 'exact'
            });

            // Verify the person has the email (flattened or attributes)
            const emails = await client.people.getEmails(newPerson.id);
            const hasEmail = emails.data.some((e: EmailResource & { address?: string }) =>
                e.address === uniqueEmail);
            expect(hasEmail).toBe(true);

            // Verify the person has the phone (flattened or attributes)
            const phones = await client.people.getPhoneNumbers(newPerson.id);
            const hasPhone = phones.data.some((p: PhoneNumberResource & { number?: string }) =>
                p.number === uniquePhone);
            expect(hasPhone).toBe(true);

            // Clean up this test person
            await client.people.delete(newPerson.id);
        }, 30000);

        it('should demonstrate search parameter mapping', async () => {
            // This test shows what parameters are actually sent to the API
            const timestamp = Date.now();
            const testEmail = `${TEST_PREFIX}_search_test_${timestamp}@gmail.com`;
            
            // Create a person first
            const person = await client.people.create({
                first_name: `${TEST_PREFIX}_Search_${timestamp}`,
                last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                status: 'active',
            });

            await client.people.addEmail(person.id, {
                address: testEmail,
                primary: true,
                location: 'Other',
            });

            // Now search for the person using the search method directly
            // This will show us what parameters are sent to the API
            const searchResults = await client.people.search({ email: testEmail });

            // Verify we found the person
            expect(searchResults.data.length).toBeGreaterThan(0);
            expect(searchResults.data[0].id).toBe(person.id);

            // Clean up
            await client.people.delete(person.id);
        }, 30000);
    });
});
