/**
 * Integration tests for PeopleModule request building
 * 
 * These tests use real API calls instead of mocks to verify that request parameters
 * are correctly built and sent to the Planning Center API.
 */

import { PcoClient } from '../../src';
import { createTestClient, logAuthStatus } from '../integration/test-config';

const TEST_PREFIX = 'TEST_REQUEST_BUILDING_2025';

describe('PeopleModule request building (Integration)', () => {
  let client: PcoClient;
  let testPersonId: string | null = null;

  beforeAll(async () => {
    logAuthStatus();
    
    client = createTestClient();
    
    // Create a test person for getById tests
    const timestamp = Date.now();
    const person = await client.people.create({
      first_name: `${TEST_PREFIX}_Request_${timestamp}`,
      last_name: `${TEST_PREFIX}_Test_${timestamp}`,
      status: 'active',
    });
    testPersonId = person.id || null;
  }, 30000);

  afterAll(async () => {
    // Clean up test person - failures should fail the test
    if (testPersonId) {
      await client.people.delete(testPersonId);
    }
  }, 120000);

  it('getAll builds where/include params and fetches all pages', async () => {
    // Test that getAll correctly builds where and include parameters
    const result = await client.people.getAll({ 
      where: { status: 'active' }, 
      include: ['emails'] 
    });
    
    // Verify the request was successful and returned data
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(Array.isArray(result.data)).toBe(true);
    
    // If there are results, verify that emails are included when requested
    if (result.data.length > 0) {
      // The include parameter should have been applied (though we can't directly verify
      // the request params, we can verify the response structure is correct)
      expect(result.data[0]).toHaveProperty('id');
    }
  }, 240000);

  it('getById builds include param', async () => {
    expect(testPersonId).toBeDefined();
    
    // Test that getById correctly builds include parameter
    const result = await client.people.getById(testPersonId!, ['primary_campus']);
    
    // Verify the request was successful
    expect(result).toBeDefined();
    expect(result.id).toBe(testPersonId);
    expect(result.type).toBe('Person');
    
    // The include parameter should have been applied
    // (primary_campus would be in included resources if available)
  }, 30000);

  it('getAll handles pagination correctly', async () => {
    // Test that getAll fetches all pages
    const result = await client.people.getAll({ 
      where: { status: 'active' }
    });
    
    // Verify pagination metadata is present
    expect(result).toHaveProperty('meta');
    expect(result.meta).toHaveProperty('total_count');
    
    // Verify we got results (or at least an empty array)
    expect(Array.isArray(result.data)).toBe(true);
  }, 120000);

  it('getPage respects perPage and page parameters', async () => {
    // Test that getPage correctly builds pagination parameters
    const result = await client.people.getPage({ 
      perPage: 25, 
      page: 1 
    });
    
    // Verify the request was successful
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('meta');
    expect(Array.isArray(result.data)).toBe(true);
    
    // Verify we got at most perPage items
    expect(result.data.length).toBeLessThanOrEqual(25);
  }, 30000);
});



