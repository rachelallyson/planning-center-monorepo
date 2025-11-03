import { 
  getWorkflowCardNotes, 
  createWorkflowCardNote, 
  getWorkflowCards, 
  createWorkflowCard, 
  getWorkflows, 
  getWorkflow 
} from '../../src/people/workflows';
import type { PcoClientState } from '../../src/core';

jest.mock('../../src/core', () => ({
  getList: jest.fn(),
  getSingle: jest.fn(),
  post: jest.fn(),
}));
const { getList, getSingle, post } = require('../../src/core');

describe('Workflows Functions', () => {
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
  });

  describe('getWorkflowCardNotes', () => {
    it('should fetch workflow card notes', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'WorkflowCardNote', attributes: { content: 'Note 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getWorkflowCardNotes(mockClient, 'person-1', 'card-1');

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });
  });

  describe('createWorkflowCardNote', () => {
    it('should create a workflow card note', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCardNote', attributes: { content: 'New Note' } },
      };

      (post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const noteData = { content: 'New Note' } as any;
      const result = await createWorkflowCardNote(mockClient, 'person-1', 'card-1', noteData);

      expect(result).toEqual(mockResponse);
      expect(post).toHaveBeenCalled();
    });
  });

  describe('getWorkflowCards', () => {
    it('should fetch workflow cards for a person', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getWorkflowCards(mockClient, 'person-1');

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });
  });

  describe('createWorkflowCard', () => {
    it('should create a workflow card', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'New Card' } },
      };

      (post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const cardData = { name: 'New Card' } as any;
      const result = await createWorkflowCard(mockClient, 'workflow-1', 'person-1', cardData);

      expect(result).toEqual(mockResponse);
      expect(post).toHaveBeenCalled();
    });
  });

  describe('getWorkflows', () => {
    it('should fetch all workflows with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Workflow', attributes: { name: 'Workflow 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      (getList as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getWorkflows(mockClient);

      expect(result).toEqual(mockResponse);
      expect(getList).toHaveBeenCalled();
    });

    it('should fetch workflows with parameters', async () => {
      (getList as jest.Mock).mockResolvedValueOnce({ data: [], meta: {}, links: {} });

      const params = {
        where: { status: 'active' },
        include: ['workflow_cards'],
        per_page: 10,
        page: 1,
      } as any;

      await getWorkflows(mockClient, params);

      expect(getList).toHaveBeenCalled();
    });
  });

  describe('getWorkflow', () => {
    it('should fetch a workflow by ID', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Workflow', attributes: { name: 'Workflow 1' } },
      };

      (getSingle as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await getWorkflow(mockClient, '1');

      expect(result).toEqual(mockResponse);
      expect(getSingle).toHaveBeenCalled();
    });
  });
});
