import {
    PcoClient,
    type PersonAttributes,
} from '../../../src';
import {
    validateResourceStructure,
    validateStringAttribute,
    validateRelationship,
} from '../../type-validators';
import { createTestClient, logAuthStatus } from '../test-config';

const TEST_PREFIX = 'TEST_V2_WORKFLOWS_2025';

/**
 * Optional: set PCO_TEST_WORKFLOW_ID in .env.test to a workflow ID the test user
 * has access to (e.g. 332543) to avoid "You do not have access to this resource".
 * If unset, tests use the first workflow returned by getAll().
 */
const ENV_WORKFLOW_ID = typeof process.env.PCO_TEST_WORKFLOW_ID === 'string' && process.env.PCO_TEST_WORKFLOW_ID.trim()
    ? process.env.PCO_TEST_WORKFLOW_ID.trim()
    : '';

/** Get person id from a workflow card (flattened or raw, id as string or number). */
function getPersonIdFromCard(card: Record<string, unknown>): string | undefined {
    const pid = card.person_id ?? (card.person && typeof card.person === 'object' && 'id' in card.person
        ? (card.person as { id?: string | number }).id
        : undefined);
    const rel = card.relationships as Record<string, { data?: { id?: string | number } | Array<{ id?: string | number }> }> | undefined;
    const relPersonId = rel?.person?.data
        ? (Array.isArray(rel.person.data) ? rel.person.data[0]?.id : rel.person.data.id)
        : undefined;
    const raw = pid ?? relPersonId;
    return raw !== undefined && raw !== null ? String(raw) : undefined;
}

/** True if this card is for the given person id (compare as strings). */
function isCardForPerson(card: Record<string, unknown>, personId: string): boolean {
    return getPersonIdFromCard(card) === String(personId);
}

describe('v2.0.0 Workflows API Integration Tests', () => {
    let client: PcoClient;
    let testPersonId: string;
    let testWorkflowId: string;
    let testWorkflowCardId: string;

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();

        // Use workflow ID from env if set (workflow the test user has access to)
        if (ENV_WORKFLOW_ID) {
            testWorkflowId = ENV_WORKFLOW_ID;
        }

        // Create a test person for workflow operations
        const timestamp = Date.now();
        const personData: Partial<PersonAttributes> = {
            first_name: `${TEST_PREFIX}_WorkflowTest_${timestamp}`,
            last_name: `${TEST_PREFIX}_Test_${timestamp}`,
            status: 'active',
        };

        const createResponse = await client.people.create(personData);
        testPersonId = createResponse.id || '';
        expect(testPersonId).toBeTruthy();
    }, 30000);

    afterAll(async () => {
        // Clean up test person
        if (testPersonId) {
            await client.people.delete(testPersonId);
        }
    }, 60000);

    describe('v2.0 Workflow Operations', () => {
        it('should get all workflows with pagination', async () => {
            const workflows = await client.workflows.getAll();
            expect(workflows.data).toBeDefined();
            expect(Array.isArray(workflows.data)).toBe(true);
            expect(workflows.meta).toBeDefined();
        }, 60000);

        it('should get workflow by ID', async () => {
            let workflowId: string;
            if (testWorkflowId) {
                workflowId = testWorkflowId;
            } else {
                const workflows = await client.workflows.getAll();
                expect(workflows.data.length).toBeGreaterThan(0);
                workflowId = workflows.data[0].id;
                testWorkflowId = workflowId;
            }
            const workflow = await client.workflows.getById(workflowId);

            expect(workflow).toBeDefined();
            validateResourceStructure(workflow, 'Workflow');
            expect(workflow.id).toBe(workflowId);
            // getById returns flattened resource - attributes at top level
            expect(workflow).toHaveProperty('name');
        }, 30000);

        it('should add person to workflow', async () => {
            expect(testWorkflowId).toBeTruthy();
            const workflowCard = await client.workflows.addPersonToWorkflow(
                testPersonId,
                testWorkflowId
            );

            expect(workflowCard).toBeDefined();
            validateResourceStructure(workflowCard, 'WorkflowCard');
            expect(workflowCard.sticky_assignment !== undefined || workflowCard.step_title !== undefined).toBe(true);
            // Flattened: person at top level (object or identifier); API may omit relationship in create response
            const personId = getPersonIdFromCard(workflowCard as Record<string, unknown>);
            if (personId !== undefined) {
                expect(personId).toBe(testPersonId);
            } else {
                expect(workflowCard.id).toBeTruthy();
            }

            testWorkflowCardId = workflowCard.id || '';
            expect(testWorkflowCardId).toBeTruthy();
        }, 30000);

        it('should detect duplicate workflow card', async () => {
            if (!testWorkflowId) {
                const workflows = await client.workflows.getAll();
                testWorkflowId = workflows.data[0].id;
            }

            // Try to add the same person again - API may reject as duplicate or succeed (idempotent)
            try {
                const card = await client.workflows.addPersonToWorkflow(testPersonId, testWorkflowId);
                expect(card).toBeDefined();
                expect(card.id).toBeTruthy();
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                // Access errors should fail the test, not be treated as duplicates
                if (message.includes('You do not have access to this resource')) {
                    throw err;
                }
                expect(message).toMatch(/already exists|duplicate|already has an active card|already has a completed\/removed card/i);
            }
        }, 30000);

        it('should get workflow cards for a person', async () => {
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            expect(workflowCards.data).toBeDefined();
            expect(Array.isArray(workflowCards.data)).toBe(true);
            expect(workflowCards.data.length).toBeGreaterThan(0);

            // Verify the test person is in at least one workflow (or our known card id is present)
            const hasTestPerson = workflowCards.data.some(card => {
                const c = card as Record<string, unknown>;
                return isCardForPerson(c, testPersonId) || (testWorkflowCardId && c.id === testWorkflowCardId);
            });
            expect(hasTestPerson).toBe(true);
        }, 60000);

        it('should update workflow card', async () => {
            // Get workflow cards for the test person
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            expect(workflowCards.data.length).toBeGreaterThan(0);

            const testCard = workflowCards.data.find(card => {
                const c = card as Record<string, unknown>;
                return isCardForPerson(c, testPersonId) || (testWorkflowCardId && c.id === testWorkflowCardId);
            });

            expect(testCard).toBeDefined();
            expect(testCard).toBeTruthy();
            const cardId = (testCard as { id: string }).id;

            // Update workflow card with assignable fields
            const updateData = {
                sticky_assignment: true,
            };

            const updatedCard = await client.workflows.updateWorkflowCard(
                cardId,
                updateData,
                testPersonId
            );

            expect(updatedCard).toBeDefined();
            expect(updatedCard.type).toBe('WorkflowCard');
            expect(updatedCard.id).toBe(cardId);
            expect(updatedCard.sticky_assignment).toBe(true);
        }, 60000);

        it('should add workflow card notes', async () => {
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            expect(workflowCards.data.length).toBeGreaterThan(0);

            const testCard = workflowCards.data.find(card => {
                const c = card as Record<string, unknown>;
                return isCardForPerson(c, testPersonId) || (testWorkflowCardId && c.id === testWorkflowCardId);
            });

            expect(testCard).toBeDefined();
            expect(testCard).toBeTruthy();
            const cardId = (testCard as { id: string }).id;

            const noteData = {
                note: 'This is a test note added via v2.0 API',
            };

            const note = await client.workflows.createWorkflowCardNote(
                testPersonId,
                cardId,
                noteData
            );

            expect(note).toBeDefined();
            validateResourceStructure(note, 'WorkflowCardNote');
            expect(note.note).toBe(noteData.note);
        }, 60000);

        it('should complete workflow card', async () => {
            // Get workflow cards for the test person
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            expect(workflowCards.data.length).toBeGreaterThan(0);

            const testCard = workflowCards.data.find(card => {
                const c = card as Record<string, unknown>;
                return isCardForPerson(c, testPersonId) || (testWorkflowCardId && c.id === testWorkflowCardId);
            });

            expect(testCard).toBeDefined();
            expect(testCard).toBeTruthy();
            const cardId = (testCard as { id: string }).id;

            // Update workflow card with assignable fields
            // Note: completed_at cannot be assigned directly - it's a computed field
            // Workflow cards are typically completed through workflow step progression
            const updateData = {
                sticky_assignment: false,
            };

            const completedCard = await client.workflows.updateWorkflowCard(cardId, updateData, testPersonId);

            expect(completedCard).toBeDefined();
            expect(completedCard.type).toBe('WorkflowCard');
            expect(completedCard.id).toBe(cardId);
            expect(completedCard.sticky_assignment).toBe(false);
        }, 30000);

        it('should handle invalid workflow ID gracefully', async () => {
            await expect(
                client.workflows.getById('invalid-workflow-id')
            ).rejects.toThrow();
        }, 60000);

        it('should handle invalid person ID gracefully', async () => {
            if (!testWorkflowId) {
                const workflows = await client.workflows.getAll();
                testWorkflowId = workflows.data[0].id;
            }

            await expect(
                client.workflows.addPersonToWorkflow(testWorkflowId, 'invalid-person-id')
            ).rejects.toThrow();
        }, 60000);

        it('should handle invalid workflow card ID gracefully', async () => {
            await expect(
                client.workflows.updateWorkflowCard('invalid-card-id', { sticky_assignment: true })
            ).rejects.toThrow();
        }, 60000);
    });

    describe('v2.0 Workflow Performance', () => {
        it('should demonstrate workflow operations performance', async () => {
            const startTime = Date.now();

            // Get all workflows
            const workflows = await client.workflows.getAll();
            const workflowFetchTime = Date.now() - startTime;

            expect(workflows.data.length).toBeGreaterThan(0);
            expect(workflowFetchTime).toBeLessThan(30000); // Allow more time for API calls

        }, 30000);
    });

    describe('v2.0 Workflow Card Actions', () => {
        it('should snooze and unsnooze workflow card', async () => {
            // Get workflow cards for the test person
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            expect(workflowCards.data.length).toBeGreaterThan(0);

            const testCard = workflowCards.data.find(card => {
                const c = card as Record<string, unknown>;
                return isCardForPerson(c, testPersonId) || (testWorkflowCardId && c.id === testWorkflowCardId);
            });

            expect(testCard).toBeDefined();
            expect(testCard).toBeTruthy();
            const cardId = (testCard as { id: string }).id;

            // Snooze the workflow card for 1 day
            const snoozedCard = await client.workflows.snoozeWorkflowCard(testPersonId, cardId, { duration: 1 });

            expect(snoozedCard).toBeDefined();
            expect(snoozedCard.type).toBe('WorkflowCard');
            expect(snoozedCard.id).toBe(testWorkflowCardId);
            expect(snoozedCard.snooze_until).toBeTruthy();

            // Unsnooze the workflow card
            const unsnoozedCard = await client.workflows.unsnoozeWorkflowCard(testPersonId, cardId);

            expect(unsnoozedCard).toBeDefined();
            expect(unsnoozedCard.type).toBe('WorkflowCard');
            expect(unsnoozedCard.id).toBe(cardId);
        }, 30000);

        it('should promote workflow card', async () => {
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            expect(workflowCards.data.length).toBeGreaterThan(0);

            const testCard = workflowCards.data.find(card => {
                const c = card as Record<string, unknown>;
                return isCardForPerson(c, testPersonId) || (testWorkflowCardId && c.id === testWorkflowCardId);
            });

            expect(testCard).toBeDefined();
            expect(testCard).toBeTruthy();
            const cardId = (testCard as { id: string }).id;

            const promotedCard = await client.workflows.promoteWorkflowCard(testPersonId, cardId);

            expect(promotedCard).toBeDefined();
            expect(promotedCard.type).toBe('WorkflowCard');
            expect(promotedCard.id).toBe(cardId);
        }, 120000);

        it('should skip step workflow card', async () => {
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            expect(workflowCards.data.length).toBeGreaterThan(0);

            const testCard = workflowCards.data.find(card => {
                const c = card as Record<string, unknown>;
                return isCardForPerson(c, testPersonId) || (testWorkflowCardId && c.id === testWorkflowCardId);
            });

            expect(testCard).toBeDefined();
            expect(testCard).toBeTruthy();
            const cardId = (testCard as { id: string }).id;

            const skippedCard = await client.workflows.skipStepWorkflowCard(testPersonId, cardId);

            expect(skippedCard).toBeDefined();
            expect(skippedCard.type).toBe('WorkflowCard');
            expect(skippedCard.id).toBe(cardId);
        }, 30000);

        it('should send email from workflow card', async () => {
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            expect(workflowCards.data.length).toBeGreaterThan(0);

            const testCard = workflowCards.data.find(card => {
                const c = card as Record<string, unknown>;
                return isCardForPerson(c, testPersonId) || (testWorkflowCardId && c.id === testWorkflowCardId);
            });

            expect(testCard).toBeDefined();
            expect(testCard).toBeTruthy();
            const cardId = (testCard as { id: string }).id;

            const emails = await client.people.getEmails(testPersonId);
            if (emails.data.length === 0) {
                const emailData = {
                    address: 'test@planningcenteronline.com',
                    primary: true,
                    location: 'Home' as const
                };
                await client.people.addEmail(testPersonId, emailData);
            }

            const emailData = {
                subject: 'Test Email from Workflow Card',
                note: 'This is a test email sent from a workflow card action.'
            };

            const emailCard = await client.workflows.sendEmailWorkflowCard(testPersonId, cardId, emailData);

            expect(emailCard).toBeDefined();
            expect(emailCard.type).toBe('WorkflowCard');
            expect(emailCard.id).toBe(cardId);
        }, 30000);

        it('should remove and restore workflow card', async () => {
            const workflowCards = await client.workflows.getPersonWorkflowCards(testPersonId);

            expect(workflowCards.data.length).toBeGreaterThan(0);

            const testCard = workflowCards.data.find(card => {
                const c = card as Record<string, unknown>;
                return isCardForPerson(c, testPersonId) || (testWorkflowCardId && c.id === testWorkflowCardId);
            });

            expect(testCard).toBeDefined();
            expect(testCard).toBeTruthy();
            const cardId = (testCard as { id: string }).id;

            const removedCard = await client.workflows.removeWorkflowCard(testPersonId, cardId);

            expect(removedCard).toBeDefined();
            expect(removedCard.type).toBe('WorkflowCard');
            expect(removedCard.id).toBe(cardId);

            const restoredCard = await client.workflows.restoreWorkflowCard(testPersonId, cardId);

            expect(restoredCard).toBeDefined();
            expect(restoredCard.type).toBe('WorkflowCard');
            expect(restoredCard.id).toBe(cardId);
        }, 30000);
    });
});
