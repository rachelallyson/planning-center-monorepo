/**
 * v2.0.0 Fields API Integration Tests
 * 
 * Tests for the new fields API:
 * - client.fields.getAllFieldDefinitions() with caching
 * - client.fields.setPersonFieldBySlug() with type-safe operations
 * - Field definition caching and validation
 * 
 * To run: npm run test:integration:v2:fields
 */

import {
    PcoClient,
    type PersonAttributes,
} from '../../../src';
import { createTestClient, logAuthStatus } from '../test-config';

// Test configuration
const TEST_PREFIX = 'TEST_V2_FIELDS_2025';

describe('v2.0.0 Fields API Integration Tests', () => {
    let client: PcoClient;
    let testPersonId = '';

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();

        // Add fields-specific event handlers
        client.on('error', () => {
            // Error handling tested elsewhere
        });
    }, 30000);

    afterAll(async () => {
        // Clean up test person
        if (testPersonId) {
            await client.people.delete(testPersonId);
            testPersonId = '';
        }
    }, 30000);

    describe('Field Definitions', () => {
        it('should get all field definitions with caching', async () => {
            const fieldDefs = await client.fields.getAllFieldDefinitions();

            // getAllFieldDefinitions returns PaginationResult with data array
            expect(Array.isArray(fieldDefs.data)).toBe(true);
            expect(fieldDefs.data.length).toBeGreaterThan(0);

            // Validate field definition structure (flattened - attributes are at top level)
            const fieldDef = fieldDefs.data[0];
            expect(fieldDef).toHaveProperty('type', 'FieldDefinition');
            expect(fieldDef).toHaveProperty('id');
            // Attributes are flattened - name, slug, data_type are at top level
            expect(fieldDef).toHaveProperty('name');
            expect(fieldDef).toHaveProperty('slug');
            expect(fieldDef).toHaveProperty('data_type');

            // Test second call - should return same data (excluding timing-dependent fields)
            const startTime = Date.now();
            const secondCallFieldDefs = await client.fields.getAllFieldDefinitions();
            const endTime = Date.now();

            // Compare data arrays (exclude timing-dependent fields like duration)
            expect(secondCallFieldDefs.data).toEqual(fieldDefs.data);
            expect(secondCallFieldDefs.meta?.total_count).toBe(fieldDefs.meta?.total_count);
            expect(endTime - startTime).toBeLessThan(25000); // Allow for API latency
        }, 30000);

        it('should get field definition by ID', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            // getAllFieldDefinitions returns PaginationResult with data array
            expect(allFieldDefs.data.length).toBeGreaterThan(0);

            const firstFieldDef = allFieldDefs.data[0];
            const fieldDef = await client.fields.getFieldDefinition(firstFieldDef.id);

            expect(fieldDef).toBeDefined();
            expect(fieldDef.id).toBe(firstFieldDef.id);
            expect(fieldDef.type).toBe('FieldDefinition');
            // getFieldDefinition returns flattened resource - attributes at top level
            expect(fieldDef).toHaveProperty('name');
        }, 30000);

        it('should get field definition by slug', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
            expect(allFieldDefs.data.length).toBeGreaterThan(0);

            const firstFieldDef = allFieldDefs.data[0];
            if (firstFieldDef.slug) {
                const fieldDef = await client.fields.getFieldDefinitionBySlug(firstFieldDef.slug);

                expect(fieldDef).toBeDefined();
                expect(fieldDef?.id).toBe(firstFieldDef.id);
                expect(fieldDef?.slug).toBe(firstFieldDef.slug);
            }
        }, 30000);

        it('should get field definition by name', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
            expect(allFieldDefs.data.length).toBeGreaterThan(0);

            const firstFieldDef = allFieldDefs.data[0];
            if (firstFieldDef.name) {
                const fieldDef = await client.fields.getFieldDefinitionByName(firstFieldDef.name);

                expect(fieldDef).toBeDefined();
                expect(fieldDef?.id).toBe(firstFieldDef.id);
                expect(fieldDef?.name).toBe(firstFieldDef.name);
            }
        }, 60000);
    });

    describe('Person Field Operations', () => {
        // Track field definition IDs used so each test uses a different field (one datum per person+field_definition)
        const usedFieldIds = new Set<string>();

        beforeEach(async () => {
            // Create a test person for field operations
            if (!testPersonId) {
                const timestamp = Date.now();
                const personData = {
                    first_name: `${TEST_PREFIX}_FieldTest_${timestamp}`,
                    last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                    status: 'active',
                };

                const createResponse = await client.people.create(personData);
                testPersonId = createResponse.id || '';
                expect(testPersonId).toBeTruthy();
            }
        }, 90000);

        function pickUnusedTextField(fieldDefs: { id: string; data_type?: string; slug?: string; name?: string }[], requireSlug?: boolean, requireName?: boolean) {
            const textFields = fieldDefs.filter(field =>
                (field.data_type === 'text' || field.data_type === 'string') &&
                (!requireSlug || field.slug) &&
                (!requireName || field.name) &&
                !usedFieldIds.has(String(field.id))
            );
            const chosen = textFields[0];
            if (chosen) usedFieldIds.add(String(chosen.id));
            return chosen;
        }

        it('should set person field by field ID', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.data.length).toBeGreaterThan(0);

            const textField = pickUnusedTextField(allFieldDefs.data);

            if (textField) {
                const testValue = `Test value ${Date.now()}`;
                const result = await client.fields.setPersonFieldById(
                    testPersonId,
                    textField.id,
                    testValue
                );

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.value).toBe(testValue);
            }
        }, 30000);

        it('should set person field by slug', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.data.length).toBeGreaterThan(0);

            const textField = pickUnusedTextField(allFieldDefs.data, true);

            if (textField && textField.slug) {
                const testValue = `Test slug value ${Date.now()}`;
                const result = await client.fields.setPersonFieldBySlug(
                    testPersonId,
                    textField.slug,
                    testValue
                );

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.value).toBe(testValue);
            }
        }, 60000);

        it('should set person field by name', async () => {
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.data.length).toBeGreaterThan(0);

            const textField = pickUnusedTextField(allFieldDefs.data, false, true);

            if (textField && textField.name) {
                const testValue = `Test name value ${Date.now()}`;
                const result = await client.fields.setPersonFieldByName(
                    testPersonId,
                    textField.name,
                    testValue
                );

                expect(result).toBeDefined();
                expect(result.id).toBeDefined();
                expect(result.value).toBe(testValue);
            }
        }, 60000);

        it('should handle field validation errors', async () => {
            // getAllFieldDefinitions returns PaginationResult with data array
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.data.length).toBeGreaterThan(0);

            // data contains flattened resources - required is at top level
            const requiredField = allFieldDefs.data.find(field =>
                'required' in field && field.required === true
            );

            if (requiredField) {
                // Try to set an empty value for a required field
                await expect(
                    client.fields.setPersonFieldById(
                        testPersonId,
                        requiredField.id,
                        ''
                    )
                ).rejects.toThrow();
            }
        }, 30000);

        it('should handle invalid field ID gracefully', async () => {
            await expect(
                client.fields.setPersonFieldById(
                    testPersonId,
                    'invalid-field-id',
                    'test value'
                )
            ).rejects.toThrow();
        }, 60000);

        it('should handle invalid person ID gracefully', async () => {
            // getAllFieldDefinitions returns PaginationResult with data array
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.data.length).toBeGreaterThan(0);

            const firstFieldDef = allFieldDefs.data[0];
            await expect(
                client.fields.setPersonFieldById(
                    'invalid-person-id',
                    firstFieldDef.id,
                    'test value'
                )
            ).rejects.toThrow();
        }, 60000);
    });

    describe('Field Definition Lookups', () => {
        it('should fetch field definitions from API', async () => {
            // getAllFieldDefinitions returns PaginationResult with data array
            const fieldDefs = await client.fields.getAllFieldDefinitions();
            expect(fieldDefs).toBeDefined();
            expect(Array.isArray(fieldDefs.data)).toBe(true);
        }, 30000);

        it('should lookup field definitions by slug and name', async () => {
            // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.data.length).toBeGreaterThan(0);

            const testField = allFieldDefs.data[0];

            if ('slug' in testField && testField.slug) {
                const fieldBySlug = await client.fields.getFieldDefinitionBySlug(testField.slug);
                expect(fieldBySlug).toBeDefined();
                if (fieldBySlug) {
                    expect(fieldBySlug.id).toBe(testField.id);
                }
            }

            if ('name' in testField && testField.name) {
                const fieldByName = await client.fields.getFieldDefinitionByName(testField.name);
                expect(fieldByName).toBeDefined();
                if (fieldByName) {
                    expect(fieldByName.id).toBe(testField.id);
                }
            }
        }, 120000);
    });

    describe('Field Type Validation', () => {
        beforeEach(async () => {
            // Create a test person for field operations
            if (!testPersonId) {
                const timestamp = Date.now();
                const personData = {
                    first_name: `${TEST_PREFIX}_FieldTest_${timestamp}`,
                    last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                    status: 'active',
                };

                const createResponse = await client.people.create(personData);
                testPersonId = createResponse.id || '';
                expect(testPersonId).toBeTruthy();
            }
        }, 90000);

        it('should validate different field types', async () => {
            expect(testPersonId).toBeTruthy();

            // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
            const allFieldDefs = await client.fields.getAllFieldDefinitions();
            expect(allFieldDefs.data.length).toBeGreaterThan(0);

            // Test different field types (data_type is at top level for flattened resources)
            const textField = allFieldDefs.data.find(field =>
                'data_type' in field && field.data_type === 'text'
            );
            const numberField = allFieldDefs.data.find(field =>
                'data_type' in field && field.data_type === 'number'
            );
            const dateField = allFieldDefs.data.find(field =>
                'data_type' in field && field.data_type === 'date'
            );

            if (textField) {
                const result = await client.fields.setPersonFieldById(
                    testPersonId,
                    textField.id,
                    'Test text value'
                );
                expect(result.value).toBe('Test text value');
            }

            if (numberField) {
                const result = await client.fields.setPersonFieldById(
                    testPersonId,
                    numberField.id,
                    '5'
                );
                // setPersonFieldById returns ResourceObject - value is in attributes
                expect(result.value).toBe('5');
            }

            if (dateField) {
                const result = await client.fields.setPersonFieldById(
                    testPersonId,
                    dateField.id,
                    '2025-01-01'
                );
                // Date fields may be returned in different formats by the API
                expect(result.value).toMatch(/2025-01-01|01\/01\/2025/);
            }
        }, 60000);
    });

    describe('File Upload Functionality', () => {
        it('should upload files to file fields', async () => {
            // Create a test person first
            const timestamp = Date.now();
            const personData = {
                first_name: `${TEST_PREFIX}_FileUpload_${timestamp}`,
                last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                status: 'active',
            };

            const createResponse = await client.people.create(personData);
            const testPersonId = createResponse.id || '';
            expect(testPersonId).toBeTruthy();

            try {
                // Get field definitions to find a file field
                // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
                const fieldDefs = await client.fields.getAllFieldDefinitions();
                const fileField = fieldDefs.data.find(field => 'data_type' in field && field.data_type === 'file');

                expect(fileField).toBeDefined();
                expect(fileField?.id).toBeTruthy();
                if (!fileField) {
                    throw new Error('No file field definition found; create a file-type field in PCO to run this test.');
                }

                // Test with a simple text file that should work
                const testFileUrl = 'https://www.w3.org/TR/2003/REC-PNG-20031110/iso_8859-1.txt';

                const result = await client.fields.createPersonFieldData(
                    testPersonId,
                    fileField.id,
                    testFileUrl
                );

                // Verify the response structure
                expect(result).toBeDefined();
                expect(result.type).toBe('FieldDatum');
                expect(result.id).toBeTruthy();

                // For file fields, the file data is in the 'file' attribute, not 'value'
                expect(result.file).toBeTruthy();
                expect(result.file?.url).toBeTruthy();
                expect(result.file_name).toBe('iso_8859-1.txt');
                expect(result.file_content_type).toBe('text/plain');
                expect(result.file_size).toBeGreaterThan(0);

                // Clean up the field data
                await client.fields.deletePersonFieldData(testPersonId, result.id);
            } finally {
                // Clean up test person
                await client.people.delete(testPersonId);
            }
        }, 60000);

        it('should handle HTML markup with file URLs', async () => {
            // Create a test person first
            const timestamp = Date.now();
            const personData = {
                first_name: `${TEST_PREFIX}_HTMLFile_${timestamp}`,
                last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                status: 'active',
            };

            const createResponse = await client.people.create(personData);
            const testPersonId = createResponse.id || '';
            expect(testPersonId).toBeTruthy();

            try {
                // Get field definitions to find a file field
                // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
                const fieldDefs = await client.fields.getAllFieldDefinitions();
                const fileField = fieldDefs.data.find(field => 'data_type' in field && field.data_type === 'file');

                expect(fileField).toBeDefined();
                expect(fileField?.id).toBeTruthy();
                if (!fileField) {
                    throw new Error('No file field definition found; create a file-type field in PCO to run this test.');
                }

                // Test with HTML markup containing file URL
                const htmlFileValue = '<a href="https://www.w3.org/TR/2003/REC-PNG-20031110/iso_8859-1.txt" download>View File</a>';

                const result = await client.fields.createPersonFieldData(
                    testPersonId,
                    fileField.id,
                    htmlFileValue
                );

                // Verify the response structure
                expect(result).toBeDefined();
                expect(result.type).toBe('FieldDatum');
                expect(result.id).toBeTruthy();

                // For file fields, the file data is in the 'file' attribute, not 'value'
                expect(result.file).toBeTruthy();
                expect(result.file?.url).toBeTruthy();
                expect(result.file_name).toBeTruthy();
                expect(result.file_content_type).toBeTruthy();
                expect(result.file_size).toBeGreaterThan(0);

                // Clean up the field data
                await client.fields.deletePersonFieldData(testPersonId, result.id);
            } finally {
                // Clean up test person
                await client.people.delete(testPersonId);
            }
        }, 120000);

        it('should handle file upload errors gracefully', async () => {
            // Create a test person first
            const timestamp = Date.now();
            const personData = {
                first_name: `${TEST_PREFIX}_ErrorTest_${timestamp}`,
                last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                status: 'active',
            };

            const createResponse = await client.people.create(personData);
            const testPersonId = createResponse.id || '';
            expect(testPersonId).toBeTruthy();

            try {
                // Get field definitions to find a file field
                // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
                const fieldDefs = await client.fields.getAllFieldDefinitions();
                const fileField = fieldDefs.data.find(field => 'data_type' in field && field.data_type === 'file');

                expect(fileField).toBeDefined();
                expect(fileField?.id).toBeTruthy();
                if (!fileField) {
                    throw new Error('No file field definition found; create a file-type field in PCO to run this test.');
                }

                // Test with an invalid file URL
                const invalidFileUrl = 'https://invalid-domain-that-does-not-exist.com/file.txt';

                await expect(
                    client.fields.createPersonFieldData(
                        testPersonId,
                        fileField.id,
                        invalidFileUrl
                    )
                ).rejects.toThrow();
            } finally {
                // Clean up test person
                await client.people.delete(testPersonId);
            }
        }, 60000);
    });
});
