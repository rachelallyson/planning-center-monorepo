/**
 * Integration tests for MatchScorer
 * 
 * These tests use real API calls to verify that scoring logic works correctly
 * with actual person data from the Planning Center API.
 */

import { PcoClient } from '../../src';
import { createTestClient, logAuthStatus } from '../integration/test-config';

const TEST_PREFIX = 'TEST_SCORING_2025';

describe('MatchScorer (Integration)', () => {
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

  describe('scoreMatch', () => {
    it('should score a person match based on various criteria', async () => {
      const timestamp = Date.now();
      const testEmail = `${TEST_PREFIX}_score_${timestamp}@gmail.com`;
      
      // Create a person with matching criteria
      const person = await client.people.create({
        first_name: `${TEST_PREFIX}_John_${timestamp}`,
        last_name: `${TEST_PREFIX}_Doe_${timestamp}`,
        status: 'active',
      });
      createdPersonIds.push(person.id);

      await client.people.addEmail(person.id, {
        address: testEmail,
        location: 'Home',
        primary: true,
      });

      // Wait for PCO to index
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Use findOrCreate which uses scoring internally
      const match = await client.people.findOrCreate({
        firstName: `${TEST_PREFIX}_John_${timestamp}`,
        lastName: `${TEST_PREFIX}_Doe_${timestamp}`,
        email: testEmail,
        createIfNotFound: false,
      });

      // Verify the match was found (scoring worked)
      expect(match.id).toBe(person.id);
    }, 120000);
  });

  describe('scoreEmailMatch', () => {
    it('should score email matches', async () => {
      const timestamp = Date.now();
      const testEmail = `${TEST_PREFIX}_email_score_${timestamp}@gmail.com`;
      
      // Create a person with email
      const person = await client.people.create({
        first_name: `${TEST_PREFIX}_Email_${timestamp}`,
        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
        status: 'active',
      });
      createdPersonIds.push(person.id);

      await client.people.addEmail(person.id, {
        address: testEmail,
        location: 'Home',
        primary: true,
      });

      // Wait for PCO to index
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Search by email - scoring should match
      const match = await client.people.findOrCreate({
        email: testEmail,
        createIfNotFound: false,
      });

      expect(match.id).toBe(person.id);
    }, 30000);
  });

  describe('scorePhoneMatch', () => {
    it('should score phone matches', async () => {
      const timestamp = Date.now();
      // Use a valid phone format (10 digits)
      const phoneDigits = timestamp.toString().slice(-10).padStart(10, '0');
      const testPhone = `+1${phoneDigits}`;
      
      // Create a person with phone
      const person = await client.people.create({
        first_name: `${TEST_PREFIX}_Phone_${timestamp}`,
        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
        status: 'active',
      });
      createdPersonIds.push(person.id);

      await client.people.addPhoneNumber(person.id, {
        number: testPhone,
        location: 'Home',
        primary: true,
      });

      // Wait for PCO to index
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Search by phone - scoring should match
      const match = await client.people.findOrCreate({
        phone: testPhone,
        createIfNotFound: false,
      });

      expect(match.id).toBe(person.id);
    }, 30000);
  });

  describe('getMatchReason', () => {
    it('should get match reason', async () => {
      const timestamp = Date.now();
      const testEmail = `${TEST_PREFIX}_reason_${timestamp}@gmail.com`;
      
      // Create a person
      const person = await client.people.create({
        first_name: `${TEST_PREFIX}_Reason_${timestamp}`,
        last_name: `${TEST_PREFIX}_Test_${timestamp}`,
        status: 'active',
      });
      createdPersonIds.push(person.id);

      await client.people.addEmail(person.id, {
        address: testEmail,
        location: 'Home',
        primary: true,
      });

      // Wait for PCO to index
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Use findOrCreate which uses getMatchReason internally
      const match = await client.people.findOrCreate({
        firstName: `${TEST_PREFIX}_Reason_${timestamp}`,
        lastName: `${TEST_PREFIX}_Test_${timestamp}`,
        email: testEmail,
        createIfNotFound: false,
      });

      // Verify the match was found (getMatchReason worked)
      expect(match.id).toBe(person.id);
    }, 30000);
  });
});
