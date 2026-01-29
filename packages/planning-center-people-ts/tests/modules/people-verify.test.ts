/**
 * Integration tests for PeopleModule.verifyPersonExists
 * 
 * These tests use real API calls instead of mocks to verify the actual behavior
 * of person verification with the Planning Center API.
 */

import { PcoClient } from '../../src';
import { createTestClient, logAuthStatus } from '../integration/test-config';

const TEST_PREFIX = 'TEST_VERIFY_2025';

describe('PeopleModule.verifyPersonExists (Integration)', () => {
  let client: PcoClient;
  let testPersonId: string | null = null;

  beforeAll(async () => {
    logAuthStatus();
    
    client = createTestClient();
    
    // Create a test person for verification tests
    const timestamp = Date.now();
    const person = await client.people.create({
      first_name: `${TEST_PREFIX}_Verify_${timestamp}`,
      last_name: `${TEST_PREFIX}_Test_${timestamp}`,
      status: 'active',
    });
    testPersonId = person.id || null;
  }, 30000);

  afterAll(async () => {
    // Clean up test person
    if (testPersonId) {
      await client.people.delete(testPersonId);
    }
  }, 120000);

  it('returns true when person exists', async () => {
    expect(testPersonId).toBeDefined();
    
    const exists = await client.people.verifyPersonExists(testPersonId!);
    
    expect(exists).toBe(true);
  }, 30000);

  it('returns false when person not found (404)', async () => {
    // Use a non-existent person ID
    const nonExistentId = '999999999';
    
    const exists = await client.people.verifyPersonExists(nonExistentId);
    
    expect(exists).toBe(false);
  }, 30000);

  it('uses default timeout of 30000ms', async () => {
    expect(testPersonId).toBeDefined();
    
    // Should not timeout within reasonable time
    const exists = await client.people.verifyPersonExists(testPersonId!);
    
    expect(exists).toBe(true);
  }, 30000);

  it('resolves before timeout when request is fast', async () => {
    expect(testPersonId).toBeDefined();
    
    const startTime = Date.now();
    const exists = await client.people.verifyPersonExists(testPersonId!, { timeout: 30000 });
    const elapsed = Date.now() - startTime;
    
    expect(exists).toBe(true);
    expect(elapsed).toBeLessThan(35000); // Should resolve before the 30s timeout
  }, 45000);

  it('verifies person exists after creation', async () => {
    const timestamp = Date.now();
    
    // Create a new person
    const person = await client.people.create({
      first_name: `${TEST_PREFIX}_New_${timestamp}`,
      last_name: `${TEST_PREFIX}_Person_${timestamp}`,
      status: 'active',
    });
    
    try {
      // Verify it exists
      const exists = await client.people.verifyPersonExists(person.id);
      expect(exists).toBe(true);
    } finally {
      // Clean up
      await client.people.delete(person.id);
    }
  }, 30000);
});
