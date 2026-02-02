/**
 * v2.0.0 Fields Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { PcoHttpClient, QueryOptions } from '@rachelallyson/planning-center-base-ts';
import type { PaginationHelper } from '@rachelallyson/planning-center-base-ts';
import type { PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';
import type {
    FieldDefinitionResource,
    FieldDefinitionAttributes,
    FieldDatumResource,
    FieldDatumAttributes,
    FieldDatumRelationshipMap,
    FlattenedFieldDatumResource,
    FieldOptionResource,
    FieldOptionAttributes,
    TabResource,
    TabAttributes,
    Meta,
    TopLevelLinks
} from '../types';
import type { FieldDataOptions, FieldDefinitionListOptions } from '../types/api-options';
import type { FlattenedResource } from '@rachelallyson/planning-center-base-ts';

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
    async getAllFieldDefinitions(options?: FieldDefinitionListOptions) {
        this.debugLog('fields.getAllFieldDefinitions', { options });
        return this.getAllPages<FieldDefinitionResource>('/field_definitions', options);
    }

    /**
     * Get a single field definition by ID
     */
    async getFieldDefinition(id: string) {
        this.debugLog('fields.getFieldDefinition', { id });
        return this.getSingle<FieldDefinitionResource>(`/field_definitions/${id}`);
    }

    /**
     * Get field definition by slug
     */
    async getFieldDefinitionBySlug(slug: string) {
        this.debugLog('fields.getFieldDefinitionBySlug', { slug });
        const allFieldDefinitions = await this.getAllFieldDefinitions();
        type FlattenedFieldDefinition = FlattenedResource<
            FieldDefinitionResource['type'],
            FieldDefinitionAttributes,
            FieldDefinitionResource extends { relationships?: infer R } ? R : never
        >;
        return allFieldDefinitions.data.find((fd: FlattenedFieldDefinition) => fd.slug === slug) || null;
    }

    /**
     * Get field definition by name
     */
    async getFieldDefinitionByName(name: string) {
        this.debugLog('fields.getFieldDefinitionByName', { name });
        const allFieldDefinitions = await this.getAllFieldDefinitions();
        type FlattenedFieldDefinition = FlattenedResource<
            FieldDefinitionResource['type'],
            FieldDefinitionAttributes,
            FieldDefinitionResource extends { relationships?: infer R } ? R : never
        >;
        return allFieldDefinitions.data.find((fd: FlattenedFieldDefinition) => fd.name === name) || null;
    }

    /**
     * Create a field definition
     */
    async createFieldDefinition(tabId: string, data: Partial<FieldDefinitionAttributes>) {
        this.debugLog('fields.createFieldDefinition', { tabId, data });
        return this.createResource<FieldDefinitionResource>(`/tabs/${tabId}/field_definitions`, data);
    }

    /**
     * Update a field definition
     */
    async updateFieldDefinition(id: string, data: Partial<FieldDefinitionAttributes>) {
        this.debugLog('fields.updateFieldDefinition', { id, data });
        return this.updateResource<FieldDefinitionResource>(`/field_definitions/${id}`, data);
    }

    /**
     * Delete a field definition
     */
    async deleteFieldDefinition(id: string) {
        this.debugLog('fields.deleteFieldDefinition', { id });
        return this.deleteResource(`/field_definitions/${id}`);
    }

    /**
     * Get field options for a field definition
     */
    async getFieldOptions(fieldDefinitionId: string) {
        this.debugLog('fields.getFieldOptions', { fieldDefinitionId });
        return this.getList<FieldOptionResource>(`/field_definitions/${fieldDefinitionId}/field_options`);
    }

    /**
     * Create a field option
     */
    async createFieldOption(fieldDefinitionId: string, data: FieldOptionAttributes) {
        this.debugLog('fields.createFieldOption', { fieldDefinitionId, data });
        return this.createResource<FieldOptionResource>(`/field_definitions/${fieldDefinitionId}/field_options`, data);
    }

    /**
     * Get person's field data
     */
    async getPersonFieldData(personId: string, options?: FieldDataOptions): Promise<{
        data: FlattenedFieldDatumResource[];
        meta?: Meta;
        links?: TopLevelLinks;
    }> {
        this.debugLog('fields.getPersonFieldData', { personId, options });
        return this.getList<FieldDatumResource, FieldDatumRelationshipMap>(`/people/${personId}/field_data`, options as QueryOptions);
    }

    /**
     * Set a person's field value with automatic field lookup
     */
    async setPersonField(personId: string, options: FieldSetOptions) {
        this.debugLog('fields.setPersonField', { personId, options });
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
        this.debugLog('fields.setPersonFieldById', { personId, fieldId });
        return this.createPersonFieldData(personId, fieldId, value);
    }

    /**
     * Set a person's field value by field slug
     */
    async setPersonFieldBySlug(personId: string, fieldSlug: string, value: string) {
        this.debugLog('fields.setPersonFieldBySlug', { personId, fieldSlug, value });
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
        this.debugLog('fields.setPersonFieldByName', { personId, fieldName, value });
        const fieldDef = await this.getFieldDefinitionByName(fieldName);

        if (!fieldDef) {
            throw new Error(`Field definition not found for name: ${fieldName}`);
        }

        return this.createPersonFieldData(personId, fieldDef.id, value);
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
        this.debugLog('fields.createPersonFieldData', { personId, fieldDefinitionId, options });
        const { handleFileUploads = true } = options;

        // Get field definition to determine type
        const fieldDef = await this.getFieldDefinition(fieldDefinitionId);

        // Check if this is a file field and handle accordingly
        if (fieldDef && (fieldDef).data_type === 'file' && handleFileUploads) {
            return this.createPersonFileFieldData(personId, fieldDefinitionId, value);
        }

        // For text fields, clean the value if it's a file URL
        const cleanValue = this.isFileUrl(value) ? this.extractFileUrl(value) : value;

        // Check if field data already exists for this person and field
        // Per test construction standards, we should fail explicitly if something is wrong
        const existingFieldData = await this.getPersonFieldData(personId, {include: ['field_definition']});
        const existingDatum = existingFieldData.data.find(
            datum => {
                // Check the relationship field_definition first
                // When include: ['field_definition'] is used, this should be a full resource object
                // When not included, it might be a ResourceIdentifier with just {type, id}
                const fieldDefData = datum.field_definition;
                if (fieldDefData && typeof fieldDefData === 'object' && 'id' in fieldDefData) {
                    // Compare as strings to handle number/string ID mismatches
                    return String((fieldDefData as { id: string }).id) === String(fieldDefinitionId);
                }
                // Fallback: check if field_definition_id is available as an attribute
                // (some API responses might include this even though it's not in the type definition)
                if ('field_definition_id' in datum && datum.field_definition_id !== undefined) {
                    return String(datum.field_definition_id) === String(fieldDefinitionId);
                }
                return false;
            }
        );

        if (existingDatum) {
            // Update existing field data
            return this.updateResource<FieldDatumResource>(
                `/people/${personId}/field_data/${existingDatum.id}`,
                { value: cleanValue }
            );
        }

        return this.createResource<FieldDatumResource>(`/people/${personId}/field_data`, {
            field_definition_id: fieldDefinitionId,
            value: cleanValue,
        });
    }

    /**
     * Delete person's field data
     */
    async deletePersonFieldData(personId: string, fieldDataId: string) {
        this.debugLog('fields.deletePersonFieldData', { personId, fieldDataId });
        return this.deleteResource(`/people/${personId}/field_data/${fieldDataId}`);
    }

    /**
     * Get all tabs
     */
    async getTabs() {
        this.debugLog('fields.getTabs');
        return this.getList<TabResource>('/tabs');
    }

    /**
     * Get a single tab by ID
     */
    async getTabById(id: string, include?: string[]) {
        this.debugLog('fields.getTabById', { id, include });
        return this.getSingle<TabResource>(`/tabs/${id}`, include);
    }

    /**
     * Create a tab
     */
    async createTab(data: TabAttributes) {
        this.debugLog('fields.createTab', { data });
        return this.createResource<TabResource>('/tabs', data);
    }

    /**
     * Update a tab
     */
    async updateTab(id: string, data: Partial<TabAttributes>) {
        this.debugLog('fields.updateTab', { id, data });
        return this.updateResource<TabResource>(`/tabs/${id}`, data);
    }

    /**
     * Delete a tab
     */
    async deleteTab(id: string) {
        this.debugLog('fields.deleteTab', { id });
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

    /**
     * Create field data for file uploads
     */
    private async createPersonFileFieldData(
        personId: string,
        fieldDefinitionId: string,
        fileUrl: string
    ) {
        try {
            // Extract clean URL from HTML markup if needed
            const cleanFileUrl = this.extractFileUrl(fileUrl);

            // Extract filename and extension
            const filename = this.getFilename(cleanFileUrl);
            const extension = this.getFileExtension(cleanFileUrl);
            const mimeType = this.getMimeType(extension);

            // Download the file from the provided URL
            const fileResponse = await fetch(cleanFileUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'PCO-People-TS/2.0',
                },
            });

            if (!fileResponse.ok) {
                throw new Error(`Failed to download file: ${fileResponse.status} ${fileResponse.statusText}`);
            }

            const fileBuffer = await fileResponse.arrayBuffer();

            // Create FormData for upload
            const formData = new FormData();
            const fileBlob = new Blob([fileBuffer], { type: mimeType });
            formData.append('file', fileBlob, filename);

            // Upload to PCO's upload service
            const uploadResponse = await fetch('https://upload.planningcenteronline.com/v2/files', {
                method: 'POST',
                headers: {
                    'Authorization': this.httpClient.getAuthHeader(),
                    'User-Agent': 'PCO-People-TS/2.0',
                },
                body: formData,
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`File upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
            }

            const uploadData = await uploadResponse.json();
            const fileUUID = uploadData?.data?.[0]?.id;

            if (!fileUUID) {
                throw new Error('Failed to get file UUID from upload response');
            }

            // Create field data using the file UUID
            return this.createResource<FieldDatumResource>(`/people/${personId}/field_data`, {
                field_definition_id: fieldDefinitionId,
                value: fileUUID,
            });

        } catch (error) {
            // Emit error event for monitoring
            this.eventEmitter.emit({
                type: 'error',
                error: error as Error,
                operation: 'createPersonFileFieldData',
                timestamp: new Date().toISOString(),
            });
            throw error;
        }
    }

    /**
     * Check if a value is a file URL
     */
    private isFileUrl(value: string) {
        return value.includes('s3.') || value.includes('amazonaws.com') || value.includes('<a href=');
    }

    /**
     * Extract file URL from HTML markup
     */
    private extractFileUrl(value: string) {
        if (value.startsWith('http') && !value.includes('<')) {
            return value;
        }

        const hrefMatch = /href=["']([^"']+)["']/.exec(value);
        if (hrefMatch) {
            return hrefMatch[1];
        }

        const urlMatch = /(https?:\/\/[^\s<>"']+)/.exec(value);
        if (urlMatch) {
            return urlMatch[1];
        }

        return value;
    }

    /**
     * Get filename from URL
     */
    private getFilename(url: string) {
        const cleanUrl = this.extractFileUrl(url);
        const urlParts = cleanUrl.split('/');
        return urlParts[urlParts.length - 1] || 'file';
    }

    /**
     * Get file extension from URL
     */
    private getFileExtension(url: string) {
        const filename = this.getFilename(url);
        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1).toLowerCase() : '';
    }

    /**
     * Get MIME type from file extension
     */
    private getMimeType(extension: string) {
        const mimeTypes: Record<string, string> = {
            csv: 'text/csv',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            gif: 'image/gif',
            jpeg: 'image/jpeg',
            jpg: 'image/jpeg',
            pdf: 'application/pdf',
            png: 'image/png',
            txt: 'text/plain',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };

        return mimeTypes[extension] || 'application/octet-stream';
    }
}
