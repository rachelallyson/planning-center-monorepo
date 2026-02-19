/**
 * v2.0.0 Workflows Module
 */

import { BaseModule, singleFromCreateResponse } from '@rachelallyson/planning-center-base-ts';
import type { QueryOptions } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import { getStringId } from '../internal/type-guards';
import type { WorkflowGetPageOptions, WorkflowGetAllOptions, WorkflowGetByIdOptions, WorkflowCardGetPageOptions } from '../types/api-options';

export interface AddPersonToWorkflowOptions {
    note?: string;
    skipIfExists?: boolean;
    skipIfActive?: boolean;
    noteTemplate?: string;
}

/** Workflows API: getPage, getAll, getById, create, update, delete, and workflow cards. */
export class WorkflowsModule extends BaseModule {
    /**
     * Get all workflows across all pages
     */
    async getAll(options?: WorkflowGetAllOptions) {
        return this.getAllPages<Types.WorkflowResource>('/workflows', options);
    }

    /**
     * Get a single page of workflows with optional filtering and pagination control
     */
    async getPage(options?: WorkflowGetPageOptions) {
        return this.getList<Types.WorkflowResource, WorkflowGetPageOptions>('/workflows', options);
    }

    /**
     * Get a single workflow by ID
     */
    async getById(id: string, options?: WorkflowGetByIdOptions) {
        return this.getSingle<Types.WorkflowResource>(`/workflows/${id}`, options);
    }

    /**
     * Create a workflow
     */
    async create(data: Types.WorkflowAttributes) {
        return this.createResource<Types.WorkflowResource>('/workflows', data);
    }

    /**
     * Update a workflow
     */
    async update(id: string, data: Partial<Types.WorkflowAttributes>) {
        return this.updateResource<Types.WorkflowResource>(`/workflows/${id}`, data);
    }

    /**
     * Delete a workflow
     */
    async delete(id: string) {
        return this.deleteResource(`/workflows/${id}`);
    }

    /**
     * Get workflow cards for a person
     */
    async getPersonWorkflowCards(personId: string, options?: WorkflowCardGetPageOptions) {
        return this.getList<Types.WorkflowCardResource, WorkflowCardGetPageOptions>(`/people/${personId}/workflow_cards`, options);
    }

    private getWorkflowIdFromRelationshipData(raw: object): string | undefined {
        const id = getStringId(raw);
        if (id) return id;
        const data = Reflect.get(raw, 'data');
        return data && typeof data === 'object' && !Array.isArray(data) ? getStringId(data) : undefined;
    }

    /** Return workflow id from a card's workflow (relationship or flattened). */
    private getWorkflowIdFromCard(card: Types.WorkflowCardResource): string | undefined {
        const raw = card?.workflow;
        if (!raw || typeof raw !== 'object') return undefined;
        return this.getWorkflowIdFromRelationshipData(raw);
    }

    private findCardForWorkflow(cards: Types.WorkflowCardResource[], workflowId: string): Types.WorkflowCardResource | undefined {
        return cards.find((card) => this.getWorkflowIdFromCard(card) === workflowId);
    }

    private checkCompletedOrRemoved(existingCard: Types.WorkflowCardResource): boolean {
        return Boolean(existingCard.completed_at || existingCard.removed_at);
    }

    private checkActive(existingCard: Types.WorkflowCardResource): boolean {
        return !existingCard.completed_at && !existingCard.removed_at;
    }

    private assertNoExistingCard(
        existingCard: Types.WorkflowCardResource,
        skipIfExists: boolean,
        skipIfActive: boolean
    ): void {
        if (skipIfExists && this.checkCompletedOrRemoved(existingCard)) {
            throw new Error(`Person already has a completed/removed card in this workflow`);
        }
        if (skipIfActive && this.checkActive(existingCard)) {
            throw new Error(`Person already has an active card in this workflow`);
        }
    }

    private async addNoteToWorkflowCardIfRequested(
        personId: string,
        workflowId: string,
        workflowCard: Types.WorkflowCardResource,
        options: AddPersonToWorkflowOptions
    ): Promise<Types.WorkflowCardResource> {
        const noteTemplate = options.noteTemplate;
        if (!options.note && noteTemplate === undefined) return workflowCard;
        const noteText = options.note ?? (noteTemplate !== undefined ? this.formatNoteTemplate(noteTemplate, { personId, workflowId }) : '');
        await this.createWorkflowCardNote(personId, workflowCard.id, { note: noteText });
        return workflowCard;
    }

    private async ensureNoDuplicateCard(
        personId: string,
        workflowId: string,
        skipIfExists: boolean,
        skipIfActive: boolean
    ): Promise<void> {
        const existingCards = await this.getPersonWorkflowCards(personId);
        const existingCard = this.findCardForWorkflow(existingCards.data, workflowId);
        if (existingCard) this.assertNoExistingCard(existingCard, skipIfExists, skipIfActive);
    }

    /**
     * Add a person to a workflow with smart duplicate detection
     */
    async addPersonToWorkflow(
        personId: string,
        workflowId: string,
        options: AddPersonToWorkflowOptions = {}
    ) {
        const skipIfExists = options.skipIfExists !== false;
        const skipIfActive = options.skipIfActive !== false;
        const shouldCheckDuplicate = skipIfExists || skipIfActive;

        if (shouldCheckDuplicate) {
            await this.ensureNoDuplicateCard(personId, workflowId, skipIfExists, skipIfActive);
        }
        const payload: Pick<Types.WorkflowCardAssignableAttributes, 'person_id'> = { person_id: personId };
        const createRes = await this.createResource<Types.WorkflowCardResource>(`/workflows/${workflowId}/cards`, payload);
        const workflowCard = singleFromCreateResponse(createRes);
        if (!workflowCard) throw new Error('Create workflow card did not return a resource');
        return this.addNoteToWorkflowCardIfRequested(personId, workflowId, workflowCard, options);
    }

    /**
     * Create a workflow card
     */
    async createWorkflowCard(workflowId: string, personId: string) {
        const payload: Pick<Types.WorkflowCardAssignableAttributes, 'person_id'> = { person_id: personId };
        return this.createResource<Types.WorkflowCardResource>(`/workflows/${workflowId}/cards`, payload);
    }

    /**
     * Update a workflow card
     */
    async updateWorkflowCard(workflowCardId: string, data: Partial<Types.WorkflowCardAssignableAttributes>, personId?: string) {
        // If personId is provided, use the person-specific endpoint
        if (personId) {
            return this.updateResource<Types.WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}`, data);
        }
        // Fallback to the generic endpoint (may not work for all operations)
        return this.updateResource<Types.WorkflowCardResource>(`/workflow_cards/${workflowCardId}`, data);
    }

    /**
     * Get workflow card notes
     */
    async getWorkflowCardNotes(personId: string, workflowCardId: string, options?: QueryOptions) {
        return this.getList<Types.WorkflowCardNoteResource, QueryOptions>(`/people/${personId}/workflow_cards/${workflowCardId}/notes`, options);
    }

    /**
     * Create a workflow card note
     */
    async createWorkflowCardNote(
        personId: string,
        workflowCardId: string,
        data: Types.WorkflowCardNoteAttributes
    ) {
        return this.createResource<Types.WorkflowCardNoteResource>(`/people/${personId}/workflow_cards/${workflowCardId}/notes`, data);
    }


    /**
     * Create a workflow card with a note
     */
    async createWorkflowCardWithNote(
        workflowId: string,
        personId: string,
        noteData: Types.WorkflowCardNoteAttributes
    ) {
        const workflowCardRes = await this.createWorkflowCard(workflowId, personId);
        const workflowCard = singleFromCreateResponse(workflowCardRes);
        if (!workflowCard) throw new Error('Create workflow card did not return a resource');
        const noteRes = await this.createWorkflowCardNote(personId, workflowCard.id, noteData);
        const note = singleFromCreateResponse(noteRes);
        if (!note) throw new Error('Create workflow card note did not return a resource');
        return { workflowCard, note };
    }

    /**
     * Move a workflow card back to the previous step
     */
    async goBackWorkflowCard(personId: string, workflowCardId: string) {
        return this.createResource<Types.WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/go_back`, {});
    }

    /**
     * Move a workflow card to the next step
     */
    async promoteWorkflowCard(personId: string, workflowCardId: string) {
        return this.createResource<Types.WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/promote`, {});
    }

    /**
     * Remove a workflow card
     */
    async removeWorkflowCard(personId: string, workflowCardId: string) {
        return this.createResource<Types.WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/remove`, {});
    }

    /**
     * Restore a workflow card
     */
    async restoreWorkflowCard(personId: string, workflowCardId: string) {
        return this.createResource<Types.WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/restore`, {});
    }

    /**
     * Send an email to the subject of the workflow card
     */
    async sendEmailWorkflowCard(
        personId: string,
        workflowCardId: string,
        data: Types.WorkflowCardEmailAttributes
    ) {
        return this.createResource<Types.WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/send_email`, data);
    }

    /**
     * Move a workflow card to the next step without completing the current step
     */
    async skipStepWorkflowCard(personId: string, workflowCardId: string) {
        return this.createResource<Types.WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/skip_step`, {});
    }

    /**
     * Snooze a workflow card for a specific duration
     */
    async snoozeWorkflowCard(personId: string, workflowCardId: string, data: Types.WorkflowCardSnoozeAttributes) {
        return this.createResource<Types.WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/snooze`, data);
    }

    /**
     * Unsnooze a workflow card
     */
    async unsnoozeWorkflowCard(personId: string, workflowCardId: string) {
        return this.createResource<Types.WorkflowCardResource>(`/people/${personId}/workflow_cards/${workflowCardId}/unsnooze`, {});
    }

    /**
     * Format note template with variables
     */
    private formatNoteTemplate(template: string, variables: Record<string, string | number | boolean>) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            const value = variables[key];
            return value !== undefined ? String(value) : match;
        });
    }
}
