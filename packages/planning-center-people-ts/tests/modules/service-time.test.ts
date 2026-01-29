import { PcoClient } from '../../src';
import { createTestClient } from '../integration/test-config';

describe('ServiceTimeModule - Real Integration Tests', () => {
  let client: PcoClient;
  let testCampusId: string | null = null;
  let testServiceTimeId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();

    const campusesResponse = await client.campus.getPage({ perPage: 1 });
    expect(campusesResponse.data.length).toBeGreaterThan(0);
    testCampusId = campusesResponse.data[0].id;

    const serviceTimeData = {
      description: `Test service time ${Date.now()}`,
      start_time: 540,
      day: 0,
    };
    const created = await client.serviceTime.create(testCampusId!, serviceTimeData);
    testServiceTimeId = created.id ?? null;
    expect(testServiceTimeId).toBeTruthy();
  }, 30000);

  afterAll(async () => {
    if (testServiceTimeId && testCampusId) {
      await client.serviceTime.delete(testCampusId!, testServiceTimeId!);
    }
  }, 120000);

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(client).toBeDefined();
      expect(client.serviceTime).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should fetch all service times for a campus with default parameters', async () => {
      expect(testCampusId).toBeDefined();

      const result = await client.serviceTime.getAll(testCampusId!);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);

    it('should fetch service times for a campus with filtering options', async () => {
      expect(testCampusId).toBeDefined();

      const result = await client.serviceTime.getAll(testCampusId!, {
        include: ['campus'],
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getPage', () => {
    it('should fetch a single page of service times', async () => {
      expect(testCampusId).toBeDefined();

      const result = await client.serviceTime.getPage(testCampusId!, { perPage: 25, page: 1 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(25);
    }, 30000);
  });

  describe('getById', () => {
    it('should fetch service time by ID without include', async () => {
      expect(testCampusId).toBeDefined();
      expect(testServiceTimeId).toBeDefined();

      const result = await client.serviceTime.getById(testCampusId!, testServiceTimeId!);

      expect(result).toBeDefined();
      expect(result.id).toBe(testServiceTimeId);
      expect(result.type).toBe('ServiceTime');
      expect(result).toHaveProperty('description');
    }, 30000);

    it('should fetch service time by ID with include', async () => {
      expect(testCampusId).toBeDefined();
      expect(testServiceTimeId).toBeDefined();

      const result = await client.serviceTime.getById(testCampusId!, testServiceTimeId!, ['campus']);

      expect(result).toBeDefined();
      expect(result.id).toBe(testServiceTimeId);
      expect(result.type).toBe('ServiceTime');
    }, 30000);
  });

  describe('create', () => {
    it('should create a new service time for a campus', async () => {
      expect(testCampusId).toBeDefined();

      const timestamp = Date.now();
      const serviceTimeData = {
        start_time: 540, // 9:00 AM as minutes from midnight
        day: 0, // Sunday
        description: `Test Service Time ${timestamp}`,
      };
      const result = await client.serviceTime.create(testCampusId!, serviceTimeData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('ServiceTime');
      expect(result.description).toBe(serviceTimeData.description);
    }, 30000);
  });

  describe('update', () => {
    it('should update an existing service time for a campus', async () => {
      expect(testCampusId).toBeDefined();

      // Create a test service time first
      const timestamp = Date.now();
      const serviceTimeData = {
        start_time: 540,
        day: 0,
        description: `Test Update ${timestamp}`,
      };
      const created = await client.serviceTime.create(testCampusId!, serviceTimeData);
      const serviceTimeId = created.id!;

      const updateData = { description: 'Updated Service Time Name', start_time: 630 };
      const result = await client.serviceTime.update(testCampusId!, serviceTimeId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(serviceTimeId);
      expect(result.description).toBe('Updated Service Time Name');
    }, 30000);
  });

  describe('delete', () => {
    it('should delete a service time for a campus', async () => {
      expect(testCampusId).toBeDefined();

      // Create a service time to delete
      const timestamp = Date.now();
      const serviceTimeData = {
        start_time: 540,
        day: 0,
        description: `Test Delete ${timestamp}`,
      };
      const created = await client.serviceTime.create(testCampusId!, serviceTimeData);
      const serviceTimeIdToDelete = created.id || '';

      // Delete the service time
      await expect(client.serviceTime.delete(testCampusId!, serviceTimeIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.serviceTime.getById(testCampusId!, serviceTimeIdToDelete)).rejects.toThrow();
    }, 30000);
  });
});
