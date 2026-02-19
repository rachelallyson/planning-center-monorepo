/**
 * v2.0.0 Notes Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type { NoteGetPageOptions, NoteGetAllOptions, NoteGetByIdOptions, NoteCategoryGetPageOptions } from '../types/api-options';

/** Notes API: getPage, getAll, getById, create, update, delete, and note categories. */
export class NotesModule extends BaseModule {
    /**
     * Get all notes across all pages
     */
    async getAll(options?: NoteGetAllOptions) {
        return this.getAllPages<Types.NoteResource>('/notes', options);
    }

    /**
     * Get a single page of notes with optional filtering and pagination control
     */
    async getPage(options?: NoteGetPageOptions) {
        return this.getList<Types.NoteResource, NoteGetPageOptions>('/notes', options);
    }

    /**
     * Get a single note by ID
     */
    async getById(id: string, options?: NoteGetByIdOptions) {
        return this.getSingle<Types.NoteResource>(`/notes/${id}`, options);
    }

    /**
     * Get notes for a specific person
     */
    async getNotesForPerson(personId: string, options?: NoteGetPageOptions) {
        return this.getList<Types.NoteResource, NoteGetPageOptions>(`/people/${personId}/notes`, options);
    }

    /**
     * Create a note for a person
     */
    async create(personId: string, data: Types.NoteAttributes) {
        return this.createResource<Types.NoteResource>(`/people/${personId}/notes`, data);
    }

    /**
     * Update a note
     */
    async update(id: string, data: Partial<Types.NoteAttributes>) {
        return this.updateResource<Types.NoteResource>(`/notes/${id}`, data);
    }

    /**
     * Delete a note
     */
    async delete(id: string) {
        return this.deleteResource(`/notes/${id}`);
    }

    /**
     * Get all note categories
     * @param options - Optional pagination options
     */
    async getNoteCategories(options?: NoteCategoryGetPageOptions) {
        return this.getList<Types.NoteCategoryResource, NoteCategoryGetPageOptions>('/note_categories', options);
    }

    /**
     * Get a single note category by ID
     */
    async getNoteCategoryById(id: string) {
        return this.getSingle<Types.NoteCategoryResource>(`/note_categories/${id}`);
    }

    /**
     * Create a note category
     */
    async createNoteCategory(data: Partial<Types.NoteCategoryAttributes>) {
        return this.createResource<Types.NoteCategoryResource>('/note_categories', data);
    }

    /**
     * Update a note category
     */
    async updateNoteCategory(id: string, data: Partial<Types.NoteCategoryAttributes>) {
        return this.updateResource<Types.NoteCategoryResource>(`/note_categories/${id}`, data);
    }

    /**
     * Delete a note category
     */
    async deleteNoteCategory(id: string) {
        return this.deleteResource(`/note_categories/${id}`);
    }
}
