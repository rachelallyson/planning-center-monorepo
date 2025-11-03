import { WorkflowsModule } from '../../src/modules/workflows';
import type { PcoHttpClient, PaginationHelper, PcoEventEmitter } from '@rachelallyson/planning-center-base-ts';

describe('WorkflowsModule', () => {
  let module: WorkflowsModule;
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

    module = new WorkflowsModule(mockHttpClient, mockPaginationHelper, mockEventEmitter);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(module).toBeInstanceOf(WorkflowsModule);
    });
  });

  describe('getAll', () => {
    it('should fetch all workflows with default parameters', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Workflow', attributes: { name: 'Workflow 1' } }],
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

    it('should fetch workflows with filtering options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Workflow', attributes: { name: 'Workflow 1' } }],
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
        include: ['workflow_cards'],
        perPage: 10,
        page: 1,
      };

      await module.getAll(options);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('getAllPagesPaginated', () => {
    it('should get all workflows with pagination', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Workflow', attributes: { name: 'Workflow 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const result = await module.getAllPagesPaginated();

      expect(result).toEqual(mockResponse);
      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/workflows', {}, undefined);
    });

    it('should get all workflows with filtering and pagination options', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'Workflow', attributes: { name: 'Workflow 1' } }],
        meta: { total_count: 1 },
        links: {},
      };

      mockPaginationHelper.getAllPages.mockResolvedValueOnce(mockResponse);

      const options = {
        where: { status: 'active' },
        include: ['workflow_cards'],
        perPage: 10,
      };

      const paginationOptions = {
        maxPages: 5,
        onProgress: jest.fn(),
      };

      await module.getAllPagesPaginated(options, paginationOptions);

      expect(mockPaginationHelper.getAllPages).toHaveBeenCalledWith('/workflows', {
        'where[status]': 'active',
        include: 'workflow_cards',
      }, paginationOptions);
    });
  });

  describe('getById', () => {
    it('should fetch workflow by ID without include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Workflow', attributes: { name: 'Workflow 1' } },
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

    it('should fetch workflow by ID with include', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Workflow', attributes: { name: 'Workflow 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.getById('1', ['workflow_cards']);

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new workflow', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Workflow', attributes: { name: 'New Workflow' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const workflowData = { name: 'New Workflow' };
      const result = await module.create(workflowData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an existing workflow', async () => {
      const mockResponse = {
        data: { id: '1', type: 'Workflow', attributes: { name: 'Updated Workflow' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { name: 'Updated Workflow' };
      const result = await module.update('1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete a workflow', async () => {
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

  describe('getPersonWorkflowCards', () => {
    it('should get workflow cards for a person', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } }],
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

      const result = await module.getPersonWorkflowCards('person-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('addPersonToWorkflow', () => {
    it('should add a person to a workflow', async () => {
      const mockCardResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } },
      };
      const mockNotesResponse = {
        data: { id: 'n1', type: 'WorkflowCardNote', attributes: { content: 'New Note' } },
      };
      // 1) create card
      mockHttpClient.request.mockResolvedValueOnce({
        data: mockCardResponse,
        status: 201,
        headers: {},
        requestId: 't2',
        duration: 100,
      });
      // 2) create note
      mockHttpClient.request.mockResolvedValueOnce({
        data: mockNotesResponse,
        status: 201,
        headers: {},
        requestId: 't3',
        duration: 100,
      });

      const options = {
        note: 'Test note',
        skipIfExists: false,
        skipIfActive: false,
        noteTemplate: 'Template',
      };

      const result = await module.addPersonToWorkflow('person-1', 'workflow-1', options as any);

      expect(result).toEqual(mockCardResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should skip duplicate check when both skipIfExists and skipIfActive are false', async () => {
      const mockCardResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } },
      };
      mockHttpClient.request.mockResolvedValueOnce({
        data: mockCardResponse,
        status: 201,
        headers: {},
        requestId: 't1',
        duration: 100,
      });

      const result = await module.addPersonToWorkflow('person-1', 'workflow-1', {
        skipIfExists: false,
        skipIfActive: false,
      });

      expect(result).toEqual(mockCardResponse.data);
      // Should not call getPersonWorkflowCards when both are false
      expect(mockHttpClient.request).toHaveBeenCalledTimes(1);
    });

    it('should check for existing completed card when skipIfExists is true', async () => {
      const mockCardsResponse = {
        data: [
          {
            id: 'card-1',
            type: 'WorkflowCard',
            attributes: { completed_at: '2024-01-01T00:00:00Z', removed_at: null },
            relationships: { workflow: { data: { id: 'workflow-1', type: 'Workflow' } } },
          },
        ],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockCardsResponse,
        status: 200,
        headers: {},
        requestId: 't1',
        duration: 100,
      });

      await expect(
        module.addPersonToWorkflow('person-1', 'workflow-1', {
          skipIfExists: true,
          skipIfActive: false,
        })
      ).rejects.toThrow('Person already has a completed/removed card');
    });

    it('should check for existing active card when skipIfActive is true', async () => {
      const mockCardsResponse = {
        data: [
          {
            id: 'card-1',
            type: 'WorkflowCard',
            attributes: { completed_at: null, removed_at: null },
            relationships: { workflow: { data: { id: 'workflow-1', type: 'Workflow' } } },
          },
        ],
        meta: { total_count: 1 },
        links: {},
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockCardsResponse,
        status: 200,
        headers: {},
        requestId: 't1',
        duration: 100,
      });

      await expect(
        module.addPersonToWorkflow('person-1', 'workflow-1', {
          skipIfExists: false,
          skipIfActive: true,
        })
      ).rejects.toThrow('Person already has an active card');
    });

    it('should use noteTemplate when note is not provided', async () => {
      const mockCardResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } },
      };
      const mockNotesResponse = {
        data: { id: 'n1', type: 'WorkflowCardNote', attributes: { content: 'Person {{personId}} in workflow {{workflowId}}' } },
      };

      mockHttpClient.request
        .mockResolvedValueOnce({ data: mockCardResponse, status: 201, headers: {}, requestId: 't1', duration: 100 })
        .mockResolvedValueOnce({ data: mockNotesResponse, status: 201, headers: {}, requestId: 't2', duration: 100 });

      const result = await module.addPersonToWorkflow('person-1', 'workflow-1', {
        noteTemplate: 'Person {{personId}} in workflow {{workflowId}}',
        skipIfExists: false,
        skipIfActive: false,
      });

      expect(result).toEqual(mockCardResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalledTimes(2);
    });
  });

  describe('createWorkflowCard', () => {
    it('should create a workflow card', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.createWorkflowCard('workflow-1', 'person-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('updateWorkflowCard', () => {
    it('should update a workflow card', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'Updated Card' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { name: 'Updated Card' };
      const result = await module.updateWorkflowCard('card-1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });

    it('should update a workflow card with personId', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'Updated Card' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { name: 'Updated Card' };
      const result = await module.updateWorkflowCard('card-1', updateData, 'person-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: '/people/person-1/workflow_cards/card-1',
        })
      );
    });
  });

  describe('getWorkflowCardNotes', () => {
    it('should get workflow card notes', async () => {
      const mockResponse = {
        data: [{ id: '1', type: 'WorkflowCardNote', attributes: { content: 'Note 1' } }],
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

      const result = await module.getWorkflowCardNotes('person-1', 'card-1');

      expect(result).toEqual(mockResponse);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('createWorkflowCardNote', () => {
    it('should create a workflow card note', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCardNote', attributes: { content: 'New Note' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 201,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const noteData = { content: 'New Note' };
      const result = await module.createWorkflowCardNote('person-1', 'card-1', noteData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('updateWorkflowCardNote', () => {
    it('should update a workflow card note', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCardNote', attributes: { content: 'Updated Note' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const updateData = { content: 'Updated Note' };
      const result = await module.updateWorkflowCardNote('person-1', 'card-1', 'note-1', updateData);

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('deleteWorkflowCardNote', () => {
    it('should delete a workflow card note', async () => {
      mockHttpClient.request.mockResolvedValueOnce({
        data: null,
        status: 204,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      await module.deleteWorkflowCardNote('person-1', 'card-1', 'note-1');

      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('createWorkflowCardWithNote', () => {
    it('should create a workflow card with a note', async () => {
      const mockCardResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } },
      };
      const mockNoteResponse = {
        data: { id: '1', type: 'WorkflowCardNote', attributes: { content: 'Note 1' } },
      };

      // 1) create card
      mockHttpClient.request.mockResolvedValueOnce({
        data: mockCardResponse,
        status: 201,
        headers: {},
        requestId: 't1',
        duration: 100,
      });
      // 2) create note
      mockHttpClient.request.mockResolvedValueOnce({
        data: mockNoteResponse,
        status: 201,
        headers: {},
        requestId: 't2',
        duration: 100,
      });

      const noteData = { content: 'Note 1' } as any;
      const result = await module.createWorkflowCardWithNote('workflow-1', 'person-1', noteData);

      expect(result).toEqual({ workflowCard: mockCardResponse.data, note: mockNoteResponse.data });
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('goBackWorkflowCard', () => {
    it('should go back a workflow card', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.goBackWorkflowCard('person-1', 'card-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('promoteWorkflowCard', () => {
    it('should promote a workflow card', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.promoteWorkflowCard('person-1', 'card-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('removeWorkflowCard', () => {
    it('should remove a workflow card', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.removeWorkflowCard('person-1', 'card-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });

  describe('restoreWorkflowCard', () => {
    it('should restore a workflow card', async () => {
      const mockResponse = {
        data: { id: '1', type: 'WorkflowCard', attributes: { name: 'Card 1' } },
      };

      mockHttpClient.request.mockResolvedValueOnce({
        data: mockResponse,
        status: 200,
        headers: {},
        requestId: 'test',
        duration: 100,
      });

      const result = await module.restoreWorkflowCard('person-1', 'card-1');

      expect(result).toEqual(mockResponse.data);
      expect(mockHttpClient.request).toHaveBeenCalled();
    });
  });
});
