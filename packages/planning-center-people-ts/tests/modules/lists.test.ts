import { PcoClient } from '../../src';
import { createTestClient } from '../integration/test-config';

describe('ListsModule - Real Integration Tests', () => {
  let client: PcoClient;
  let testListCategoryId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    if (testListCategoryId) {
      await client.lists.deleteListCategory(testListCategoryId);
    }
  }, 120000);

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(client).toBeDefined();
      expect(client.lists).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should fetch all lists with default parameters', async () => {
      const result = await client.lists.getAll();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);

    it('should fetch lists with filtering options', async () => {
      const result = await client.lists.getAll({
        include: ['category'],
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getPage', () => {
    it('should fetch a single page of lists', async () => {
      const result = await client.lists.getPage({ perPage: 25, page: 1 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(25);
    }, 30000);
  });

  describe('getById', () => {
    it('should fetch list by ID without include', async () => {
      // First get a list ID
      const listsResponse = await client.lists.getPage({ perPage: 1 });
      expect(listsResponse.data.length).toBeGreaterThan(0);
      const listId = listsResponse.data[0].id;

      const result = await client.lists.getById(listId);

      expect(result).toBeDefined();
      expect(result.id).toBe(listId);
      expect(result.type).toBe('List');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      expect(result).toHaveProperty('name');
    }, 30000);

    it('should fetch list by ID with include', async () => {
      // First get a list ID
      const listsResponse = await client.lists.getPage({ perPage: 1 });
      expect(listsResponse.data.length).toBeGreaterThan(0);
      const listId = listsResponse.data[0].id;

      const result = await client.lists.getById(listId, ['list_category']);

      expect(result).toBeDefined();
      expect(result.id).toBe(listId);
      expect(result.type).toBe('List');
    }, 30000);
  });

  describe('getListCategories', () => {
    it('should get all list categories', async () => {
      const result = await client.lists.getListCategories();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getListCategoryById', () => {
    it('should get list category by ID', async () => {
      // First get a list category ID
      const categoriesResponse = await client.lists.getListCategories();
      expect(categoriesResponse.data.length).toBeGreaterThan(0);
      const categoryId = categoriesResponse.data[0].id;

      const result = await client.lists.getListCategoryById(categoryId);

      expect(result).toBeDefined();
      expect(result.id).toBe(categoryId);
      expect(result.type).toBe('ListCategory');
    }, 30000);
  });

  describe('createListCategory', () => {
    it('should create a new list category', async () => {
      const timestamp = Date.now();
      const categoryData = {
        name: `Test Category ${timestamp}`,
      };
      const result = await client.lists.createListCategory(categoryData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('ListCategory');
      expect(result.name).toBe(categoryData.name);

      testListCategoryId = result.id || null;
    }, 30000);
  });

  describe('updateListCategory', () => {
    it('should update an existing list category', async () => {
      // Create a test category first
      const timestamp = Date.now();
      const categoryData = {
        name: `Test Update ${timestamp}`,
      };
      const created = await client.lists.createListCategory(categoryData);
      const categoryId = created.id!;

      // Use a unique name for the update to avoid conflicts
      const updateData = { name: `Updated Category Name ${timestamp}` };
      const result = await client.lists.updateListCategory(categoryId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(categoryId);
      expect(result.name).toBe(`Updated Category Name ${timestamp}`);
      
      // Clean up the updated category
      await client.lists.deleteListCategory(categoryId);
    }, 30000);
  });

  describe('deleteListCategory', () => {
    it('should delete a list category', async () => {
      // Create a category to delete
      const timestamp = Date.now();
      const categoryData = {
        name: `Test Delete ${timestamp}`,
      };
      const created = await client.lists.createListCategory(categoryData);
      const categoryIdToDelete = created.id || '';

      // Delete the category
      await expect(client.lists.deleteListCategory(categoryIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.lists.getListCategoryById(categoryIdToDelete)).rejects.toThrow();
    }, 30000);
  });

  describe('getPeople', () => {
    it('should get people for a list', async () => {
      // First get a list ID
      const listsResponse = await client.lists.getPage({ perPage: 1 });
      expect(listsResponse.data.length).toBeGreaterThan(0);
      const listId = listsResponse.data[0].id;

      const result = await client.lists.getPeople(listId);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getRules', () => {
    it('should return rules for a list', async () => {
      const listsResponse = await client.lists.getPage({ perPage: 1 });
      expect(listsResponse.data.length).toBeGreaterThan(0);
      const listId = listsResponse.data[0].id;

      const result = await client.lists.getRules(listId);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      result.data.forEach((rule) => {
        expect(rule).toHaveProperty('id');
        expect(rule).toHaveProperty('type', 'Rule');
      });
    }, 30000);

    it('should reject for invalid list ID', async () => {
      await expect(client.lists.getRules('invalid-list-id')).rejects.toThrow();
    }, 30000);
  });

  describe('run', () => {
    it('should run a list', async () => {
      // First get a list ID
      const listsResponse = await client.lists.getPage({ perPage: 1 });
      expect(listsResponse.data.length).toBeGreaterThan(0);
      const listId = listsResponse.data[0].id;

      // Method is called refresh, not run
      const result = await client.lists.refresh(listId);
      expect(result).toBeDefined();
      expect(result.id).toBe(listId);
      expect(result.type).toBe('List');
    }, 30000);
  });
});
