/**
 * Custom fields API: definitions, field data, tabs, and file upload helpers.
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import type {
    FieldDataGetPageOptions,
    FieldDefinitionGetAllOptions,
    TabGetByIdOptions,
} from '../types/api-options';
import { getStringId } from '../internal/type-guards';
import {
    extractFileUrl,
    getFilename,
    getFileExtension,
    getMimeType,
    isFileUpload,
} from '../helpers';

export interface FieldSetOptions {
    /** Field definition ID */
    fieldId?: string;
    /** Field definition slug */
    fieldSlug?: string;
    /** Field definition name */
    fieldName?: string;
    /** Value to set */
    value: string;
    /** Whether to handle file uploads automatically */
    handleFileUploads?: boolean;
}

/** Fields module: getAllFieldDefinitions, getFieldData, setFieldValues, and tab helpers. */
export class FieldsModule extends BaseModule {
    /**
     * Get all field definitions
     * @param include - Optional array of relationships to include (defaults to ['tab'])
     *   Valid values: 'tab', 'field_options'
     * @param options - Optional additional options
     *   - includeDeleted: If true, includes deleted field definitions (default: false)
     *   - where: Optional object for filtering field definitions
     *     Valid keys: config, data_type, deleted_at, name, sequence, slug, tab_id
     *     Example: { tab_id: '123', data_type: 'string' }
     *   - order: Optional field name to order by (prefix with '-' to reverse order)
     *     Valid values: config, data_type, deleted_at, name, sequence, slug, tab_id
     *     Example: 'sequence' or '-name' for descending
     */
    async getAllFieldDefinitions(options?: FieldDefinitionGetAllOptions) {
        return this.getAllPages<Types.FieldDefinitionResource>('/field_definitions', options);
    }

    /**
     * Get a single field definition by ID
     */
    async getFieldDefinition(id: string) {
        return this.getSingle<Types.FieldDefinitionResource>(`/field_definitions/${id}`);
    }

    /**
     * Get field definition by slug
     */
    async getFieldDefinitionBySlug(slug: string) {
        const allFieldDefinitions = await this.getAllFieldDefinitions();
        return allFieldDefinitions.data.find((fd: Types.FieldDefinitionResource) => fd.slug === slug) || null;
    }

    /**
     * Get field definition by name
     */
    async getFieldDefinitionByName(name: string) {
        const allFieldDefinitions = await this.getAllFieldDefinitions();
        return allFieldDefinitions.data.find((fd: Types.FieldDefinitionResource) => fd.name === name) || null;
    }

    /**
     * Create a field definition
     */
    async createFieldDefinition(tabId: string, data: Partial<Types.FieldDefinitionAttributes>) {
        return this.createResource<Types.FieldDefinitionResource>(`/tabs/${tabId}/field_definitions`, data);
    }

    /**
     * Update a field definition
     */
    async updateFieldDefinition(id: string, data: Partial<Types.FieldDefinitionAttributes>) {
        return this.updateResource<Types.FieldDefinitionResource>(`/field_definitions/${id}`, data);
    }

    /**
     * Delete a field definition
     */
    async deleteFieldDefinition(id: string) {
        return this.deleteResource(`/field_definitions/${id}`);
    }

    /**
     * Get field options for a field definition
     */
    async getFieldOptions(fieldDefinitionId: string) {
        return this.getList<Types.FieldOptionResource>(`/field_definitions/${fieldDefinitionId}/field_options`);
    }

    /**
     * Create a field option
     */
    async createFieldOption(fieldDefinitionId: string, data: Types.FieldOptionAttributes) {
        return this.createResource<Types.FieldOptionResource>(`/field_definitions/${fieldDefinitionId}/field_options`, data);
    }

    /**
     * Get person's field data
     */
    async getPersonFieldData(personId: string, options?: FieldDataGetPageOptions) {
        return this.getList<Types.FieldDatumResource, FieldDataGetPageOptions>(`/people/${personId}/field_data`, options);
    }

    /**
     * Set a person's field value with automatic field lookup
     */
    async setPersonField(personId: string, options: FieldSetOptions) {
        const fieldDef = await this.resolveFieldDefinition(options);

        if (!fieldDef) {
            throw new Error(`Field definition not found for: ${options.fieldId || options.fieldSlug || options.fieldName}`);
        }

        return this.createPersonFieldData(personId, fieldDef.id, options.value, {
            handleFileUploads: options.handleFileUploads ?? true,
        });
    }

    /**
     * Set a person's field value by field definition ID
     */
    async setPersonFieldById(personId: string, fieldId: string, value: string) {
        return this.createPersonFieldData(personId, fieldId, value);
    }

    /**
     * Set a person's field value by field slug
     */
    async setPersonFieldBySlug(personId: string, fieldSlug: string, value: string) {
        const fieldDef = await this.getFieldDefinitionBySlug(fieldSlug);

        if (!fieldDef) {
            throw new Error(`Field definition not found for slug: ${fieldSlug}`);
        }

        return this.createPersonFieldData(personId, fieldDef.id, value);
    }

    /**
     * Set a person's field value by field name
     */
    async setPersonFieldByName(personId: string, fieldName: string, value: string) {
        const fieldDef = await this.getFieldDefinitionByName(fieldName);

        if (!fieldDef) {
            throw new Error(`Field definition not found for name: ${fieldName}`);
        }

        return this.createPersonFieldData(personId, fieldDef.id, value);
    }

    /**
     * Find existing field datum for a given field definition from a list response.
     */
    private findExistingFieldDatum(
        existingFieldData: { data: Types.FieldDatumResource[] },
        fieldDefinitionId: string
    ): Types.FieldDatumResource | undefined {
        return existingFieldData.data.find((datum) =>
            this.datumMatchesFieldDefinition(datum, fieldDefinitionId)
        );
    }

    private datumMatchesFieldDefinition(datum: Types.FieldDatumResource, fieldDefinitionId: string): boolean {
        if (this.fieldDefDataMatchesId(datum.field_definition, fieldDefinitionId)) return true;
        const defId = Reflect.get(datum, 'field_definition_id');
        return defId !== undefined && String(defId) === String(fieldDefinitionId);
    }

    private fieldDefDataMatchesId(fieldDefData: object | null | undefined, fieldDefinitionId: string): boolean {
        if (!fieldDefData || Array.isArray(fieldDefData)) return false;
        const id = getStringId(fieldDefData);
        return id !== undefined && String(id) === String(fieldDefinitionId);
    }

    private async createOrUpdateFieldData(
        personId: string,
        fieldDefinitionId: string,
        cleanValue: string,
        existingFieldData: { data: Types.FieldDatumResource[] }
    ) {
        const existingDatum = this.findExistingFieldDatum(existingFieldData, fieldDefinitionId);
        if (existingDatum) {
            return this.updateResource<Types.FieldDatumResource>(`/people/${personId}/field_data/${existingDatum.id}`, { value: cleanValue });
        }
        return this.createResource<Types.FieldDatumResource>(`/people/${personId}/field_data`, {
            field_definition_id: fieldDefinitionId,
            value: cleanValue,
        });
    }

    private async createPersonFieldDataForFile(
        personId: string,
        fieldDefinitionId: string,
        value: string
    ) {
        return this.createPersonFileFieldData(personId, fieldDefinitionId, value);
    }

    private async createPersonFieldDataForText(
        personId: string,
        fieldDefinitionId: string,
        value: string
    ) {
        const cleanValue = isFileUpload(value) ? extractFileUrl(value) : value;
        const existingFieldData = await this.getPersonFieldData(personId, { include: ['field_definition'] });
        return this.createOrUpdateFieldData(personId, fieldDefinitionId, cleanValue, existingFieldData);
    }

    /**
     * Create field data for a person
     */
    async createPersonFieldData(
        personId: string,
        fieldDefinitionId: string,
        value: string,
        options: { handleFileUploads?: boolean } = {}
    ) {
        const handleFileUploads = options.handleFileUploads !== false;
        const fieldDef = await this.getFieldDefinition(fieldDefinitionId);
        const isFileField = fieldDef?.data_type === 'file';

        if (isFileField && handleFileUploads) {
            return this.createPersonFieldDataForFile(personId, fieldDefinitionId, value);
        }
        return this.createPersonFieldDataForText(personId, fieldDefinitionId, value);
    }

    /**
     * Delete person's field data
     */
    async deletePersonFieldData(personId: string, fieldDataId: string) {
        return this.deleteResource(`/people/${personId}/field_data/${fieldDataId}`);
    }

    /**
     * Get all tabs
     */
    async getTabs() {
        return this.getList<Types.TabResource>('/tabs');
    }

    /**
     * Get a single tab by ID
     */
    async getTabById(id: string, options?: TabGetByIdOptions) {
        return this.getSingle<Types.TabResource>(`/tabs/${id}`, options);
    }

    /**
     * Create a tab
     */
    async createTab(data: Types.TabAttributes) {
        return this.createResource<Types.TabResource>('/tabs', data);
    }

    /**
     * Update a tab
     */
    async updateTab(id: string, data: Partial<Types.TabAttributes>) {
        return this.updateResource<Types.TabResource>(`/tabs/${id}`, data);
    }

    /**
     * Delete a tab
     */
    async deleteTab(id: string) {
        return this.deleteResource(`/tabs/${id}`);
    }

    /**
     * Resolve field definition from options
     */
    private async resolveFieldDefinition(options: FieldSetOptions) {
        if (options.fieldId) {
            return this.getFieldDefinition(options.fieldId);
        }

        if (options.fieldSlug) {
            return this.getFieldDefinitionBySlug(options.fieldSlug);
        }

        if (options.fieldName) {
            return this.getFieldDefinitionByName(options.fieldName);
        }

        return null;
    }

    /** Download a file from URL to ArrayBuffer. */
    private async downloadFileToBuffer(url: string): Promise<ArrayBuffer> {
        const res = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'PCO-People-TS/2.0' } });
        if (!res.ok) throw new Error(`Failed to download file: ${res.status} ${res.statusText}`);
        return res.arrayBuffer();
    }

    private async doUploadToPco(formData: FormData): Promise<{ data?: Array<{ id?: string }> }> {
        const res = await fetch('https://upload.planningcenteronline.com/v2/files', {
            method: 'POST',
            headers: {
                Authorization: this.httpClient.getAuthHeader(),
                'User-Agent': 'PCO-People-TS/2.0',
            },
            body: formData,
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`File upload failed: ${res.status} ${res.statusText} - ${text}`);
        }
        return res.json();
    }

    /** Upload file buffer to PCO and return the first file UUID from response. */
    private async uploadBufferToPcoAndGetUuid(buffer: ArrayBuffer, filename: string, mimeType: string): Promise<string> {
        const formData = new FormData();
        formData.append('file', new Blob([buffer], { type: mimeType }), filename);
        const data = await this.doUploadToPco(formData);
        const firstId = data?.data?.[0]?.id;
        if (typeof firstId !== 'string') throw new Error('Failed to get file UUID from upload response');
        return firstId;
    }

    /**
     * Create field data for file uploads
     */
    private async createPersonFileFieldData(
        personId: string,
        fieldDefinitionId: string,
        fileUrl: string
    ) {
        const cleanFileUrl = extractFileUrl(fileUrl);
        const filename = getFilename(cleanFileUrl);
        const mimeType = getMimeType(getFileExtension(cleanFileUrl));
        const fileBuffer = await this.downloadFileToBuffer(cleanFileUrl);
        const fileUUID = await this.uploadBufferToPcoAndGetUuid(fileBuffer, filename, mimeType);
        return this.createResource<Types.FieldDatumResource>(`/people/${personId}/field_data`, {
            field_definition_id: fieldDefinitionId,
            value: fileUUID,
        });
    }

}
