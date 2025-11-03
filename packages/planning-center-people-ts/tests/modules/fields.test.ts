import { FieldsModule } from '../../src/modules/fields';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('FieldsModule', () => {
  let module: FieldsModule;
  let mockHttpClient: jest.Mocked<PcoHttpClient>;
  let mockPaginationHelper: jest.Mocked<PaginationHelper>;
  let mockEventEmitter: jest.Mocked<PcoEventEmitter>;

  beforeEach(() => {
    mockHttpClient = {
      request: jest.fn(),
    } as any;

    mockPaginationHelper = {
      getAllPages: jest.fn(),
      getPage: jest.fn(),
    } as any;

    mockEventEmitter = {
      emit: jest.fn(),
    } as any;

    module = new FieldsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(FieldsModule);
    });
  });

  describe('getAllFieldDefinitions', () => {
    it('should fetch all field definitions', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FieldDefinition', attributes: { name: 'Field 1', slug: 'field-1' } }],
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      const result = await module.getAllFieldDefinitions();

      expect(result).toEqual(mockResponse.data);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/field_definitions', { include: ['tab'] }, undefined);
    });

    it('should use cache when available', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FieldDefinition', attributes: { name: 'Field 1' } }],
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse as any);

      // First call should fetch from API
      await module.getAllFieldDefinitions();
      // Second call should use cache
      const result = await module.getAllFieldDefinitions();

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('getFieldDefinition', () => {
    it('should fetch field definition by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldDefinition', attributes: { name: 'Field 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getFieldDefinition('1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getFieldDefinitionBySlug', () => {
    it('should fetch field definition by slug', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldDefinition', attributes: { name: 'Field 1', slug: 'field-1' } },
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce({ data: [mockResponse.data] } as any);

      const result = await module.getFieldDefinitionBySlug('field-1');

      expect(result).toEqual(mockResponse.data);
    });

    it('should return null when field not found', async () => {
      mockPaginationHelper.getAllPages.mockResolvedValueOnce({ data: [] } as any);

      const result = await module.getFieldDefinitionBySlug('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getFieldDefinitionByName', () => {
    it('should fetch field definition by name', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldDefinition', attributes: { name: 'Field 1', slug: 'field-1' } },
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce({ data: [mockResponse.data] } as any);

      const result = await module.getFieldDefinitionByName('Field 1');

      expect(result).toEqual(mockResponse.data);
    });

    it('should return null when field not found', async () => {
      mockPaginationHelper.getAllPages.mockResolvedValueOnce({ data: [] } as any);

      const result = await module.getFieldDefinitionByName('Nonexistent Field');

      expect(result).toBeNull();
    });
  });

  describe('createFieldDefinition', () => {
    it('should create a new field definition', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldDefinition', attributes: { name: 'New Field' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const fieldData = { name: 'New Field', field_type: 'text' };
      const result = await module.createFieldDefinition('tab-1', fieldData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('updateFieldDefinition', () => {
    it('should update an existing field definition', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldDefinition', attributes: { name: 'Updated Field' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { name: 'Updated Field' };
      const result = await module.updateFieldDefinition('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('deleteFieldDefinition', () => {
    it('should delete a field definition', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.deleteFieldDefinition('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getFieldOptions', () => {
    it('should get field options for a field definition', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FieldOption', attributes: { name: 'Option 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getFieldOptions('field-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('createFieldOption', () => {
    it('should create a new field option', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldOption', attributes: { name: 'New Option' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const optionData = { name: 'New Option' };
      const result = await module.createFieldOption('field-1', optionData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getPersonFieldData', () => {
    it('should get field data for a person', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FieldDatum', attributes: { value: 'Test Value' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getPersonFieldData('person-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('setPersonField', () => {
    it('should set a person field by ID', async () => {
      const fieldDef = { id: 'field-1', type: 'FieldDefinition', attributes: { data_type: 'string', name: 'Field 1', slug: 'field-1' } } as any;
      const mockResponse = {
        data: { id: '1', type: 'FieldDatum', attributes: { value: 'Test Value' } },
      };

      // resolveFieldDefinition -> getFieldDefinition
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: fieldDef },
        status: 200,
        headers: {},
        requestId: 't1',
        duration: 100,
      });
      // createPersonFieldData -> getFieldDefinition
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: fieldDef },
        status: 200,
        headers: {},
        requestId: 't2',
        duration: 100,
      });
      // getPersonFieldData -> empty
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: [] },
        status: 200,
        headers: {},
        requestId: 't3',
        duration: 100,
      });
      // createResource
      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 't4',
        duration: 100,
      });

      const options = {
        fieldId: 'field-1',
        value: 'Test Value',
      };

      const result = await module.setPersonField('person-1', options);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('setPersonFieldById', () => {
    it('should set a person field by field ID', async () => {
      const fieldDef = { id: 'field-1', type: 'FieldDefinition', attributes: { data_type: 'string' } } as any;
      const mockResponse = {
        data: { id: '1', type: 'FieldDatum', attributes: { value: 'Test Value' } },
      };

      // getFieldDefinition
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: fieldDef },
        status: 200,
        headers: {},
        requestId: 't1',
        duration: 100,
      });
      // getPersonFieldData -> empty
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: [] },
        status: 200,
        headers: {},
        requestId: 't2',
        duration: 100,
      });
      // create
      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 't3',
        duration: 100,
      });

      const result = await module.setPersonFieldById('person-1', 'field-1', 'Test Value');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('setPersonFieldBySlug', () => {
    it('should set a person field by field slug', async () => {
      const fieldDefList = { id: 'field-1', type: 'FieldDefinition', attributes: { slug: 'field-slug' } } as any;
      const fieldDef = { id: 'field-1', type: 'FieldDefinition', attributes: { data_type: 'string' } } as any;
      const mockResponse = {
        data: { id: '1', type: 'FieldDatum', attributes: { value: 'Test Value' } },
      };

      // load cache -> slug lookup
      mockPaginationHelper.getAllPages.mockResolvedValueOnce({ data: [fieldDefList] } as any);
      // getFieldDefinition within createPersonFieldData
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: fieldDef },
        status: 200,
        headers: {},
        requestId: 't1',
        duration: 100,
      });
      // getPersonFieldData -> empty
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: [] },
        status: 200,
        headers: {},
        requestId: 't2',
        duration: 100,
      });
      // create
      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 't3',
        duration: 100,
      });

      const result = await module.setPersonFieldBySlug('person-1', 'field-slug', 'Test Value');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('setPersonFieldByName', () => {
    it('should set a person field by field name', async () => {
      const fieldDefList = { id: 'field-1', type: 'FieldDefinition', attributes: { name: 'Field Name' } } as any;
      const fieldDef = { id: 'field-1', type: 'FieldDefinition', attributes: { data_type: 'string' } } as any;
      const mockResponse = {
        data: { id: '1', type: 'FieldDatum', attributes: { value: 'Test Value' } },
      };

      // load cache -> name lookup
      mockPaginationHelper.getAllPages.mockResolvedValueOnce({ data: [fieldDefList] } as any);
      // getFieldDefinition
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: fieldDef },
        status: 200,
        headers: {},
        requestId: 't1',
        duration: 100,
      });
      // getPersonFieldData -> empty
      mockHttpClient.request.mockResolvedValueOnce({
        data: { data: [] },
        status: 200,
        headers: {},
        requestId: 't2',
        duration: 100,
      });
      // create
      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 't3',
        duration: 100,
      });

      const result = await module.setPersonFieldByName('person-1', 'Field Name', 'Test Value');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('deletePersonFieldData', () => {
    it('should delete person field data', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.deletePersonFieldData('person-1', 'field-data-1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getTabs', () => {
    it('should get all tabs', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Tab', attributes: { name: 'Tab 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getTabs();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('createTab', () => {
    it('should create a new tab', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Tab', attributes: { name: 'New Tab' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const tabData = { name: 'New Tab' };
      const result = await module.createTab(tabData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('updateTab', () => {
    it('should update an existing tab', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Tab', attributes: { name: 'Updated Tab' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { name: 'Updated Tab' };
      const result = await module.updateTab('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('deleteTab', () => {
    it('should delete a tab', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.deleteTab('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });
});
