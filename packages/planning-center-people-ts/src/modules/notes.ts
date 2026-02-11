/**
 * v2.0.0 Notes Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type { NoteListOptions, NotePageOptions } from '../types/api-options';

// Re-export for backward compatibility
export type NotesListOptions = NoteListOptions;

export class NotesModule extends BaseModule {
    /**
     * Get all notes across all pages
     */
    async getAll(options: NotesListOptions = {}) {
        this.debugLog('notes.getAll', { options });
        return await this.getAllPages<Types.NoteResourceObject>('/notes', {
            where: options.where,
            include: options.include,
            order: options.order
        });
    }

    /**
     * Get a single page of notes with optional filtering and pagination control
     * Use this when you need a specific page or want to limit the number of results
     * @param options - List options including where, include, perPage, page, and order
     * @returns A single page of results with meta and links for pagination
     */
    async getPage(options: NotePageOptions = {}){
        this.debugLog('notes.getPage', { options });
        return this.getList<Types.NoteResourceObject>('/notes', {
            where: options.where,
            include: options.include,
            per_page: options.perPage,
            page: options.page,
            order: options.order
        });
    }

    /**
     * Get a single note by ID
     */
    async getById(id: string, include?: string[]) {
        this.debugLog('notes.getById', { id, include });
        return this.getSingle<Types.NoteResourceObject>(`/notes/${id}`, include);
    }

    /**
     * Get notes for a specific person
     */
    async getNotesForPerson(personId: string, options: NotePageOptions = {}) {
        this.debugLog('notes.getNotesForPerson', { personId, options });
        return this.getList<Types.NoteResourceObject>(`/people/${personId}/notes`, {
            where: options.where,
            include: options.include,
            per_page: options.perPage,
            page: options.page,
            order: options.order
        });
    }

    /**
     * Create a note for a person
     */
    async create(personId: string, data: Types.NoteAttributes) {
        this.debugLog('notes.create', { personId, data });
        return this.createResource<Types.NoteResourceObject>(`/people/${personId}/notes`, data);
    }

    /**
     * Update a note
     */
    async update(id: string, data: Partial<Types.NoteAttributes>) {
        this.debugLog('notes.update', { id, data });
        return this.updateResource<Types.NoteResourceObject>(`/notes/${id}`, data);
    }

    /**
     * Delete a note
     */
    async delete(id: string) {
        this.debugLog('notes.delete', { id });
        return this.deleteResource(`/notes/${id}`);
    }

    /**
     * Get all note categories
     * @param options - Optional pagination options
     */
    async getNoteCategories(options?: { perPage?: number; page?: number }) {
        this.debugLog('notes.getNoteCategories', { options });
        return this.getList<Types.NoteCategoryResourceObject>('/note_categories', options ? {
            per_page: options.perPage,
            page: options.page,
        } : undefined);
    }

    /**
     * Get a single note category by ID
     */
    async getNoteCategoryById(id: string) {
        return this.getSingle<Types.NoteCategoryResourceObject>(`/note_categories/${id}`);
    }

    /**
     * Create a note category
     */
    async createNoteCategory(data: Partial<Types.NoteCategoryAttributes>) {
        return this.createResource<Types.NoteCategoryResourceObject>('/note_categories', data);
    }

    /**
     * Update a note category
     */
    async updateNoteCategory(id: string, data: Partial<Types.NoteCategoryAttributes>) {
        return this.updateResource<Types.NoteCategoryResourceObject>(`/note_categories/${id}`, data);
    }

    /**
     * Delete a note category
     */
    async deleteNoteCategory(id: string) {
        return this.deleteResource(`/note_categories/${id}`);
    }
}
