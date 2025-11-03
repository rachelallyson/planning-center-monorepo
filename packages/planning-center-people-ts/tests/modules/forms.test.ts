import { FormsModule } from '../../src/modules/forms';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('FormsModule', () => {
  let module: FormsModule;
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

    module = new FormsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(FormsModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all forms with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Form', attributes: { name: 'Form 1' } }],
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

      const result = await module.getAll();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch forms with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Form', attributes: { name: 'Form 1' } }],
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

      const params = {
        where: { status: 'active' },
        include: ['form_category'],
        per_page: 10,
        page: 1,
      };

      await module.getAll(params);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should fetch form by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Form', attributes: { name: 'Form 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getById('1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should fetch form by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Form', attributes: { name: 'Form 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['form_category']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getFormCategory', () => {
    it('should get form category for a form', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FormCategory', attributes: { name: 'Category 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getFormCategory('form-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getFormFields', () => {
    it('should get form fields for a form', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FormField', attributes: { name: 'Field 1' } }],
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getFormFields('form-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should get form fields with parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FormField', attributes: { name: 'Field 1' } }],
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

      const params = {
        where: { field_type: 'text' },
        include: ['form_field_options'],
        per_page: 10,
        page: 1,
      };

      await module.getFormFields('form-1', params);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getFormFieldOptions', () => {
    it('should get form field options for a form field', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FormFieldOption', attributes: { name: 'Option 1' } }],
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getFormFieldOptions('form-1', 'field-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should get form field options with parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FormFieldOption', attributes: { name: 'Option 1' } }],
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

      const params = {
        per_page: 10,
        page: 1,
      };

      await module.getFormFieldOptions('form-1', 'field-1', params);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getFormSubmissions', () => {
    it('should get form submissions for a form', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FormSubmission', attributes: { submitted_at: '2020-01-01' } }],
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getFormSubmissions('form-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should get form submissions with parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FormSubmission', attributes: { submitted_at: '2023-01-01T10:00:00Z' } }],
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

      const params = {
        where: { status: 'completed' },
        include: ['form_submission_values'],
        per_page: 10,
        page: 1,
      };

      await module.getFormSubmissions('form-1', params);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getFormSubmissionById', () => {
    it('should get form submission by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FormSubmission', attributes: { submitted_at: '2023-01-01T10:00:00Z' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getFormSubmissionById('form-1', 'submission-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should get form submission by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'FormSubmission', attributes: { submitted_at: '2023-01-01T10:00:00Z' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getFormSubmissionById('form-1', 'submission-1', ['form_submission_values']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getFormSubmissionValues', () => {
    it('should get form submission values for a form submission', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FormSubmissionValue', attributes: { value: 'X' } }],
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getFormSubmissionValues('form-1', 'submission-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should get form submission values with parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'FormSubmissionValue', attributes: { value: 'Test Value' } }],
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

      const params = {
        per_page: 10,
        page: 1,
      };

      await module.getFormSubmissionValues('form-1', 'submission-1', params);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });
});
