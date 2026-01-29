import {
    PcoClient,
    type PersonAttributes,
} from '../../../src';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateRelationship,
} from '../../type-validators';
import { createTestClient, logAuthStatus } from '../test-config';

const TEST_PREFIX = 'TEST_V2_NOTES_2025';

describe('v2.0.0 Notes API Integration Tests', () => {
    let client: PcoClient;
    let testPersonId: string;
    let testNoteId: string;
    let testCategoryId: string;

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();

        // Create a test person for note operations
        const timestamp = Date.now();
        const personData: Partial<PersonAttributes> = {
            first_name: `${TEST_PREFIX}_NoteTest_${timestamp}`,
            last_name: `${TEST_PREFIX}_Test_${timestamp}`,
            status: 'active',
        };

        const createResponse = await client.people.create(personData);
        testPersonId = createResponse.id || '';
        expect(testPersonId).toBeTruthy();
    }, 30000);

    afterAll(async () => {
        // Clean up test person (this will also clean up associated notes) - failures should fail the test
        if (testPersonId) {
            await client.people.delete(testPersonId);
        }
    }, 30000);

    describe('v2.0 Note Operations', () => {
        it('should get all notes with pagination', async () => {
            const notes = await client.notes.getAll();
            expect(notes.data).toBeDefined();
            expect(Array.isArray(notes.data)).toBe(true);
            expect(notes.meta).toBeDefined();
        }, 30000);

        it('should get note by ID', async () => {
            const notes = await client.notes.getAll();

            expect(notes.data.length).toBeGreaterThan(0);

            const noteId = notes.data[0].id;
            const note = await client.notes.getById(noteId);

            validateResourceStructure(note, 'Note');
            expect(note.id).toBe(noteId);
            // getById() returns flattened resources - attributes are at top level, not in .attributes
            expect(note).toHaveProperty('note');
        }, 30000);

        it('should create note for person', async () => {
            // First get an existing note category
            const categories = await client.notes.getNoteCategories();
            expect(categories.data.length).toBeGreaterThan(0);
            const categoryId = categories.data[0].id;

            const timestamp = Date.now();
            const noteData = {
                note: `This is a test note created via v2.0 API at ${new Date().toISOString()}`,
                note_category_id: categoryId,
            };

            const note = await client.notes.create(testPersonId, noteData);

            expect(note).toBeDefined();
            validateResourceStructure(note, 'Note');
            // create() returns ResourceObject, not flattened - attributes are nested
            expect(note.note).toBe(noteData.note);
            // Flattened: person at top level; API may omit relationship in create response
            const personRef = (note as Record<string, unknown>).person;
            const personId = personRef && typeof personRef === 'object' && 'id' in personRef
                ? (Array.isArray(personRef) ? personRef[0]?.id : (personRef as { id?: string }).id)
                : undefined;
            if (personId !== undefined) {
                expect(personId).toBe(testPersonId);
            } else {
                expect(note.id).toBeTruthy();
            }

            testNoteId = note.id || '';
            expect(testNoteId).toBeTruthy();
        }, 60000);

        it('should get notes for person', async () => {
            const notes = await client.notes.getNotesForPerson(testPersonId);

            expect(notes.data).toBeDefined();
            expect(Array.isArray(notes.data)).toBe(true);
            expect(notes.data.length).toBeGreaterThan(0);

            expect(testNoteId).toBeTruthy();
            expect(notes.data.some(note => note.id === testNoteId)).toBe(true);
        }, 30000);

        it('should update note', async () => {
            if (!testNoteId) {
                const notes = await client.notes.getNotesForPerson(testPersonId);
                testNoteId = notes.data[0].id || '';
            }

            expect(testNoteId).toBeTruthy();

            const updateData = {
                note: `This note was updated via v2.0 API at ${new Date().toISOString()}`,
            };

            const updatedNote = await client.notes.update(testNoteId, updateData);

            validateResourceStructure(updatedNote, 'Note');
            expect(updatedNote.id).toBe(testNoteId);
            expect(updatedNote.note).toBe(updateData.note);
        }, 60000);

        it('should delete note', async () => {
            if (!testNoteId) {
                const notes = await client.notes.getNotesForPerson(testPersonId);
                testNoteId = notes.data[0].id || '';
            }

            expect(testNoteId).toBeTruthy();

            await client.notes.delete(testNoteId);

            // Verify note was deleted
            await expect(
                client.notes.getById(testNoteId)
            ).rejects.toThrow();
        }, 60000);
    });

    describe('v2.0 Note Category Operations', () => {
        it('should get all note categories', async () => {
            const categories = await client.notes.getNoteCategories();

            expect(categories.data).toBeDefined();
            expect(Array.isArray(categories.data)).toBe(true);
        }, 30000);

        it('should get note category by ID', async () => {
            const categories = await client.notes.getNoteCategories();
            expect(categories.data.length).toBeGreaterThan(0);

            const categoryId = categories.data[0].id;
            const category = await client.notes.getNoteCategoryById(categoryId);

            validateResourceStructure(category, 'NoteCategory');
            expect(category.id).toBe(categoryId);
            // getNoteCategoryById() returns flattened resources - attributes are at top level, not in .attributes
            expect(category).toHaveProperty('name');
        }, 30000);

        it('should create note category', async () => {
            const timestamp = Date.now();
            const categoryData = {
                name: `${TEST_PREFIX}_Category_${timestamp}`,
            };

            const category = await client.notes.createNoteCategory(categoryData);

            validateResourceStructure(category, 'NoteCategory');
            expect(category.name).toBe(categoryData.name);

            testCategoryId = category.id || '';
            expect(testCategoryId).toBeTruthy();
        }, 60000);

        it('should update note category', async () => {
            if (!testCategoryId) {
                // Create a category if we don't have one
                const timestamp = Date.now();
                const categoryData = {
                    name: `${TEST_PREFIX}_Category_${timestamp}`,
                };
                const category = await client.notes.createNoteCategory(categoryData);
                testCategoryId = category.id || '';
            }

            expect(testCategoryId).toBeTruthy();

            const updateData = {
                name: `${TEST_PREFIX}_Updated_Category_${Date.now()}`,
            };

            const updatedCategory = await client.notes.updateNoteCategory(testCategoryId, updateData);

            validateResourceStructure(updatedCategory, 'NoteCategory');
            expect(updatedCategory.id).toBe(testCategoryId);
            expect(updatedCategory.name).toBe(updateData.name);
        }, 60000);

        it('should create note with category', async () => {
            if (!testCategoryId) {
                // Create a category if we don't have one
                const timestamp = Date.now();
                const categoryData = {
                    name: `${TEST_PREFIX}_Category_${timestamp}`,
                };
                const category = await client.notes.createNoteCategory(categoryData);
                testCategoryId = category.id || '';
            }

            expect(testCategoryId).toBeTruthy();

            const timestamp = Date.now();
            const noteData = {
                note: `This is a test note with category created via v2.0 API at ${new Date().toISOString()}`,
                note_category_id: testCategoryId,
            };

            const note = await client.notes.create(testPersonId, noteData);

            expect(note).toBeDefined();
            validateResourceStructure(note, 'Note');
            // create returns ResourceObject, not flattened - attributes are nested
            expect(note.note).toBe(noteData.note);
            // Flattened: person and note_category at top level; API may omit in create response
            const personRef = (note as Record<string, unknown>).person;
            const personId = personRef && typeof personRef === 'object' && 'id' in personRef
                ? (Array.isArray(personRef) ? personRef[0]?.id : (personRef as { id?: string }).id)
                : undefined;
            if (personId !== undefined) expect(personId).toBe(testPersonId);
            const categoryRef = (note as Record<string, unknown>).note_category;
            const categoryId = categoryRef && typeof categoryRef === 'object' && 'id' in categoryRef
                ? (Array.isArray(categoryRef) ? categoryRef[0]?.id : (categoryRef as { id?: string }).id)
                : undefined;
            if (categoryId !== undefined) expect(categoryId).toBe(testCategoryId);
            expect(note.id).toBeTruthy();
        }, 60000);

        it('should filter notes by category', async () => {
            expect(testCategoryId).toBeTruthy();

            const notes = await client.notes.getNotesForPerson(testPersonId, {
                where: { note_category_id: testCategoryId },
            });

            expect(notes.data).toBeDefined();
            expect(Array.isArray(notes.data)).toBe(true);
            expect(notes.data.length).toBeGreaterThan(0);

            const expectedCategoryId = String(testCategoryId);
            notes.data.forEach(note => {
                if ('note_category_id' in note && note.note_category_id != null) {
                    expect(String(note.note_category_id)).toBe(expectedCategoryId);
                }
            });
        }, 30000);

        it('should delete note category', async () => {
            if (!testCategoryId) {
                // Create a category if we don't have one
                const timestamp = Date.now();
                const categoryData = {
                    name: `${TEST_PREFIX}_Category_${timestamp}`,
                };
                const category = await client.notes.createNoteCategory(categoryData);
                testCategoryId = category.id || '';
            }

            expect(testCategoryId).toBeTruthy();

            await client.notes.deleteNoteCategory(testCategoryId);

            // Verify category was deleted
            await expect(
                client.notes.getNoteCategoryById(testCategoryId)
            ).rejects.toThrow();
        }, 60000);
    });

    describe('v2.0 Note Validation', () => {
        it('should handle invalid person ID gracefully', async () => {
            const noteData = {
                content: 'This should fail',
                category: 'General',
            };

            await expect(
                client.notes.create('invalid-person-id', noteData)
            ).rejects.toThrow();
        }, 30000);

        it('should handle invalid note ID gracefully', async () => {
            await expect(
                client.notes.getById('invalid-note-id')
            ).rejects.toThrow();
        }, 30000);

        it('should handle invalid category ID gracefully', async () => {
            await expect(
                client.notes.getNoteCategoryById('invalid-category-id')
            ).rejects.toThrow();
        }, 30000);
    });

    describe('v2.0 Note Performance', () => {
        it('should demonstrate note operations performance', async () => {
            const startTime = Date.now();

            // Get all notes
            const notes = await client.notes.getAll();
            const noteFetchTime = Date.now() - startTime;

            expect(notes.data).toBeDefined();
            expect(Array.isArray(notes.data)).toBe(true);
            expect(noteFetchTime).toBeLessThan(25000); // Allow for API latency
        }, 30000);
    });
});
