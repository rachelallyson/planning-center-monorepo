import { PcoClient } from '../../src';
import { createTestClient } from '../integration/test-config';

describe('NotesModule - Real Integration Tests', () => {
  let client: PcoClient;
  let testPersonId: string | null = null;
  let testNoteId: string | null = null;
  let testNoteCategoryId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();

    // Create a test person for note operations
    const timestamp = Date.now();
    const person = await client.people.create({
      first_name: `Test_Notes_${timestamp}`,
      last_name: `Person_${timestamp}`,
      status: 'active',
    });
    // create() returns ResourceObject which should have id property
    if (!person || !person.id) {
      throw new Error('Failed to create test person: API returned invalid response');
    }
    testPersonId = person.id;

    // Create a test note for getById tests
    expect(testPersonId).toBeDefined();

    // Get or create a note category first
    const categoriesResponse = await client.notes.getNoteCategories();
    expect(categoriesResponse.data.length).toBeGreaterThan(0);
    const noteCategoryId = categoriesResponse.data[0].id;

    // Create a test note
    const note = await client.notes.create(testPersonId!, {
      note: `Test Note ${timestamp}`,
      note_category_id: noteCategoryId,
    });
    testNoteId = note.id || null;
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    expect(testNoteId).toBeDefined();
    await client.notes.delete(testNoteId!);
    if (testNoteCategoryId) {
      await client.notes.deleteNoteCategory(testNoteCategoryId);
    }
    expect(testPersonId).toBeDefined();
    await client.people.delete(testPersonId!);
  }, 120000);

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(client).toBeDefined();
      expect(client.notes).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should fetch all notes with default parameters', async () => {
      const result = await client.notes.getAll();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 60000);

    it('should fetch notes with filtering options', async () => {
      const result = await client.notes.getAll({
        include: ['category'],
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getPage', () => {
    it('should fetch a single page of notes', async () => {
      const result = await client.notes.getPage({ per_page: 25, page: 1 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(25);
    }, 30000);
  });

  describe('getById', () => {
    it('should fetch note by ID without include', async () => {
      // First get a note ID
      const notesResponse = await client.notes.getPage({ per_page: 1 });
      expect(notesResponse.data.length).toBeGreaterThan(0);
      const noteId = notesResponse.data[0].id;

      const result = await client.notes.getById(noteId);

      expect(result).toBeDefined();
      expect(result.id).toBe(noteId);
      expect(result.type).toBe('Note');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      // Note has 'note' property, not 'content'
      expect(result).toHaveProperty('note');
    }, 30000);

    it('should fetch note by ID with include', async () => {
      // First get a note ID
      const notesResponse = await client.notes.getPage({ per_page: 1 });
      expect(notesResponse.data.length).toBeGreaterThan(0);
      const noteId = notesResponse.data[0].id;

      const result = await client.notes.getById(noteId, { include: ['category'] });

      expect(result).toBeDefined();
      expect(result.id).toBe(noteId);
      expect(result.type).toBe('Note');
    }, 30000);
  });

  describe('getNotesForPerson', () => {
    it('should get notes for a person', async () => {
      expect(testPersonId).toBeDefined();

      const result = await client.notes.getNotesForPerson(testPersonId!);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);

    it('should get notes for a person with options', async () => {
      expect(testPersonId).toBeDefined();

      const result = await client.notes.getNotesForPerson(testPersonId!, {
        include: ['category'],
        per_page: 10,
        page: 1,
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('create', () => {
    it('should create a new note', async () => {
      expect(testPersonId).toBeDefined();

      // First get or create a note category (required)
      const categoriesResponse = await client.notes.getNoteCategories();
      expect(categoriesResponse.data.length).toBeGreaterThan(0);
      const noteCategoryId = categoriesResponse.data[0].id || '';

      const timestamp = Date.now();
      const noteData = {
        note: `Test Note ${timestamp}`,
        note_category_id: noteCategoryId,
      };
      const result = await client.notes.create(testPersonId!, noteData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('Note');
      expect(result.note).toBe(noteData.note);

      testNoteId = result.id || null;
    }, 30000);
  });

  describe('update', () => {
    it('should update an existing note', async () => {

      const updateData = { note: 'Updated Note Content' };
      const result = await client.notes.update(testNoteId!, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testNoteId);
      expect(result.note).toBe('Updated Note Content');
    }, 30000);
  });

  describe('delete', () => {
    it('should delete a note', async () => {
      expect(testPersonId).toBeDefined();

      // Get a note category
      const categoriesResponse = await client.notes.getNoteCategories();
      expect(categoriesResponse.data.length).toBeGreaterThan(0);
      const noteCategoryId = categoriesResponse.data[0].id || '';

      // Create a note to delete
      const timestamp = Date.now();
      const noteData = {
        note: `Test Delete ${timestamp}`,
        note_category_id: noteCategoryId,
      };
      const created = await client.notes.create(testPersonId!, noteData);
      const noteIdToDelete = created.id || '';

      // Delete the note
      await expect(client.notes.delete(noteIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.notes.getById(noteIdToDelete)).rejects.toThrow();
    }, 30000);
  });

  describe('getNoteCategories', () => {
    it('should get all note categories', async () => {
      const result = await client.notes.getNoteCategories();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getNoteCategoryById', () => {
    it('should get note category by ID', async () => {
      // First get a note category ID
      const categoriesResponse = await client.notes.getNoteCategories();
      expect(categoriesResponse.data.length).toBeGreaterThan(0);
      const categoryId = categoriesResponse.data[0].id;

      const result = await client.notes.getNoteCategoryById(categoryId);

      expect(result).toBeDefined();
      expect(result.id).toBe(categoryId);
      expect(result.type).toBe('NoteCategory');
    }, 30000);
  });

  describe('createNoteCategory', () => {
    it('should create a new note category', async () => {
      const timestamp = Date.now();
      const categoryData = {
        name: `Test Category ${timestamp}`,
      };
      const result = await client.notes.createNoteCategory(categoryData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('NoteCategory');
      expect(result.name).toBe(categoryData.name);

      testNoteCategoryId = result.id || null;
    }, 30000);
  });

  describe('updateNoteCategory', () => {
    it('should update an existing note category', async () => {
      // Create a test category first
      const timestamp = Date.now();
      const categoryData = {
        name: `Test Update ${timestamp}`,
      };
      const created = await client.notes.createNoteCategory(categoryData);
      const categoryId = created.id!;

      // Use a unique name for the update to avoid conflicts
      const updateData = { name: `Updated Category Name ${timestamp}` };
      const result = await client.notes.updateNoteCategory(categoryId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(categoryId);
      expect(result.name).toBe(`Updated Category Name ${timestamp}`);

      // Clean up the updated category
      await client.notes.deleteNoteCategory(categoryId);
    }, 30000);
  });

  describe('deleteNoteCategory', () => {
    it('should delete a note category', async () => {
      // Create a category to delete
      const timestamp = Date.now();
      const categoryData = {
        name: `Test Delete ${timestamp}`,
      };
      const created = await client.notes.createNoteCategory(categoryData);
      const categoryIdToDelete = created.id || '';

      // Delete the category
      await expect(client.notes.deleteNoteCategory(categoryIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.notes.getNoteCategoryById(categoryIdToDelete)).rejects.toThrow();
    }, 30000);
  });
});
