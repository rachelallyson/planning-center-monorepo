/**
 * v2.0.0 Workflows Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';

import type { WorkflowListOptions, WorkflowPageOptions } from '../types/api-options';

// Re-export for backward compatibility
export type { WorkflowListOptions };

export interface AddPersonToWorkflowOptions {
    note?: string;
    skipIfExists?: boolean;
    skipIfActive?: boolean;
    noteTemplate?: string;
}

export class WorkflowsModule extends BaseModule {
    /**
     * Get all workflows across all pages
     */
    async getAll(options: WorkflowListOptions = {}) {
        this.debugLog('workflows.getAll', { options });
        return  await this.getAllPages<Types.WorkflowResourceObject>('/workflows', {
            where: options.where,
            include: options.include,
            order: options.order
        });

    }

    /**
     * Get a single page of workflows with optional filtering and pagination control
     * Use this when you need a specific page or want to limit the number of results
     * @param options - List options including where, include, perPage, and page
     * @returns A single page of results with meta and links for pagination
     */
    async getPage(options: WorkflowPageOptions = {}) {
        this.debugLog('workflows.getPage', { options });
        return this.getList<Types.WorkflowResourceObject>('/workflows', {
            where: options.where,
            include: options.include,
            per_page: options.perPage,
            page: options.page,
            order: options.order
        });
    }

    /**
     * Get a single workflow by ID
     */
    async getById(id: string, include?: string[]) {
        this.debugLog('workflows.getById', { id, include });
        return this.getSingle<Types.WorkflowResourceObject>(`/workflows/${id}`, include);
    }

    /**
     * Create a workflow
     */
    async create(data: Types.WorkflowAttributes) {
        this.debugLog('workflows.create', { data });
        return this.createResource<Types.WorkflowResourceObject>('/workflows', data);
    }

    /**
     * Update a workflow
     */
    async update(id: string, data: Partial<Types.WorkflowAttributes>) {
        this.debugLog('workflows.update', { id, data });
        return this.updateResource<Types.WorkflowResourceObject>(`/workflows/${id}`, data);
    }

    /**
     * Delete a workflow
     */
    async delete(id: string) {
        this.debugLog('workflows.delete', { id });
        return this.deleteResource(`/workflows/${id}`);
    }

    /**
     * Get workflow cards for a person
     * @param personId - The person ID
     * @param options - Optional pagination options
     */
    async getPersonWorkflowCards(personId: string, options?: { perPage?: number; page?: number }) {
        this.debugLog('workflows.getPersonWorkflowCards', { personId, options });
        return this.getList<Types.WorkflowCardResourceObject>(`/people/${personId}/workflow_cards`, options);
    }

    /**
     * Add a person to a workflow with smart duplicate detection
     */
    async addPersonToWorkflow(
        personId: string,
        workflowId: string,
        options: AddPersonToWorkflowOptions = {}
    ) {
        this.debugLog('workflows.addPersonToWorkflow', { personId, workflowId, options });
        const { skipIfExists = true, skipIfActive = true } = options;

        // Check for existing workflow cards if requested
        if (skipIfExists || skipIfActive) {
            const existingCards = await this.getPersonWorkflowCards(personId);
            const existingCard = existingCards.data.find(card => {
                // workflow may be Relationship (with .data) or flattened resource/identifier; support both
                const raw = card?.workflow as { data?: { id?: string } | { id?: string }[]; id?: string } | null | undefined;
                const workflowData = raw && 'id' in raw ? raw : raw?.data;
                return workflowData && !Array.isArray(workflowData) && (workflowData as { id?: string }).id === workflowId;
            });

            if (existingCard) {
                // Check if card is completed or removed
                if (skipIfExists && (existingCard.completed_at || existingCard.removed_at)) {
                    throw new Error(`Person already has a completed/removed card in this workflow`);
                }

                // Check if card is active
                if (skipIfActive && !existingCard.completed_at && !existingCard.removed_at) {
                    throw new Error(`Person already has an active card in this workflow`);
                }
            }
        }

        // Create the workflow card
        const workflowCard = await this.createResource<Types.WorkflowCardResourceObject>(`/workflows/${workflowId}/cards`, {
            person_id: personId,
        } as Partial<Types.WorkflowCardAttributes>);

        // Add note if provided
        if (options.note || options.noteTemplate) {
            const noteText = options.note || this.formatNoteTemplate(options.noteTemplate!, { personId, workflowId });
            await this.createWorkflowCardNote(personId, workflowCard.id, { note: noteText });
        }

        return workflowCard;
    }

    /**
     * Create a workflow card
     */
    async createWorkflowCard(workflowId: string, personId: string) {
        this.debugLog('workflows.createWorkflowCard', { workflowId, personId });
        return this.createResource<Types.WorkflowCardResourceObject>(`/workflows/${workflowId}/cards`, {
            person_id: personId,
        } as Partial<Types.WorkflowCardAttributes>);
    }

    /**
     * Update a workflow card
     */
    async updateWorkflowCard(workflowCardId: string, data: Partial<Types.WorkflowCardAssignableAttributes>, personId?: string) {
        this.debugLog('workflows.updateWorkflowCard', { workflowCardId, data, personId });
        // If personId is provided, use the person-specific endpoint
        if (personId) {
            return this.updateResource<Types.WorkflowCardResourceObject>(`/people/${personId}/workflow_cards/${workflowCardId}`, data);
        }
        // Fallback to the generic endpoint (may not work for all operations)
        return this.updateResource<Types.WorkflowCardResourceObject>(`/workflow_cards/${workflowCardId}`, data);
    }

    /**
     * Get workflow card notes
     */
    async getWorkflowCardNotes(personId: string, workflowCardId: string) {
        this.debugLog('workflows.getWorkflowCardNotes', { personId, workflowCardId });
        return this.getList<Types.WorkflowCardNoteResourceObject>(`/people/${personId}/workflow_cards/${workflowCardId}/notes`);
    }

    /**
     * Create a workflow card note
     */
    async createWorkflowCardNote(
        personId: string,
        workflowCardId: string,
        data: Types.WorkflowCardNoteAttributes
    ) {
        this.debugLog('workflows.createWorkflowCardNote', { personId, workflowCardId, data });
        return this.createResource<Types.WorkflowCardNoteResourceObject>(`/people/${personId}/workflow_cards/${workflowCardId}/notes`, data);
    }


    /**
     * Create a workflow card with a note
     */
    async createWorkflowCardWithNote(
        workflowId: string,
        personId: string,
        noteData: Types.WorkflowCardNoteAttributes
    ) {
        this.debugLog('workflows.createWorkflowCardWithNote', { workflowId, personId, noteData });
        const workflowCard = await this.createWorkflowCard(workflowId, personId);
        const note = await this.createWorkflowCardNote(personId, workflowCard.id, noteData);

        return { workflowCard, note };
    }

    /**
     * Move a workflow card back to the previous step
     */
    async goBackWorkflowCard(personId: string, workflowCardId: string) {
        this.debugLog('workflows.goBackWorkflowCard', { personId, workflowCardId });
        return this.createResource<Types.WorkflowCardResourceObject>(`/people/${personId}/workflow_cards/${workflowCardId}/go_back`, {});
    }

    /**
     * Move a workflow card to the next step
     */
    async promoteWorkflowCard(personId: string, workflowCardId: string) {
        this.debugLog('workflows.promoteWorkflowCard', { personId, workflowCardId });
        return this.createResource<Types.WorkflowCardResourceObject>(`/people/${personId}/workflow_cards/${workflowCardId}/promote`, {});
    }

    /**
     * Remove a workflow card
     */
    async removeWorkflowCard(personId: string, workflowCardId: string) {
        this.debugLog('workflows.removeWorkflowCard', { personId, workflowCardId });
        return this.createResource<Types.WorkflowCardResourceObject>(`/people/${personId}/workflow_cards/${workflowCardId}/remove`, {});
    }

    /**
     * Restore a workflow card
     */
    async restoreWorkflowCard(personId: string, workflowCardId: string) {
        this.debugLog('workflows.restoreWorkflowCard', { personId, workflowCardId });
        return this.createResource<Types.WorkflowCardResourceObject>(`/people/${personId}/workflow_cards/${workflowCardId}/restore`, {});
    }

    /**
     * Send an email to the subject of the workflow card
     */
    async sendEmailWorkflowCard(
        personId: string,
        workflowCardId: string,
        data: Types.WorkflowCardEmailAttributes
    ) {
        this.debugLog('workflows.sendEmailWorkflowCard', { personId, workflowCardId, data });
        return this.createResource<Types.WorkflowCardResourceObject>(`/people/${personId}/workflow_cards/${workflowCardId}/send_email`, data);
    }

    /**
     * Move a workflow card to the next step without completing the current step
     */
    async skipStepWorkflowCard(personId: string, workflowCardId: string) {
        this.debugLog('workflows.skipStepWorkflowCard', { personId, workflowCardId });
        return this.createResource<Types.WorkflowCardResourceObject>(`/people/${personId}/workflow_cards/${workflowCardId}/skip_step`, {});
    }

    /**
     * Snooze a workflow card for a specific duration
     */
    async snoozeWorkflowCard(personId: string, workflowCardId: string, data: Types.WorkflowCardSnoozeAttributes) {
        this.debugLog('workflows.snoozeWorkflowCard', { personId, workflowCardId, data });
        return this.createResource<Types.WorkflowCardResourceObject>(`/people/${personId}/workflow_cards/${workflowCardId}/snooze`, data);
    }

    /**
     * Unsnooze a workflow card
     */
    async unsnoozeWorkflowCard(personId: string, workflowCardId: string) {
        this.debugLog('workflows.unsnoozeWorkflowCard', { personId, workflowCardId });
        return this.createResource<Types.WorkflowCardResourceObject>(`/people/${personId}/workflow_cards/${workflowCardId}/unsnooze`, {});
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
