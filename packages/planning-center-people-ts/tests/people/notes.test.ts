import { getNotes, getNote, getNoteCategories } from '../../src/people/notes';
import type { PcoClientState } from '../../src/core';

jest.mock('../../src/core', () => ({
  getList: jest.fn(),
  getSingle: jest.fn(),
}));
const { getList, getSingle } = require('../../src/core');

describe('Notes Functions', () => {
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
  });

  describe('getNotes', () => {
    it('should fetch all notes with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Note', attributes: { content: 'Note 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getNotes(mockClient);

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });

    it('should fetch notes with parameters', async () => {
      (getList as jest.Mock).mockResolvedValueOnce({ data: [], meta: {}, links: {} });

      const params = {
        where: { status: 'active' },
        include: ['note_category'],
        per_page: 10,
        page: 1,
      };

      await getNotes(mockClient, params);

      expect(getList).toHaveBeenCalled();
    });
  });

  describe('getNote', () => {
    it('should fetch a note by ID with default parameters', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Note', attributes: { content: 'Note 1' } },
      };

      (getSingle as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getNote(mockClient, '1');

      expect(result).toEqual(mockResponse);
      expect(getSingle).toHaveBeenCalled();
    });

    it('should fetch a note by ID with parameters', async () => {
      (getSingle as jest.Mock).mockResolvedValueOnce({ data: { id: '1', type: 'Note' } });

      const params = {
        where: { status: 'active' },
        include: ['note_category'],
        per_page: 10,
        page: 1,
      };

      await getNote(mockClient, '1', params);

      expect(getSingle).toHaveBeenCalled();
    });
  });

  describe('getNoteCategories', () => {
    it('should fetch all note categories', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'NoteCategory', attributes: { name: 'Category 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getNoteCategories(mockClient);

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });
  });
});
