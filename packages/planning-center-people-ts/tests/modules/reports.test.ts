import { PcoClient } from '../../src';
import { createTestClient } from '../integration/test-config';

describe('ReportsModule - Real Integration Tests', () => {
  let client: PcoClient;
  let testReportId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();

    // Create a test report for getById tests
    const timestamp = Date.now();
    const report = await client.reports.create({
      name: `Test Report ${timestamp}`,
      body: 'Test report body content',
    });
    testReportId = report.id || null;
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    if (testReportId) {
      await client.reports.delete(testReportId);
    }
  }, 120000);

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(client).toBeDefined();
      expect(client.reports).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should fetch all reports with default parameters', async () => {
      const result = await client.reports.getAll();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);

    it('should fetch reports with filtering options', async () => {
      const result = await client.reports.getAll({
        include: ['created_by'],
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getPage', () => {
    it('should fetch a single page of reports', async () => {
      const result = await client.reports.getPage({ per_page: 25, page: 1 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(25);
    }, 30000);
  });

  describe('getById', () => {
    it('should fetch report by ID without include', async () => {
      expect(testReportId).toBeDefined();

      const result = await client.reports.getById(testReportId!);

      expect(result).toBeDefined();
      expect(result.id).toBe(testReportId);
      expect(result.type).toBe('Report');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      expect(result).toHaveProperty('name');
    }, 30000);

    it('should fetch report by ID with include', async () => {
      expect(testReportId).toBeDefined();

      const result = await client.reports.getById(testReportId!, { include: ['created_by'] });

      expect(result).toBeDefined();
      expect(result.id).toBe(testReportId);
      expect(result.type).toBe('Report');
    }, 30000);
  });

  describe('create', () => {
    it('should create a new report', async () => {
      const timestamp = Date.now();
      const reportData = {
        name: `Test Report ${timestamp}`,
      };
      const result = await client.reports.create(reportData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('Report');
      // create() returns flattened resource (attributes at top level)
      expect(result.name).toBe(reportData.name);

      testReportId = result.id || null;
    }, 30000);
  });

  describe('update', () => {
    it('should update an existing report', async () => {
      expect(testReportId).toBeDefined();

      const updateData = { name: 'Updated Report Name' };
      const result = await client.reports.update(testReportId!, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testReportId);
      // update() returns flattened resource (attributes at top level)
      expect(result.name).toBe('Updated Report Name');
    }, 30000);
  });

  describe('delete', () => {
    it('should delete a report', async () => {
      // Create a report to delete
      const timestamp = Date.now();
      const reportData = {
        name: `Test Delete ${timestamp}`,
      };
      const created = await client.reports.create(reportData);
      const reportIdToDelete = created.id || '';

      // Delete the report
      await expect(client.reports.delete(reportIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.reports.getById(reportIdToDelete)).rejects.toThrow();
    }, 30000);
  });
});
