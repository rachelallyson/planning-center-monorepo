import { 
  deletePersonFieldData,
  getPersonFieldData,
  getFieldDefinitions,
  getFieldDefinition,
  getFieldOptions,
  createFieldOption,
  getTabs,
  createFieldDefinition,
  deleteFieldDefinition,
  createPersonFieldData
} from '../../src/people/fields';
import type { PcoClientState } from '../../src/core';

jest.mock('../../src/core', () => ({
  getList: jest.fn(),
  getSingle: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  del: jest.fn(),
}));
const { getList, getSingle, post, patch, del } = require('../../src/core');

describe('Fields Functions', () => {
  let mockClient: jest.Mocked<PcoClientState>;

  beforeEach(() => {
    mockClient = {
      config: {
        retry: {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
        },
      } as any,
      httpClient: {
        request: jest.fn(),
      } as any,
      paginationHelper: {
        getAllPages: jest.fn(),
        getPage: jest.fn(),
      } as any,
      eventEmitter: {
        emit: jest.fn(),
      } as any,
      rateLimiter: {
        waitForSlot: jest.fn().mockResolvedValue(undefined),
        waitForAvailability: jest.fn().mockResolvedValue(undefined),
      } as any,
    } as any;

    (getList as jest.Mock).mockReset();
    (getSingle as jest.Mock).mockReset();
    (post as jest.Mock).mockReset();
    (patch as jest.Mock).mockReset();
    (del as jest.Mock).mockReset();
  });

  describe('deletePersonFieldData', () => {
    it('should delete person field data', async () => {
      (del as jest.Mock).mockResolvedValueOnce(undefined);

      await deletePersonFieldData(mockClient, 'person-1', 'field-data-1');

      expect(del).toHaveBeenCalled();
    });
  });

  describe('getPersonFieldData', () => {
    it('should fetch person field data', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FieldDatum', attributes: { value: 'Value 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getPersonFieldData(mockClient, 'person-1');

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });
  });

  describe('getFieldDefinitions', () => {
    it('should fetch all field definitions', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FieldDefinition', attributes: { name: 'Field 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getFieldDefinitions(mockClient);

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });
  });

  describe('getFieldDefinition', () => {
    it('should fetch field definition by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldDefinition', attributes: { name: 'Field 1' } },
      };

      (getSingle as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getFieldDefinition(mockClient, '1');

      expect(result).toEqual(mockResponse);
      expect(getSingle).toHaveBeenCalled();
    });
  });

  describe('getFieldOptions', () => {
    it('should fetch field options for a field definition', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FieldOption', attributes: { name: 'Option 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getFieldOptions(mockClient, 'field-1');

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });
  });

  describe('createFieldOption', () => {
    it('should create a new field option', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldOption', attributes: { name: 'New Option' } },
      };

      (post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const optionData = { name: 'New Option' } as any;
      const result = await createFieldOption(mockClient, 'field-1', optionData);

      expect(result).toEqual(mockResponse);
      expect(post).toHaveBeenCalled();
    });
  });

  describe('getTabs', () => {
    it('should get all tabs', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Tab', attributes: { name: 'Tab 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getTabs(mockClient);

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });
  });

  describe('createFieldDefinition', () => {
    it('should create a new field definition', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldDefinition', attributes: { name: 'New Field' } },
      };

      (post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const fieldData = { name: 'New Field', field_type: 'text' } as any;
      const result = await createFieldDefinition(mockClient, 'tab-1', fieldData);

      expect(result).toEqual(mockResponse);
      expect(post).toHaveBeenCalled();
    });
  });

  describe('deleteFieldDefinition', () => {
    it('should delete a field definition', async () => {
      (del as jest.Mock).mockResolvedValueOnce(undefined);

      await deleteFieldDefinition(mockClient, '1');

      expect(del).toHaveBeenCalled();
    });
  });

  describe('createPersonFieldData', () => {
    it('should create person field data', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FieldDatum', attributes: { value: 'Test Value' } },
      };

      (getSingle as jest.Mock).mockResolvedValueOnce({ data: { id: 'field-1', type: 'FieldDefinition', attributes: { data_type: 'string' } } });
      (getList as jest.Mock).mockResolvedValueOnce({ data: [] });
      (post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await createPersonFieldData(mockClient, 'person-1', 'field-1', 'Test Value');

      expect(result).toEqual(mockResponse);
      expect(post).toHaveBeenCalled();
    });
  });
});
