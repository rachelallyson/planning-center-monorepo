import { PcoClient } from '../../src';
import { createTestClient } from '../integration/test-config';

function isStringOrTextType(dataType: string | undefined): boolean {
  return dataType === 'string' || dataType === 'text' || dataType === undefined || dataType !== 'date';
}

function hasSlugOrName(f: Record<string, string | undefined>): boolean {
  const keys: Array<'slug' | 'name'> = ['slug', 'name'];
  for (const key of keys) {
    if (key in f && f[key]) return true;
  }
  return false;
}

function fieldAcceptsStringValues(f: Record<string, string | undefined>): boolean {
  const dataType = 'data_type' in f ? f.data_type : undefined;
  return hasSlugOrName(f) && isStringOrTextType(dataType);
}

describe('FieldsModule - Real Integration Tests', () => {
  let client: PcoClient;
  let testPersonId: string | null = null;
  let testTabId: string | null = null;
  let testFieldDataId: string | null = null;
  let testFieldDefinitionId: string | null = null;
  // Track which field definitions are used by which tests to avoid conflicts
  const usedFieldIds: Set<string> = new Set();

  beforeAll(async () => {
    client = createTestClient();

    // Create a test person for field operations
    const timestamp = Date.now();
    const person = await client.people.create({
      first_name: `Test_Fields_${timestamp}`,
      last_name: `Person_${timestamp}`,
      status: 'active',
    });
    // create() returns ResourceObject which should have id property
    if (!person || !person.id) {
      throw new Error('Failed to create test person: API returned invalid response');
    }
    testPersonId = person.id;

    // Get a tab ID for field definition operations
    const tabsResponse = await client.fields.getTabs();
    expect(tabsResponse.data.length).toBeGreaterThan(0);
    testTabId = tabsResponse.data[0].id;
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    if (testFieldDataId && testPersonId) {
      await client.fields.deletePersonFieldData(testPersonId, testFieldDataId);
    }
    if (testFieldDefinitionId && testTabId) {
      await client.fields.deleteFieldDefinition(testFieldDefinitionId);
    }
    expect(testPersonId).toBeDefined();
    await client.people.delete(testPersonId!);
  }, 120000);

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(client).toBeDefined();
      expect(client.fields).toBeDefined();
    });
  });

  describe('getAllFieldDefinitions', () => {
    it('should fetch all field definitions', async () => {
      const result = await client.fields.getAllFieldDefinitions();

      // getAllFieldDefinitions returns PaginationResult with data array
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('type');
      expect(result.data[0].type).toBe('FieldDefinition');
    }, 30000);

    it('should fetch field definitions with custom include', async () => {
      // getAllFieldDefinitions accepts FieldDefinitionGetPageOptions, not include array
      const result = await client.fields.getAllFieldDefinitions({
        include: ['tab', 'field_options']
      });

      // getAllFieldDefinitions returns PaginationResult with data array
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getFieldDefinition', () => {
    it('should fetch field definition by ID', async () => {
      // First get a field definition ID
      // getAllFieldDefinitions returns PaginationResult with data array
      const fieldsResponse = await client.fields.getAllFieldDefinitions();
      expect(fieldsResponse.data.length).toBeGreaterThan(0);
      const fieldId = fieldsResponse.data[0].id;

      const result = await client.fields.getFieldDefinition(fieldId);

      expect(result).toBeDefined();
      expect(result.id).toBe(fieldId);
      expect(result.type).toBe('FieldDefinition');
      expect(result).toHaveProperty('name');
    }, 30000);
  });

  describe('getFieldDefinitionBySlug', () => {
    it('should fetch field definition by slug', async () => {
      // First get a field definition with a slug
      // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
      const fieldsResponse = await client.fields.getAllFieldDefinitions();
      expect(fieldsResponse.data.length).toBeGreaterThan(0);
      const fieldWithSlug = fieldsResponse.data.find(f => f.slug);
      expect(fieldWithSlug).toBeDefined();
      expect(fieldWithSlug?.slug).toBeDefined();
      const slug = fieldWithSlug!.slug!;

      const result = await client.fields.getFieldDefinitionBySlug(slug);

      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBe(fieldWithSlug!.id);
        // getFieldDefinitionBySlug returns flattened resource - slug is at top level
        if ('slug' in result) {
          expect(result.slug).toBe(slug);
        }
      }
    }, 60000);
  });

  describe('getFieldDefinitionByName', () => {
    it('should fetch field definition by name', async () => {
      // First get a field definition with a name
      // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
      const fieldsResponse = await client.fields.getAllFieldDefinitions();
      expect(fieldsResponse.data.length).toBeGreaterThan(0);
      const fieldWithName = fieldsResponse.data.find(f => 'name' in f && f.name);
      expect(fieldWithName).toBeDefined();
      if (fieldWithName && 'name' in fieldWithName) {
        expect(fieldWithName.name).toBeDefined();
        const name = fieldWithName.name;

        const result = await client.fields.getFieldDefinitionByName(name);

        expect(result).toBeDefined();
        if (result) {
          expect(result.id).toBe(fieldWithName.id);
          // getFieldDefinitionByName returns flattened resource - name is at top level
          if ('name' in result) {
            expect(result.name).toBe(name);
          }
        }
      }
    }, 30000);
  });

  describe('createFieldDefinition', () => {
    it('should create a new field definition', async () => {
      expect(testTabId).toBeDefined();
      expect(testTabId).toBeTruthy();

      const timestamp = Date.now();
      const fieldData = {
        name: `Test Field ${timestamp}`,
        slug: `test-field-${timestamp}`,
        data_type: 'string',
      };
      expect(testTabId).toBeDefined();
      const result = await client.fields.createFieldDefinition(testTabId!, fieldData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('FieldDefinition');
      expect(result.name).toBe(fieldData.name);

      testFieldDefinitionId = result.id || null;
    }, 30000);
  });

  describe('updateFieldDefinition', () => {
    it('should update an existing field definition', async () => {
      expect(testTabId).toBeDefined();
      // Create a test field definition first
      const timestamp = Date.now();
      const fieldData = {
        name: `Test Update ${timestamp}`,
        slug: `test-update-${timestamp}`,
        data_type: 'string',
      };
      const created = await client.fields.createFieldDefinition(testTabId!, fieldData);
      const fieldDefinitionId = created.id!;

      expect(fieldDefinitionId).toBeDefined();

      const updateData = { name: 'Updated Field Name' };
      const result = await client.fields.updateFieldDefinition(fieldDefinitionId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(fieldDefinitionId);
      expect(result.name).toBe('Updated Field Name');
    }, 30000);
  });

  describe('deleteFieldDefinition', () => {
    it('should delete a field definition', async () => {
      expect(testTabId).toBeDefined();

      // Create a field definition to delete
      const timestamp = Date.now();
      const fieldData = {
        name: `Test Delete ${timestamp}`,
        slug: `test-delete-${timestamp}`,
        data_type: 'string',
      };
      const created = await client.fields.createFieldDefinition(testTabId!, fieldData);
      const fieldIdToDelete = created.id ?? '';

      // Delete the field definition
      await expect(client.fields.deleteFieldDefinition(fieldIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.fields.getFieldDefinition(fieldIdToDelete)).rejects.toThrow();
    }, 30000);
  });

  describe('getFieldOptions', () => {
    it('should get field options for a field definition', async () => {
      // First get a field definition ID
      // getAllFieldDefinitions returns PaginationResult with data array
      const fieldsResponse = await client.fields.getAllFieldDefinitions();
      expect(fieldsResponse.data.length).toBeGreaterThan(0);
      const fieldId = fieldsResponse.data[0].id;

      const result = await client.fields.getFieldOptions(fieldId);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('createFieldOption', () => {
    it('should create a field option', async () => {
      // First get a field definition ID
      // getAllFieldDefinitions returns PaginationResult with data array
      const fieldsResponse = await client.fields.getAllFieldDefinitions();
      expect(fieldsResponse.data.length).toBeGreaterThan(0);
      const fieldId = fieldsResponse.data[0].id;

      const timestamp = Date.now();
      const optionData = {
        value: `Test Option ${timestamp}`,
        sequence: 1,
      };
      const result = await client.fields.createFieldOption(fieldId, optionData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('FieldOption');
      expect(result.value).toBe(optionData.value);
    }, 30000);
  });

  describe('getPersonFieldData', () => {
    it('should get person field data', async () => {
      expect(testPersonId).toBeDefined();

      const result = await client.fields.getPersonFieldData(testPersonId!);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('setPersonField', () => {
    it('should set person field by field ID', async () => {
      expect(testPersonId).toBeDefined();

      // First get a field definition ID that accepts string values (not date)
      // getAllFieldDefinitions returns PaginationResult with data array
      const fieldsResponse = await client.fields.getAllFieldDefinitions();
      expect(fieldsResponse.data.length).toBeGreaterThan(0);
      // Find a string or text field (not date)
      // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
      const stringField = fieldsResponse.data.find(f => {
        const dataType = 'data_type' in f ? f.data_type : undefined;
        return dataType === 'string' ||
          dataType === 'text' ||
          (!dataType || dataType !== 'date');
      });
      expect(stringField).toBeDefined();
      const fieldId = stringField!.id;
      usedFieldIds.add(fieldId);

      const result = await client.fields.setPersonField(testPersonId!, {
        fieldId: fieldId,
        value: `Test Value ${Date.now()}`,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('FieldDatum');

      testFieldDataId = result.id || null;
    }, 30000);
  });

  describe('setPersonFieldById', () => {
    it('should set person field by field ID', async () => {
      expect(testPersonId).toBeDefined();

      // First get a field definition ID that accepts string values
      // getAllFieldDefinitions returns PaginationResult with data array
      const fieldsResponse = await client.fields.getAllFieldDefinitions();
      expect(fieldsResponse.data.length).toBeGreaterThan(0);
      // Find string or text fields (not date) - use first one for this test
      // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
      const stringFields = fieldsResponse.data.filter(f => {
        const dataType = 'data_type' in f ? f.data_type : undefined;
        return dataType === 'string' ||
          dataType === 'text' ||
          (!dataType || dataType !== 'date');
      });
      expect(stringFields.length).toBeGreaterThan(0);
      // Find a field that hasn't been used by other tests to avoid conflicts
      const availableField = stringFields.find(f => !usedFieldIds.has(f.id));
      const fieldId = availableField ? availableField.id : stringFields[0].id;
      usedFieldIds.add(fieldId);

      // Check if field data exists and delete it first to ensure clean state
      // Must include field_definition to properly check for existing data
      const existingFieldData = await client.fields.getPersonFieldData(testPersonId!, { include: ['field_definition'] });
      const existingDatum = existingFieldData.data.find(d => {
        const fieldDefData = d.field_definition;
        // Compare as strings to handle number/string ID mismatches
        return fieldDefData && typeof fieldDefData === 'object' && 'id' in fieldDefData && String(fieldDefData.id) === String(fieldId);
      });
      if (existingDatum) {
        await client.fields.deletePersonFieldData(testPersonId!, existingDatum.id);
        // Wait for API to process deletion and verify it's gone
        await new Promise(resolve => setTimeout(resolve, 2000));
        const verifyDeleted = await client.fields.getPersonFieldData(testPersonId!, { include: ['field_definition'] });
        const stillExists = verifyDeleted.data.find(d => {
          const fieldDefData = d.field_definition;
          // Compare as strings to handle number/string ID mismatches
          return fieldDefData && typeof fieldDefData === 'object' && 'id' in fieldDefData && String(fieldDefData.id) === String(fieldId);
        });
        if (stillExists) {
          throw new Error(`Field data for field ${fieldId} still exists after deletion - API indexing delay or deletion failed`);
        }
      }

      const result = await client.fields.setPersonFieldById(testPersonId!, fieldId, `Test Value ${Date.now()}`);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('FieldDatum');
    }, 30000);
  });

  describe('setPersonFieldBySlug', () => {
    it('should set person field by field slug', async () => {
      expect(testPersonId).toBeDefined();

      // First get a field definition with a slug that accepts string values
      const fieldsResponse = await client.fields.getAllFieldDefinitions();
      const fieldsWithSlug = fieldsResponse.data.filter(fieldAcceptsStringValues);
      expect(fieldsWithSlug.length).toBeGreaterThan(0);
      // Pick a field not yet used by other tests to avoid conflicts
      const fieldWithSlug = fieldsWithSlug.find(f => !usedFieldIds.has(f.id)) ?? fieldsWithSlug[0];
      expect(fieldWithSlug).toBeDefined();
      expect('slug' in fieldWithSlug).toBe(true);
      expect(fieldWithSlug.slug).toBeDefined();
      const slug = fieldWithSlug.slug!;
      const fieldId = fieldWithSlug.id;
      usedFieldIds.add(fieldId);

      // Check if field data exists and delete it first to ensure clean state
      // Must include field_definition to properly check for existing data
      const existingFieldData = await client.fields.getPersonFieldData(testPersonId!, { include: ['field_definition'] });
      const existingDatum = existingFieldData.data.find(d => {
        const fieldDefData = d.field_definition;
        // Compare as strings to handle number/string ID mismatches
        return fieldDefData && typeof fieldDefData === 'object' && 'id' in fieldDefData && String(fieldDefData.id) === String(fieldId);
      });
      if (existingDatum) {
        await client.fields.deletePersonFieldData(testPersonId!, existingDatum.id);
        // Wait for API to process deletion and verify it's gone
        await new Promise(resolve => setTimeout(resolve, 2000));
        const verifyDeleted = await client.fields.getPersonFieldData(testPersonId!, { include: ['field_definition'] });
        const stillExists = verifyDeleted.data.find(d => {
          const fieldDefData = d.field_definition;
          // Compare as strings to handle number/string ID mismatches
          return fieldDefData && typeof fieldDefData === 'object' && 'id' in fieldDefData && String(fieldDefData.id) === String(fieldId);
        });
        if (stillExists) {
          throw new Error(`Field data for field ${fieldId} still exists after deletion - API indexing delay or deletion failed`);
        }
      }

      const result = await client.fields.setPersonFieldBySlug(testPersonId!, slug, `Test Value ${Date.now()}`);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('FieldDatum');
    }, 60000);
  });

  describe('setPersonFieldByName', () => {
    it('should set person field by field name', async () => {
      expect(testPersonId).toBeDefined();

      // First get a field definition with a name that accepts string values
      const fieldsResponse = await client.fields.getAllFieldDefinitions();
      const fieldsWithName = fieldsResponse.data.filter(fieldAcceptsStringValues);
      expect(fieldsWithName.length).toBeGreaterThan(0);
      // Pick a field not yet used by other tests to avoid conflicts
      const fieldWithName = fieldsWithName.find(f => !usedFieldIds.has(f.id)) ?? fieldsWithName[0];
      expect(fieldWithName).toBeDefined();
      expect('name' in fieldWithName).toBe(true);
      expect(fieldWithName.name).toBeDefined();
      const name = fieldWithName.name!;
      const fieldId = fieldWithName.id;
      usedFieldIds.add(fieldId);

      // Check if field data already exists and delete it first to avoid conflicts
      // Must include field_definition to properly check for existing data
      const existingFieldData = await client.fields.getPersonFieldData(testPersonId!, { include: ['field_definition'] });
      const existingDatum = existingFieldData.data.find(d => {
        const fieldDefData = d.field_definition;
        // Compare as strings to handle number/string ID mismatches
        return fieldDefData && typeof fieldDefData === 'object' && 'id' in fieldDefData && String(fieldDefData.id) === String(fieldId);
      });
      if (existingDatum) {
        await client.fields.deletePersonFieldData(testPersonId!, existingDatum.id);
        // Wait for API to process deletion and verify it's gone
        await new Promise(resolve => setTimeout(resolve, 2000));
        const verifyDeleted = await client.fields.getPersonFieldData(testPersonId!, { include: ['field_definition'] });
        const stillExists = verifyDeleted.data.find(d => {
          const fieldDefData = d.field_definition;
          // Compare as strings to handle number/string ID mismatches
          return fieldDefData && typeof fieldDefData === 'object' && 'id' in fieldDefData && String(fieldDefData.id) === String(fieldId);
        });
        if (stillExists) {
          throw new Error(`Field data for field ${fieldId} still exists after deletion - API indexing delay or deletion failed`);
        }
      }

      const result = await client.fields.setPersonFieldByName(testPersonId!, name, `Test Value ${Date.now()}`);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('FieldDatum');
    }, 60000);
  });

  describe('createPersonFieldData', () => {
    it('should create person field data', async () => {
      expect(testPersonId).toBeDefined();

      // First get a field definition ID that accepts string values
      // getAllFieldDefinitions returns PaginationResult with data array
      const fieldsResponse = await client.fields.getAllFieldDefinitions();
      expect(fieldsResponse.data.length).toBeGreaterThan(0);
      // Find a string or text field (not date) - use a different one than other tests
      // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
      const stringFields = fieldsResponse.data.filter(f => {
        const dataType = 'data_type' in f ? f.data_type : undefined;
        return dataType === 'string' ||
          dataType === 'text' ||
          (!dataType || dataType !== 'date');
      });
      expect(stringFields.length).toBeGreaterThan(0);
      // Pick a field not yet used by other tests to avoid conflicts
      const stringField = stringFields.find(f => !usedFieldIds.has(f.id)) ?? stringFields[0];
      const fieldId = stringField.id;
      usedFieldIds.add(fieldId);

      // Check if field data exists and delete it first to ensure clean state
      // Must include field_definition to properly check for existing data
      const existingFieldData = await client.fields.getPersonFieldData(testPersonId!, { include: ['field_definition'] });
      const existingDatum = existingFieldData.data.find(d => {
        const fieldDefData = d.field_definition;
        // Compare as strings to handle number/string ID mismatches
        return fieldDefData && typeof fieldDefData === 'object' && 'id' in fieldDefData && String(fieldDefData.id) === String(fieldId);
      });
      if (existingDatum) {
        await client.fields.deletePersonFieldData(testPersonId!, existingDatum.id);
        // Wait for API to process deletion and verify it's gone
        await new Promise(resolve => setTimeout(resolve, 2000));
        const verifyDeleted = await client.fields.getPersonFieldData(testPersonId!, { include: ['field_definition'] });
        const stillExists = verifyDeleted.data.find(d => {
          const fieldDefData = d.field_definition;
          // Compare as strings to handle number/string ID mismatches
          return fieldDefData && typeof fieldDefData === 'object' && 'id' in fieldDefData && String(fieldDefData.id) === String(fieldId);
        });
        if (stillExists) {
          throw new Error(`Field data for field ${fieldId} still exists after deletion - API indexing delay or deletion failed`);
        }
      }

      const result = await client.fields.createPersonFieldData(
        testPersonId!,
        fieldId,
        `Test Field Data ${Date.now()}`
      );

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('FieldDatum');
    }, 30000);
  });

  describe('deletePersonFieldData', () => {
    it('should delete person field data', async () => {
      expect(testPersonId).toBeDefined();

      // First get a field definition ID that accepts string values
      // getAllFieldDefinitions returns PaginationResult with data array
      const fieldsResponse = await client.fields.getAllFieldDefinitions();
      expect(fieldsResponse.data.length).toBeGreaterThan(0);
      // Find string or text fields (not date) - use a different one than other tests
      // getAllFieldDefinitions returns PaginationResult with data array (flattened resources)
      const stringFields = fieldsResponse.data.filter(f => {
        const dataType = 'data_type' in f ? f.data_type : undefined;
        return dataType === 'string' ||
          dataType === 'text' ||
          (!dataType || dataType !== 'date');
      });
      expect(stringFields.length).toBeGreaterThan(0);
      // Pick a field not yet used by other tests to avoid conflicts
      const stringField = stringFields.find(f => !usedFieldIds.has(f.id)) ?? stringFields[0];
      const fieldId = stringField.id;
      usedFieldIds.add(fieldId);

      // Check if field data already exists and delete it first to ensure clean state
      const existingFieldData = await client.fields.getPersonFieldData(testPersonId!, { include: ['field_definition'] });
      const existingDatum = existingFieldData.data.find(d => {
        const fieldDefData = d.field_definition;
        return fieldDefData && typeof fieldDefData === 'object' && 'id' in fieldDefData && String(fieldDefData.id) === String(fieldId);
      });
      if (existingDatum) {
        await client.fields.deletePersonFieldData(testPersonId!, existingDatum.id);
        // Wait for API to process deletion
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Create field data to delete
      const created = await client.fields.createPersonFieldData(
        testPersonId!,
        fieldId,
        `Test Delete ${Date.now()}`
      );
      const fieldDataIdToDelete = created.id || '';

      // Delete the field data
      await expect(client.fields.deletePersonFieldData(testPersonId!, fieldDataIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted
      const allFieldData = await client.fields.getPersonFieldData(testPersonId!);
      const dataExists = allFieldData.data.some(d => d.id === fieldDataIdToDelete);
      expect(dataExists).toBe(false);
    }, 30000);
  });

  describe('getTabs', () => {
    it('should get all tabs', async () => {
      const result = await client.fields.getTabs();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('getTabById', () => {
    it('should get tab by ID', async () => {
      // First get a tab ID
      const tabsResponse = await client.fields.getTabs();
      expect(tabsResponse.data.length).toBeGreaterThan(0);
      const tabId = tabsResponse.data[0].id;

      const result = await client.fields.getTabById(tabId);

      expect(result).toBeDefined();
      expect(result.id).toBe(tabId);
      expect(result.type).toBe('Tab');
      expect(result).toHaveProperty('name');
    }, 30000);
  });

  describe('createTab', () => {
    it('should create a new tab', async () => {
      const timestamp = Date.now();
      const tabData = {
        name: `Test Tab ${timestamp}`,
        sequence: 999,
      };
      const result = await client.fields.createTab(tabData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('Tab');
      expect(result.name).toBe(tabData.name);

      // Cleanup
      await client.fields.deleteTab(result.id);
    }, 30000);
  });

  describe('updateTab', () => {
    it('should update an existing tab', async () => {
      // Create a tab to update
      const timestamp = Date.now();
      const tabData = {
        name: `Test Update ${timestamp}`,
        sequence: 999,
      };
      const created = await client.fields.createTab(tabData);
      const tabId = created.id || '';

      const uniqueSuffix = `${timestamp}_${Math.random().toString(36).slice(2, 9)}`;
      const updateData = { name: `Updated_Tab_${uniqueSuffix}` };
      const result = await client.fields.updateTab(tabId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(tabId);
      expect(result.name).toBe(updateData.name);

      // Cleanup
      await client.fields.deleteTab(tabId);
    }, 30000);
  });

  describe('deleteTab', () => {
    it('should delete a tab', async () => {
      // Create a tab to delete
      const timestamp = Date.now();
      const tabData = {
        name: `Test Delete ${timestamp}`,
        sequence: 999,
      };
      const created = await client.fields.createTab(tabData);
      const tabIdToDelete = created.id || '';

      // Delete the tab
      await expect(client.fields.deleteTab(tabIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.fields.getTabById(tabIdToDelete)).rejects.toThrow();
    }, 30000);
  });
});
