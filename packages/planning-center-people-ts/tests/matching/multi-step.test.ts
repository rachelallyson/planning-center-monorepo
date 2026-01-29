/**
 * Integration tests for PersonMatcher Multi-Step Search
 * 
 * These tests use real API calls instead of mocks to verify the multi-step
 * search strategy behavior with the Planning Center API.
 */

import { PcoClient } from '../../src';
import { createTestClient, logAuthStatus } from '../integration/test-config';

const TEST_PREFIX = 'TEST_MULTISTEP_2025';

describe('PersonMatcher Multi-Step Search (Integration)', () => {
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

  describe('findMatchMultiStep', () => {
    it('tries fuzzy with age preference first', async () => {
      const timestamp = Date.now();
      const testEmail = `${TEST_PREFIX}_adult_${timestamp}@gmail.com`;
      const adultBirthdate = '1985-05-15'; // Adult
      
      // Create an adult person
      const person = await client.people.create({
        first_name: `${TEST_PREFIX}_John_${timestamp}`,
        last_name: `${TEST_PREFIX}_Doe_${timestamp}`,
        birthdate: adultBirthdate,
        status: 'active',
      });
      createdPersonIds.push(person.id);

      // Add email - test should fail if this fails
      await client.people.addEmail(person.id, {
        address: testEmail,
        location: 'home',
        primary: true,
      });

      // Wait for PCO to index
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Use multi-step search with age preference
      const match = await client.people.findOrCreate({
        firstName: `${TEST_PREFIX}_John_${timestamp}`,
        lastName: `${TEST_PREFIX}_Doe_${timestamp}`,
        email: testEmail,
        agePreference: 'adults',
        searchStrategy: 'multi-step',
        createIfNotFound: false,
      });
      
      expect(match).not.toBeNull();
      expect(match.id).toBe(person.id);
    }, 60000);

    it('falls back to fuzzy without age preference if first strategy fails', async () => {
      const timestamp = Date.now();
      const testEmail = `${TEST_PREFIX}_child_${timestamp}@gmail.com`;
      const childBirthdate = new Date().toISOString().split('T')[0]; // Recent date (child)
      
      // Create a child person
      const child = await client.people.create({
        first_name: `${TEST_PREFIX}_John_${timestamp}`,
        last_name: `${TEST_PREFIX}_DoeJr_${timestamp}`,
        birthdate: childBirthdate,
        status: 'active',
      });
      createdPersonIds.push(child.id);

      await client.people.addEmail(child.id, {
        address: testEmail,
        location: 'home',
        primary: true,
      });

      // Wait for PCO to index
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Use multi-step search looking for adults, but should find the child
      // when it falls back to strategies without age preference
      const match = await client.people.findOrCreate({
        firstName: `${TEST_PREFIX}_John_${timestamp}`,
        lastName: `${TEST_PREFIX}_DoeJr_${timestamp}`,
        email: testEmail,
        agePreference: 'adults', // Looking for adult
        searchStrategy: 'multi-step',
        createIfNotFound: false,
      });
      
      // Should find the child when it tries strategies without age preference
      expect(match).not.toBeNull();
      expect(match.id).toBe(child.id);
    }, 30000);

    it('returns null when no match found in any strategy', async () => {
      const timestamp = Date.now();
      const uniqueEmail = `${TEST_PREFIX}_nonexistent_${timestamp}@gmail.com`;
      
      // Try to find a person that doesn't exist
      await expect(
        client.people.findOrCreate({
          firstName: `${TEST_PREFIX}_NonExistent_${timestamp}`,
          lastName: `${TEST_PREFIX}_Person_${timestamp}`,
          email: uniqueEmail,
          searchStrategy: 'multi-step',
          createIfNotFound: false,
          retryConfig: {
            enabled: false, // Disable retries to speed up test
          },
        })
      ).rejects.toThrow('No matching person found');
    }, 60000); // Increased timeout since retries can take time even when disabled
  });

  describe('findOrCreate with searchStrategy', () => {
    it('uses single strategy by default', async () => {
      const timestamp = Date.now();
      const uniqueEmail = `${TEST_PREFIX}_single_${timestamp}@gmail.com`;
      
      // Create a person using default (single) strategy
      // If email domain is disallowed, the person will still be created but without email
      const person = await client.people.findOrCreate({
        firstName: `${TEST_PREFIX}_John_${timestamp}`,
        lastName: `${TEST_PREFIX}_Doe_${timestamp}`,
        email: uniqueEmail,
        // searchStrategy defaults to 'single'
      });
      
      expect(person).toBeDefined();
      expect(person.id).toBeTruthy();
      createdPersonIds.push(person.id);
    }, 30000);

    it('uses multi-step strategy when specified', async () => {
      const timestamp = Date.now();
      const uniqueEmail = `${TEST_PREFIX}_multistep_${timestamp}@gmail.com`;
      
      // Create a person using multi-step strategy
      // If email domain is disallowed, the person will still be created but without email
      const person = await client.people.findOrCreate({
        firstName: `${TEST_PREFIX}_John_${timestamp}`,
        lastName: `${TEST_PREFIX}_Doe_${timestamp}`,
        email: uniqueEmail,
        searchStrategy: 'multi-step',
      });
      
      expect(person).toBeDefined();
      expect(person.id).toBeTruthy();
      createdPersonIds.push(person.id);
    }, 30000);
  });
});
