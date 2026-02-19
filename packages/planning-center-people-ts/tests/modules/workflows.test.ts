import { PcoClient } from '../../src';
import { createTestClient } from '../integration/test-config';

describe('WorkflowsModule - Real Integration Tests', () => {
  let client: PcoClient;
  let testPersonId: string | null = null;
  let testWorkflowId: string | null = null;
  let testWorkflowCardId: string | null = null;
  let testWorkflowCardNoteId: string | null = null;
  const createdWorkflowIds: string[] = []; // Track workflows we created so we can clean them up

  beforeAll(async () => {
    client = createTestClient();

    // Create a test person for workflow operations
    const timestamp = Date.now();
    const person = await client.people.create({
      first_name: `Test_Workflows_${timestamp}`,
      last_name: `Person_${timestamp}`,
      status: 'active',
    });
    // create() returns ResourceObject which should have id property
    if (!person || !person.id) {
      throw new Error('Failed to create test person: API returned invalid response');
    }
    testPersonId = person.id;

    // Always use workflow ID 332543 (user has granted permissions to this workflow)
    const workflowsResponse = await client.workflows.getPage({ per_page: 25 });
    const workflow332543 = workflowsResponse.data.find(w => w.id === '332543');
    expect(workflow332543).toBeDefined();
    testWorkflowId = '332543';

    // Create a workflow card for tests that need it
    expect(testPersonId).toBeDefined();
    expect(testWorkflowId).toBeDefined();

    // Add an email to the test person (required for sendEmailWorkflowCard test)
    await client.contacts.createEmail(testPersonId!, {
      address: `test${timestamp}@gmail.com`,
      location: 'Home',
    });

    const card = await client.workflows.createWorkflowCard(testWorkflowId, testPersonId!);
    testWorkflowCardId = card.id || null;
  }, 30000);

  afterAll(async () => {
    // Clean up test data
    // Note: Workflow card notes cannot be deleted via the API (read-only after creation)
    if (testWorkflowCardId && testPersonId) {
      await client.workflows.removeWorkflowCard(testPersonId, testWorkflowCardId);
    }
    for (const workflowId of createdWorkflowIds) {
      await client.workflows.delete(workflowId);
    }
    if (testPersonId) {
      await client.people.delete(testPersonId);
    }
  }, 120000);

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(client).toBeDefined();
      expect(client.workflows).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should fetch all workflows with default parameters', async () => {
      const result = await client.workflows.getAll();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);

    it('should fetch workflows with filtering options', async () => {
      const result = await client.workflows.getAll({
      });

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('getPage', () => {
    it('should fetch a single page of workflows', async () => {
      const result = await client.workflows.getPage({ per_page: 25, page: 1 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(25);
    }, 30000);
  });

  describe('getById', () => {
    it('should fetch workflow by ID without include', async () => {
      // Always use workflow ID 332543 (set in beforeAll)
      expect(testWorkflowId).toBe('332543');

      const result = await client.workflows.getById(testWorkflowId!);

      expect(result).toBeDefined();
      expect(result.id).toBe(testWorkflowId);
      expect(result.type).toBe('Workflow');
      // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
      expect(result).toHaveProperty('name');
    }, 30000);

    it('should fetch workflow by ID with include', async () => {
      // Always use workflow ID 332543 (set in beforeAll)
      expect(testWorkflowId).toBe('332543');

      const result = await client.workflows.getById(testWorkflowId!, { include: ['category'] });

      expect(result).toBeDefined();
      expect(result.id).toBe(testWorkflowId);
      expect(result.type).toBe('Workflow');
    }, 30000);
  });

  describe('create', () => {
    it('should create a new workflow', async () => {
      const timestamp = Date.now();
      const workflowData = {
        name: `Test Workflow ${timestamp}`,
      };
      const result = await client.workflows.create(workflowData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('Workflow');
      expect(result.name).toBe(workflowData.name);

      // Clean up this one since we already have a test workflow (don't push to createdWorkflowIds—we delete here)
      await client.workflows.delete(result.id);
    }, 30000);
  });

  describe('update', () => {
    it('should update an existing workflow', async () => {
      // Always use workflow ID 332543 (set in beforeAll)
      expect(testWorkflowId).toBe('332543');

      const updateData = { name: 'Updated Workflow Name' };
      const result = await client.workflows.update(testWorkflowId!, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testWorkflowId);
      expect(result.name).toBe('Updated Workflow Name');
    }, 30000);
  });

  describe('delete', () => {
    it('should delete a workflow', async () => {
      // Create a workflow to delete
      const timestamp = Date.now();
      const workflowData = {
        name: `Test Delete ${timestamp}`,
      };
      const created = await client.workflows.create(workflowData);
      const workflowIdToDelete = created.id || '';

      // Delete the workflow (don't push to createdWorkflowIds—we delete here)
      await expect(client.workflows.delete(workflowIdToDelete)).resolves.not.toThrow();

      // Verify it's deleted by trying to fetch it
      await expect(client.workflows.getById(workflowIdToDelete)).rejects.toThrow();
    }, 30000);
  });

  describe('getPersonWorkflowCards', () => {
    it('should get workflow cards for a person', async () => {
      expect(testPersonId).toBeDefined();

      const result = await client.workflows.getPersonWorkflowCards(testPersonId!);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('addPersonToWorkflow', () => {
    it('should add a person to a workflow', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowId).toBe('332543');

      const result = await client.workflows.addPersonToWorkflow(testPersonId!, testWorkflowId!, {
        skipIfExists: false,
        skipIfActive: false,
      });

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('WorkflowCard');

      testWorkflowCardId = result.id || null;
    }, 30000);
  });

  describe('createWorkflowCard', () => {
    it('should create a workflow card', async () => {
      expect(testPersonId).toBeDefined();

      // Always use workflow ID 332543 (set in beforeAll)
      expect(testWorkflowId).toBe('332543');

      const result = await client.workflows.createWorkflowCard(testWorkflowId!, testPersonId!);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('WorkflowCard');

      testWorkflowCardId = result.id || null;
    }, 30000);
  });

  describe('updateWorkflowCard', () => {
    it('should update a workflow card', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowId).toBe('332543');
      expect(testWorkflowCardId).toBeDefined();

      // Workflow cards can only update: sticky_assignment, assignee_id, person_id
      const updateData = { sticky_assignment: true };
      const result = await client.workflows.updateWorkflowCard(testWorkflowCardId!, updateData, testPersonId!);

      expect(result).toBeDefined();
      expect(result.id).toBe(testWorkflowCardId);
    }, 30000);
  });

  describe('getWorkflowCardNotes', () => {
    it('should get workflow card notes', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowId).toBe('332543');
      expect(testWorkflowCardId).toBeDefined();

      const result = await client.workflows.getWorkflowCardNotes(testPersonId!, testWorkflowCardId!);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('links');
      expect(Array.isArray(result.data)).toBe(true);
    }, 30000);
  });

  describe('createWorkflowCardNote', () => {
    it('should create a workflow card note', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowId).toBe('332543');
      expect(testWorkflowCardId).toBeDefined();

      const noteData = {
        note: `Test Note ${Date.now()}`,
      };
      const result = await client.workflows.createWorkflowCardNote(testPersonId!, testWorkflowCardId!, noteData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.type).toBe('WorkflowCardNote');
      expect(result.note).toBe(noteData.note);

      testWorkflowCardNoteId = result.id || null;
      expect(testWorkflowCardNoteId).toBeTruthy();
    }, 30000);
  });


  describe('createWorkflowCardWithNote', () => {
    it('should create a workflow card with a note', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowId).toBe('332543');

      const noteData = {
        note: `Test Card with Note ${Date.now()}`,
      };
      const result = await client.workflows.createWorkflowCardWithNote(testWorkflowId!, testPersonId!, noteData);

      expect(result).toBeDefined();
      expect(result.workflowCard).toBeDefined();
      expect(result.note).toBeDefined();
      expect(result.workflowCard.type).toBe('WorkflowCard');
      expect(result.note.type).toBe('WorkflowCardNote');
    }, 30000);
  });

  describe('goBackWorkflowCard', () => {
    it('should go back on a workflow card', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowCardId).toBeDefined();

      const result = await client.workflows.goBackWorkflowCard(testPersonId!, testWorkflowCardId!);

      expect(result).toBeDefined();
      expect(result.id).toBe(testWorkflowCardId);
      expect(result.type).toBe('WorkflowCard');
    }, 30000);
  });

  describe('promoteWorkflowCard', () => {
    it('should promote a workflow card', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowCardId).toBeDefined();

      const result = await client.workflows.promoteWorkflowCard(testPersonId!, testWorkflowCardId!);

      expect(result).toBeDefined();
      expect(result.id).toBe(testWorkflowCardId);
      expect(result.type).toBe('WorkflowCard');
    }, 30000);
  });

  describe('removeWorkflowCard', () => {
    it('should remove a workflow card', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowId).toBe('332543');

      // Create a workflow card to remove
      const created = await client.workflows.createWorkflowCard(testWorkflowId!, testPersonId!);
      const cardIdToRemove = created.id || '';

      const result = await client.workflows.removeWorkflowCard(testPersonId!, cardIdToRemove);

      expect(result).toBeDefined();
      expect(result.id).toBe(cardIdToRemove);
      expect(result.type).toBe('WorkflowCard');
    }, 30000);
  });

  describe('restoreWorkflowCard', () => {
    it('should restore a workflow card', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowId).toBe('332543');

      // Create and remove a workflow card first
      const created = await client.workflows.createWorkflowCard(testWorkflowId!, testPersonId!);
      const cardId = created.id || '';

      await client.workflows.removeWorkflowCard(testPersonId!, cardId);

      const result = await client.workflows.restoreWorkflowCard(testPersonId!, cardId);

      expect(result).toBeDefined();
      expect(result.id).toBe(cardId);
      expect(result.type).toBe('WorkflowCard');
    }, 30000);
  });

  describe('sendEmailWorkflowCard', () => {
    it('should send email for a workflow card', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowId).toBe('332543');
      expect(testWorkflowCardId).toBeDefined();

      // Ensure the person has an email (required for sending email)
      // The email was added in beforeAll, so we should be able to get it
      const emails = await client.people.getEmails(testPersonId!);
      expect(emails.data.length).toBeGreaterThan(0);

      const emailData = {
        subject: 'Test Subject',
        note: 'Test Body',
      };
      const result = await client.workflows.sendEmailWorkflowCard(testPersonId!, testWorkflowCardId!, emailData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testWorkflowCardId);
      expect(result.type).toBe('WorkflowCard');
    }, 30000);
  });

  describe('skipStepWorkflowCard', () => {
    it('should skip step on a workflow card', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowCardId).toBeDefined();

      const result = await client.workflows.skipStepWorkflowCard(testPersonId!, testWorkflowCardId!);

      expect(result).toBeDefined();
      expect(result.id).toBe(testWorkflowCardId);
      expect(result.type).toBe('WorkflowCard');
    }, 30000);
  });

  describe('snoozeWorkflowCard', () => {
    it('should snooze a workflow card', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowId).toBe('332543');
      expect(testWorkflowCardId).toBeDefined();

      const snoozeData = {
        duration: 1, // Snooze for 1 day
      };
      const result = await client.workflows.snoozeWorkflowCard(testPersonId!, testWorkflowCardId!, snoozeData);

      expect(result).toBeDefined();
      expect(result.id).toBe(testWorkflowCardId);
      expect(result.type).toBe('WorkflowCard');
    }, 30000);
  });

  describe('unsnoozeWorkflowCard', () => {
    it('should unsnooze a workflow card', async () => {
      expect(testPersonId).toBeDefined();
      expect(testWorkflowCardId).toBeDefined();

      const result = await client.workflows.unsnoozeWorkflowCard(testPersonId!, testWorkflowCardId!);

      expect(result).toBeDefined();
      expect(result.id).toBe(testWorkflowCardId);
      expect(result.type).toBe('WorkflowCard');
    }, 30000);
  });
});
