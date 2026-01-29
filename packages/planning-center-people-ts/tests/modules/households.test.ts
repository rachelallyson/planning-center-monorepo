import { PcoClient } from '../../src';
import { createTestClient } from '../integration/test-config';

describe('HouseholdsModule - Real Integration Tests', () => {
  let client: PcoClient;
  let testHouseholdId: string | null = null;
  let testPersonId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    if (testHouseholdId) {
      await client.households.delete(testHouseholdId);
    }
    if (testPersonId) {
      await client.people.delete(testPersonId);
    }
  }, 120000);

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(client).toBeDefined();
      expect(client.households).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should fetch all households with default parameters', async () => {
      const result = await client.households.getAll();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.meta?.total_count).toBeGreaterThan(0);
    }, 30000);

    it('should fetch households with filtering options', async () => {
      const result = await client.households.getPage({
        include: ['people'],
        perPage: 10,
        page: 1,
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getPage', () => {
    it('should fetch a single page of households', async () => {
      const result = await client.households.getPage({ perPage: 25, page: 1 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(25);
    }, 30000);

    it('should fetch a page with filtering options', async () => {
      const result = await client.households.getPage({
        include: ['people'],
        perPage: 10,
        page: 1,
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getById', () => {
    it('should fetch household by ID without include', async () => {
      // First get a household ID
      const householdsResponse = await client.households.getPage({ perPage: 1 });
      expect(householdsResponse.data.length).toBeGreaterThan(0);
      const householdId = householdsResponse.data[0].id;

      const result = await client.households.getById(householdId);

      expect(result).toBeDefined();
      expect(result.id).toBe(householdId);
      expect(result.type).toBe('Household');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      expect(result).toHaveProperty('name');
    }, 30000);

    it('should fetch household by ID with include', async () => {
      // First get a household ID
      const householdsResponse = await client.households.getPage({ perPage: 1 });
      expect(householdsResponse.data.length).toBeGreaterThan(0);
      const householdId = householdsResponse.data[0].id;

      const result = await client.households.getById(householdId, ['people']);

      expect(result).toBeDefined();
      expect(result.id).toBe(householdId);
      expect(result.type).toBe('Household');
    }, 30000);
  });

  describe('create', () => {
    it('should create a new household', async () => {
      // Create a person first (households typically need at least one person)
      const timestamp = Date.now();
      const person = await client.people.create({
        firstName: `Test_Household_${timestamp}`,
        lastName: `Person_${timestamp}`,
        status: 'active' as const,
      });
      // create() returns ResourceObject which should have id property
      if (!person || !person.id) {
        throw new Error('Failed to create test person: API returned invalid response');
      }
      testPersonId = person.id;

      const householdData = {
        name: `Test Household ${timestamp}`,
        relationships: {
          people: {
            data: [{ type: 'Person', id: person.id }]
          }
        }
      } as any;
      
      const result = await client.households.create(householdData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('Household');
      expect(result.name).toBe(householdData.name);

      testHouseholdId = result.id || null;
    }, 30000);
  });

  describe('update', () => {
    it('should update an existing household', async () => {
      expect(testHouseholdId).toBeDefined();

      const updateData = { name: 'Updated Household Name' };
      const result = await client.households.update(testHouseholdId!, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testHouseholdId);
      expect(result.name).toBe('Updated Household Name');
    }, 30000);
  });

  describe('delete', () => {
    it('should delete a household', async () => {
      // Create a person and household to delete
      const timestamp = Date.now();
      const person = await client.people.create({
        firstName: `Test_Delete_${timestamp}`,
        lastName: `Person_${timestamp}`,
        status: 'active' as const,
      });
      // create() returns ResourceObject which should have id property
      if (!person || !person.id) {
        throw new Error('Failed to create test person: API returned invalid response');
      }
      
      const householdData = {
        name: `Test Delete ${timestamp}`,
        relationships: {
          people: {
            data: [{ type: 'Person', id: person.id }]
          }
        }
      } as any;
      const created = await client.households.create(householdData);
      const householdIdToDelete = created.id || '';

      // Delete the household
      await expect(client.households.delete(householdIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.households.getById(householdIdToDelete)).rejects.toThrow();
      
      // Cleanup person
      await client.people.delete(person.id);
    }, 30000);
  });
});
