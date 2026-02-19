/**
 * v2.0.0 Forms Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    FormGetPageOptions,
    FormGetAllOptions,
    FormGetByIdOptions,
    FormSubmissionGetByIdOptions,
    FormFieldGetPageOptions,
    FormFieldOptionGetPageOptions,
    FormSubmissionGetPageOptions,
    FormSubmissionValueGetPageOptions,
} from '../types/api-options';

/**
 * Forms module for managing form-related operations
 * Most operations are read-only based on API documentation
 */
export class FormsModule extends BaseModule {
    /**
     * Get all forms across all pages
     */
    async getAll(params?: FormGetAllOptions) {
        return this.getAllPages<Types.FormResource>('/forms', params);
    }

    /**
     * Get a single page of forms with optional filtering and pagination control
     */
    async getPage(params?: FormGetPageOptions) {
        return this.getList<Types.FormResource, FormGetPageOptions>('/forms', params);
    }

    /**
     * Get a specific form by ID
     */
    async getById(id: string, options?: FormGetByIdOptions) {
        return this.getSingle<Types.FormResource>(`/forms/${id}`, options);
    }

    /**
     * Get form category for a specific form
     */
    async getFormCategory(formId: string) {
        return this.getSingle<Types.FormCategoryResource>(`/forms/${formId}/category`);
    }

    /**
     * Get form fields for a specific form
     */
    async getFormFields(formId: string, params?: FormFieldGetPageOptions) {
        return this.getList<Types.FormFieldResource, FormFieldGetPageOptions>(`/forms/${formId}/fields`, params);
    }

    /**
     * Get form field options for a specific form field
     */
    async getFormFieldOptions(formId: string, formFieldId: string, params?: FormFieldOptionGetPageOptions) {
        return this.getList<Types.FormFieldOptionResource, FormFieldOptionGetPageOptions>(`/forms/${formId}/fields/${formFieldId}/options`, params);
    }

    /**
     * Get form submissions for a specific form
     */
    async getFormSubmissions(formId: string, params?: FormSubmissionGetPageOptions) {
        return this.getList<Types.FormSubmissionResource, FormSubmissionGetPageOptions>(`/forms/${formId}/form_submissions`, params);
    }

    /**
     * Get a specific form submission by ID
     */
    async getFormSubmissionById(formId: string, formSubmissionId: string, options?: FormSubmissionGetByIdOptions) {
        return this.getSingle<Types.FormSubmissionResource>(`/forms/${formId}/form_submissions/${formSubmissionId}`, options);
    }

    /**
     * Get form submission values for a specific form submission
     */
    async getFormSubmissionValues(formId: string, formSubmissionId: string, params?: FormSubmissionValueGetPageOptions) {
        return this.getList<Types.FormSubmissionValueResource, FormSubmissionValueGetPageOptions>(`/forms/${formId}/form_submissions/${formSubmissionId}/form_submission_values`, params);
    }
}
