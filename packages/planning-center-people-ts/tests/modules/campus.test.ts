import { PcoClient } from '../../src';
import { createTestClient } from '../integration/test-config';

describe('CampusModule - Real Integration Tests', () => {
  let client: PcoClient;
  let testCampusId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    if (testCampusId) {
      await client.campus.delete(testCampusId);
    }
  }, 120000);

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(client).toBeDefined();
      expect(client.campus).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should fetch all campuses with default parameters', async () => {
      const result = await client.campus.getAll();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.meta?.total_count).toBeGreaterThan(0);
    }, 30000);

    it('should fetch campuses with filtering options', async () => {
      const result = await client.campus.getAll({
        include: ['lists'],
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getPage', () => {
    it('should fetch a single page of campuses', async () => {
      const result = await client.campus.getPage({ per_page: 25, page: 1 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(25);
    }, 30000);

    it('should fetch a page with filtering options', async () => {
      const result = await client.campus.getPage({
        include: ['lists'],
        per_page: 10,
        page: 1,
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getById', () => {
    it('should fetch campus by ID without include', async () => {
      // First get a campus ID
      const campusesResponse = await client.campus.getPage({ per_page: 1 });
      expect(campusesResponse.data.length).toBeGreaterThan(0);
      const campusId = campusesResponse.data[0].id;

      const result = await client.campus.getById(campusId);

      expect(result).toBeDefined();
      expect(result.id).toBe(campusId);
      expect(result.type).toBe('Campus');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      // Check for a flattened attribute instead (e.g., name)
      expect(result).toHaveProperty('name');
    }, 30000);

    it('should fetch campus by ID with include', async () => {
      // First get a campus ID
      const campusesResponse = await client.campus.getPage({ per_page: 1 });
      expect(campusesResponse.data.length).toBeGreaterThan(0);
      const campusId = campusesResponse.data[0].id;

      const result = await client.campus.getById(campusId, { include: ['lists'] });

      expect(result).toBeDefined();
      expect(result.id).toBe(campusId);
      expect(result.type).toBe('Campus');
    }, 30000);
  });

  describe('create', () => {
    it('should create a new campus', async () => {
      const timestamp = Date.now();
      const campusData = {
        name: `Test Campus ${timestamp}`,
        description: `Test Campus Description ${timestamp}`,
        street: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'US',
        phone_number: '555-123-4567',
        website: 'https://testcampus.example.com',
        twenty_four_hour_time: false,
        date_format: 1,
        church_center_enabled: true,
      };
      const result = await client.campus.create(campusData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('Campus');
      expect(result.name).toBe(campusData.name);

      testCampusId = result.id || null;
    }, 30000);
  });

  describe('update', () => {
    it('should update an existing campus', async () => {
      expect(testCampusId).toBeDefined();

      const updateData = { name: 'Updated Campus Name', description: 'Updated description' };
      const result = await client.campus.update(testCampusId!, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testCampusId);
      expect(result.name).toBe('Updated Campus Name');
    }, 30000);
  });

  describe('delete', () => {
    it('should delete a campus', async () => {
      // Create a campus to delete
      const timestamp = Date.now();
      const campusData = {
        name: `Test Delete ${timestamp}`,
        description: `Test Campus Description ${timestamp}`,
        street: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'US',
        phone_number: '555-123-4567',
        website: 'https://testcampus.example.com',
        twenty_four_hour_time: false,
        date_format: 1,
        church_center_enabled: true,
      };
      const created = await client.campus.create(campusData);
      const campusIdToDelete = created.id || '';

      // Delete the campus
      await expect(client.campus.delete(campusIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.campus.getById(campusIdToDelete)).rejects.toThrow();
    }, 30000);
  });

  describe('getLists', () => {
    it('should get lists for a campus', async () => {
      // Get a campus first
      const campusesResponse = await client.campus.getPage({ per_page: 1 });
      expect(campusesResponse.data.length).toBeGreaterThan(0);
      const campusId = campusesResponse.data[0].id;

      const result = await client.campus.getLists(campusId);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getServiceTimes', () => {
    it('should get service times for a campus', async () => {
      // Get a campus first
      const campusesResponse = await client.campus.getPage({ per_page: 1 });
      expect(campusesResponse.data.length).toBeGreaterThan(0);
      const campusId = campusesResponse.data[0].id;

      const result = await client.campus.getServiceTimes(campusId);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getAll', () => {
    it('should get all campuses with pagination', async () => {
      // getAll returns PaginationResult with data array
      const result = await client.campus.getAll();

      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('type');
      expect(result.data[0].type).toBe('Campus');
    }, 30000);

    it('should get all campuses with filtering', async () => {
      // getAll returns PaginationResult with data array
      const result = await client.campus.getAll({
        include: ['lists'],
      });

      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });
});
