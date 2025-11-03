import { NotesModule } from '../../src/modules/notes';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('NotesModule', () => {
  let module: NotesModule;
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

    module = new NotesModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(NotesModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all notes with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Note', attributes: { content: 'Note 1' } }],
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

    it('should fetch notes with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Note', attributes: { content: 'Note 1' } }],
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

      const options = {
        where: { status: 'active' },
        include: ['note_category'],
        perPage: 10,
        page: 1,
      };

      await module.getAll(options);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAllPagesPaginated', () => {
    it('should get all notes with pagination', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Note', attributes: { content: 'Note 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const result = await module.getAllPagesPaginated();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/notes', {}, undefined);
    });

    it('should get all notes with filtering and pagination options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Note', attributes: { content: 'Note 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const options = {
        where: { status: 'active' },
        include: ['note_category'],
        perPage: 10,
        page: 1,
      };

      const paginationOptions = {
        maxPages: 5,
        onProgress: jest.fn(),
      };

      await module.getAllPagesPaginated(options, paginationOptions);

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/notes', {
        'where[status]': 'active',
        include: 'note_category',
      }, paginationOptions);
    });
  });

  describe('getById', () => {
    it('should fetch note by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Note', attributes: { content: 'Note 1' } },
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

    it('should fetch note by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Note', attributes: { content: 'Note 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['note_category']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getNotesForPerson', () => {
    it('should get notes for a person', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Note', attributes: { content: 'Note 1' } }],
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

      const result = await module.getNotesForPerson('person-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should get notes for a person with options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Note', attributes: { content: 'Note 1' } }],
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

      const options = {
        where: { status: 'active' },
        include: ['note_category'],
        perPage: 10,
        page: 1,
      };

      await module.getNotesForPerson('person-1', options);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new note', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Note', attributes: { content: 'New Note' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const noteData = { content: 'New Note' };
      const result = await module.create('person-1', noteData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing note', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Note', attributes: { content: 'Updated Note' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { content: 'Updated Note' };
      const result = await module.update('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a note', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.delete('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getNoteCategories', () => {
    it('should get all note categories', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'NoteCategory', attributes: { name: 'Category 1' } }],
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

      const result = await module.getNoteCategories();

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getNoteCategoryById', () => {
    it('should get note category by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'NoteCategory', attributes: { name: 'Category 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.getNoteCategoryById('1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('createNoteCategory', () => {
    it('should create a new note category', async () => {
      const mockResponse = {
        data: { id: '1', type: 'NoteCategory', attributes: { name: 'New Category' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const categoryData = { name: 'New Category' };
      const result = await module.createNoteCategory(categoryData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('updateNoteCategory', () => {
    it('should update an existing note category', async () => {
      const mockResponse = {
        data: { id: '1', type: 'NoteCategory', attributes: { name: 'Updated Category' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { name: 'Updated Category' };
      const result = await module.updateNoteCategory('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('deleteNoteCategory', () => {
    it('should delete a note category', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.deleteNoteCategory('1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });
});
