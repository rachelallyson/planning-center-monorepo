/**
 * v2.0.0 Notes Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    NoteResource,
    NoteAttributes,
    NoteCategoryResource,
    NoteCategoryAttributes,
    Meta,
    TopLevelLinks
} from '../types';
import type { ResourceObject } from '../types/json-api';
import type { NoteListOptions, NotePageOptions } from '../types/api-options';

// Re-export for backward compatibility
export type NotesListOptions = NoteListOptions;

export class NotesModule extends BaseModule {
    /**
     * Get all notes across all pages
     */
    async getAll(options: NotesListOptions = {}) {
        this.debugLog('notes.getAll', { options });
        return await this.getAllPages<NoteResource>('/notes', {
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
        return this.getList<NoteResource>('/notes', {
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
        return this.getSingle<NoteResource>(`/notes/${id}`, include);
    }

    /**
     * Get notes for a specific person
     */
    async getNotesForPerson(personId: string, options: NotePageOptions = {}) {
        this.debugLog('notes.getNotesForPerson', { personId, options });
        return this.getList<NoteResource>(`/people/${personId}/notes`, {
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
    async create(personId: string, data: NoteAttributes) {
        this.debugLog('notes.create', { personId, data });
        return this.createResource<NoteResource>(`/people/${personId}/notes`, data);
    }

    /**
     * Update a note
     */
    async update(id: string, data: Partial<NoteAttributes>) {
        this.debugLog('notes.update', { id, data });
        return this.updateResource<NoteResource>(`/notes/${id}`, data);
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
        return this.getList<NoteCategoryResource>('/note_categories', options ? {
            per_page: options.perPage,
            page: options.page,
        } : undefined);
    }

    /**
     * Get a single note category by ID
     */
    async getNoteCategoryById(id: string) {
        return this.getSingle<NoteCategoryResource>(`/note_categories/${id}`);
    }

    /**
     * Create a note category
     */
    async createNoteCategory(data: Partial<NoteCategoryAttributes>) {
        return this.createResource<NoteCategoryResource>('/note_categories', data);
    }

    /**
     * Update a note category
     */
    async updateNoteCategory(id: string, data: Partial<NoteCategoryAttributes>) {
        return this.updateResource<NoteCategoryResource>(`/note_categories/${id}`, data);
    }

    /**
     * Delete a note category
     */
    async deleteNoteCategory(id: string) {
        return this.deleteResource(`/note_categories/${id}`);
    }
}
