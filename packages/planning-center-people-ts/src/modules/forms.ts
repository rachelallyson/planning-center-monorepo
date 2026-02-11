/**
 * v2.0.0 Forms Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type { FormListOptions, FormPageOptions } from '../types/api-options';

/**
 * Forms module for managing form-related operations
 * Most operations are read-only based on API documentation
 */
export class FormsModule extends BaseModule {
    /**
     * Get all forms across all pages
     */
    async getAll(params?: FormListOptions) {
        this.debugLog('forms.getAll', { params });
        return this.getAllPages<Types.FormResourceObject>('/forms', {
            where: params?.where,
            include: params?.include,
            order: params?.order
        });
    }

    /**
     * Get a single page of forms with optional filtering and pagination control
     * Use this when you need a specific page or want to limit the number of results
     * @param params - List parameters including where, include, perPage, page, and order
     * @returns A single page of results with meta and links for pagination
     */
    async getPage(params?: FormPageOptions) {
        this.debugLog('forms.getPage', { params });
        return this.getList<Types.FormResourceObject>('/forms', {
            where: params?.where,
            include: params?.include,
            per_page: params?.perPage,
            page: params?.page,
            order: params?.order
        })
    }

    /**
     * Get a specific form by ID
     */
    async getById(id: string, include?: string[]) {
        this.debugLog('forms.getById', { id, include });
        return this.getSingle<Types.FormResourceObject>(`/forms/${id}`, include);
    }

    /**
     * Get form category for a specific form
     */
    async getFormCategory(formId: string) {
        this.debugLog('forms.getFormCategory', { formId });
        return this.getSingle<Types.FormCategoryResourceObject>(`/forms/${formId}/category`);
    }

    /**
     * Get form fields for a specific form
     */
    async getFormFields(formId: string, params?: {
        where?: Record<string, string | number | boolean | undefined>; // FormField nested resource doesn't have documented where[] fields
        include?: string[];
        perPage?: number;
        page?: number;
    }) {
        this.debugLog('forms.getFormFields', { formId, params });
        return await this.getList<Types.FormFieldResourceObject>(`/forms/${formId}/fields`, {
            where: params?.where,
            include: params?.include,
            per_page: params?.perPage,
            page: params?.page
        });
    }

    /**
     * Get form field options for a specific form field
     * Note: This requires the formId to get field options
     */
    async getFormFieldOptions(formId: string, formFieldId: string, params?: {
        where?: Record<string, string | number | boolean | undefined>; // FormFieldOption nested resource doesn't have documented where[] fields
        include?: string[];
        per_page?: number;
        page?: number;
    }) {
        this.debugLog('forms.getFormFieldOptions', { formId, formFieldId, params });
        return await this.getList<Types.FormFieldOptionResourceObject>(`/forms/${formId}/fields/${formFieldId}/options`, params);
    }

    /**
     * Get form submissions for a specific form
     */
    async getFormSubmissions(formId: string, params?: {
        where?: Record<string, string | number | boolean | undefined>; // FormSubmission nested resource doesn't have documented where[] fields
        include?: string[];
        per_page?: number;
        page?: number;
    }) {
        this.debugLog('forms.getFormSubmissions', { formId, params });
        return await this.getList<Types.FormSubmissionResourceObject>(`/forms/${formId}/form_submissions`, params);
    }

    /**
     * Get a specific form submission by ID
     * Note: This requires the formId to get the submission
     */
    async getFormSubmissionById(formId: string, formSubmissionId: string, include?: string[]) {
        this.debugLog('forms.getFormSubmissionById', { formId, formSubmissionId, include });
        return this.getSingle<Types.FormSubmissionResourceObject>(`/forms/${formId}/form_submissions/${formSubmissionId}`, include);
    }

    /**
     * Get form submission values for a specific form submission
     * Note: This requires the formId to get submission values
     */
    async getFormSubmissionValues(formId: string, formSubmissionId: string, params?: {
        where?: Record<string, string | number | boolean | undefined>; // FormSubmissionValue nested resource doesn't have documented where[] fields
        include?: string[];
        per_page?: number;
        page?: number;
    }) {
        this.debugLog('forms.getFormSubmissionValues', { formId, formSubmissionId, params });
        return await this.getList<Types.FormSubmissionValueResourceObject>(`/forms/${formId}/form_submissions/${formSubmissionId}/form_submission_values`, params);
    }
}
