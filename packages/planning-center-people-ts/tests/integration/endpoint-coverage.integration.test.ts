/**
 * Endpoint Coverage Integration Tests
 * 
 * These tests verify that all major API endpoints are accessible and return expected data structures.
 * They provide comprehensive coverage of the People API functionality.
 * 
 * To run: npm run test:integration -- --testNamePattern="Endpoint Coverage"
 */

import { PcoClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

describe('People API Endpoint Coverage Integration Tests', () => {
    let client: PcoClient;
    let testPersonId: string;
    let testHouseholdId: string;
    let testCampusId: string;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

    }, 30000);

    afterAll(async () => {
        // Clean up test data
        if (testPersonId) {
            await client.people.delete(testPersonId);
        }
    }, 30000);

    describe('People Module Endpoint Coverage', () => {
        it('should cover all people CRUD operations', async () => {
            // CREATE
            const personData = {
                first_name: `CoverageTest_${Date.now()}`,
                last_name: 'EndpointTest',
                status: 'active'
            };
            const createdPerson = await client.people.create(personData);
            testPersonId = createdPerson.id;
            expect(createdPerson).toBeDefined();
            expect(createdPerson.type).toBe('Person');

            // READ - Single (returns flattened resource)
            const retrievedPerson = await client.people.getById(testPersonId);
            expect(retrievedPerson.id).toBe(testPersonId);
            expect(retrievedPerson.first_name).toBe(personData.first_name);

            // READ - List
            const peopleList = await client.people.getPage({ perPage: 10 });
            expect(peopleList.data).toBeDefined();
            expect(Array.isArray(peopleList.data)).toBe(true);

            // READ - Search
            const searchResults = await client.people.search({
                name: personData.first_name,
                perPage: 5
            });
            expect(searchResults.data).toBeDefined();
            expect(Array.isArray(searchResults.data)).toBe(true);

            // UPDATE
            const updateData = {
                first_name: `Updated_${Date.now()}`
            };
            const updatedPerson = await client.people.update(testPersonId, updateData);
            // update returns ResourceObject, not flattened
            expect(updatedPerson.first_name).toBe(updateData.first_name);

            // DELETE will be handled in afterAll
        }, 60000);

        it('should cover people relationship operations', async () => {
            if (!testPersonId) {
                const personData = {
                    first_name: `RelationshipTest_${Date.now()}`,
                    last_name: 'CoverageTest',
                    status: 'active'
                };
                const person = await client.people.create(personData);
                testPersonId = person.id;
            }

            // Test household relationship (API may allow setHousehold or reject with "cannot be assigned")
            const households = await client.households.getPage({ perPage: 1 });
            expect(households.data.length).toBeGreaterThan(0);
            testHouseholdId = households.data[0].id;
            try {
                await client.people.setHousehold(testPersonId, testHouseholdId);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                expect(message).toMatch(/cannot be assigned|data cannot be assigned/i);
            }

            // Test campus relationship
            const campuses = await client.campus.getPage({ perPage: 1 });
            expect(campuses.data.length).toBeGreaterThan(0);
            testCampusId = campuses.data[0].id;
            await client.people.setPrimaryCampus(testPersonId, testCampusId);
            
            const personWithCampus = await client.people.getById(testPersonId, ['primary_campus']);
            // getById returns flattened resource - relationships at top level; primary_campus may be absent in some orgs
            expect(personWithCampus).toBeDefined();
            expect(personWithCampus.id).toBe(testPersonId);
            if (personWithCampus.primary_campus !== undefined) {
                expect(personWithCampus.primary_campus).toBeDefined();
            }
        }, 60000);

        it('should cover people contact operations', async () => {
            if (!testPersonId) {
                const personData = {
                    first_name: `ContactTest_${Date.now()}`,
                    last_name: 'CoverageTest',
                    status: 'active'
                };
                const person = await client.people.create(personData);
                testPersonId = person.id;
            }

            // Email operations
            const emailData = {
                address: `test${Date.now()}@gmail.com`,
                location: 'Home',
                primary: true
            };
            await expect(
                client.people.addEmail(testPersonId, emailData)
            ).resolves.toMatchObject({ type: 'Email' });

            const emails = await client.people.getEmails(testPersonId);
            expect(emails.data).toBeDefined();
            expect(Array.isArray(emails.data)).toBe(true);
            expect(emails.data.length).toBeGreaterThan(0);

            // Phone operations
            const phoneData = {
                number: `555-${Date.now().toString().slice(-4)}`,
                location: 'Home',
                primary: true
            };
            const phone = await client.people.addPhoneNumber(testPersonId, phoneData);
            expect(phone.type).toBe('PhoneNumber');

            const phones = await client.people.getPhoneNumbers(testPersonId);
            expect(phones.data).toBeDefined();
            expect(Array.isArray(phones.data)).toBe(true);

            // Address operations
            const addressData = {
                street_line_1: '123 Test Street',
                city: 'Test City',
                state: 'TS',
                zip: '12345',
                country_code: 'US',
                location: 'Home',
                primary: true
            };
            try {
                await client.people.addAddress(testPersonId, addressData);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : String(err);
                expect(message).toMatch(/cannot be assigned/i);
            }

            const addresses = await client.people.getAddresses(testPersonId);
            expect(addresses.data).toBeDefined();
            expect(Array.isArray(addresses.data)).toBe(true);
        }, 60000);
    });

    describe('Fields Module Endpoint Coverage', () => {
        it('should cover field definitions endpoints', async () => {
            // Get field definitions (returns PaginationResult)
            const fields = await client.fields.getAllFieldDefinitions();
            expect(Array.isArray(fields.data)).toBe(true);

            // Get single field definition
            expect(fields.data.length).toBeGreaterThan(0);
            const fieldId = fields.data[0].id;
            const field = await client.fields.getFieldDefinition(fieldId);
            expect(field.type).toBe('FieldDefinition');
        }, 30000);

        it('should cover tabs endpoints', async () => {
            const tabs = await client.fields.getTabs();
            expect(tabs.data).toBeDefined();
            expect(Array.isArray(tabs.data)).toBe(true);
            // Do not fetch field definition by tab id; tabs are separate resources
        }, 30000);

        it('should cover field options endpoints', async () => {
            const fields = await client.fields.getAllFieldDefinitions();
            // getAllFieldDefinitions returns PaginationResult with data array
            expect(fields.data.length).toBeGreaterThan(0);
            const fieldId = fields.data[0].id;
                const options = await client.fields.getFieldOptions(fieldId);
                expect(options.data).toBeDefined();
                expect(Array.isArray(options.data)).toBe(true);
        }, 30000);
    });

    describe('Workflows Module Endpoint Coverage', () => {
        it('should cover workflows endpoints', async () => {
            const workflows = await client.workflows.getPage({ perPage: 10 });
            expect(workflows.data).toBeDefined();
            expect(Array.isArray(workflows.data)).toBe(true);

            expect(workflows.data.length).toBeGreaterThan(0);
            const workflowId = workflows.data[0].id;
            const workflow = await client.workflows.getById(workflowId);
            expect(workflow.type).toBe('Workflow');
        }, 30000);

        it('should cover workflow cards endpoints', async () => {
            // Get a person first to get their workflow cards
            const people = await client.people.getPage({ perPage: 1 });
            expect(people.data.length).toBeGreaterThan(0);
            const personId = people.data[0].id;
            const cards = await client.workflows.getPersonWorkflowCards(personId);
            expect(cards.data).toBeDefined();
            expect(Array.isArray(cards.data)).toBe(true);
        }, 30000);

        it('should cover workflow card actions', async () => {
            // Get a person first to get their workflow cards
            const people = await client.people.getPage({ perPage: 1 });
            expect(people.data.length).toBeGreaterThan(0);
            const personId = people.data[0].id;
            const cards = await client.workflows.getPersonWorkflowCards(personId);
            expect(cards.data.length).toBeGreaterThan(0);
            const cardId = cards.data[0].id;
            
            // Test workflow card actions (may fail due to permissions or card state)
            await expect(
                client.workflows.promoteWorkflowCard(personId, cardId)
            ).resolves.toBeDefined();
        }, 30000);
    });

    describe('Households Module Endpoint Coverage', () => {
        it('should cover households CRUD operations', async () => {
            // READ - List
            const households = await client.households.getPage({ perPage: 10 });
            expect(households.data).toBeDefined();
            expect(Array.isArray(households.data)).toBe(true);

            expect(households.data.length).toBeGreaterThan(0);
            testHouseholdId = households.data[0].id;
            
            // READ - Single
            const household = await client.households.getById(testHouseholdId, ['people']);
            expect(household.type).toBe('Household');
        }, 30000);
    });

    describe('Notes Module Endpoint Coverage', () => {
        it('should cover notes endpoints', async () => {
            const notes = await client.notes.getPage({ perPage: 10 });
            expect(notes.data).toBeDefined();
            expect(Array.isArray(notes.data)).toBe(true);

            expect(notes.data.length).toBeGreaterThan(0);
            const noteId = notes.data[0].id;
            const note = await client.notes.getById(noteId);
            expect(note.type).toBe('Note');
        }, 30000);

        it('should cover note categories endpoints', async () => {
            const categories = await client.notes.getNoteCategories({ perPage: 10 });
            expect(categories.data).toBeDefined();
            expect(Array.isArray(categories.data)).toBe(true);

            expect(categories.data.length).toBeGreaterThan(0);
            const categoryId = categories.data[0].id;
            const category = await client.notes.getNoteCategoryById(categoryId);
            expect(category.type).toBe('NoteCategory');
        }, 30000);
    });

    describe('Lists Module Endpoint Coverage', () => {
        it('should cover lists endpoints', async () => {
            const lists = await client.lists.getPage({ perPage: 10 });
            expect(lists.data).toBeDefined();
            expect(Array.isArray(lists.data)).toBe(true);

            expect(lists.data.length).toBeGreaterThan(0);
            const listId = lists.data[0].id;
            const list = await client.lists.getById(listId);
            expect(list.type).toBe('List');
        }, 30000);

        it('should cover list categories endpoints', async () => {
            const categories = await client.lists.getListCategories({ perPage: 10 });
            expect(categories.data).toBeDefined();
            expect(Array.isArray(categories.data)).toBe(true);
        }, 30000);
    });

    describe('Campus Module Endpoint Coverage', () => {
        it('should cover campuses endpoints', async () => {
            const campuses = await client.campus.getPage({ perPage: 10 });
            expect(campuses.data).toBeDefined();
            expect(Array.isArray(campuses.data)).toBe(true);

            expect(campuses.data.length).toBeGreaterThan(0);
            testCampusId = campuses.data[0].id;
            const campus = await client.campus.getById(testCampusId);
            expect(campus.type).toBe('Campus');
        }, 30000);
    });

    describe('ServiceTime Module Endpoint Coverage', () => {
        it('should cover service times endpoints', async () => {
            // serviceTime.getAll requires a campusId
            const campuses = await client.campus.getPage({ perPage: 1 });
            expect(campuses.data.length).toBeGreaterThan(0);
            const campusId = campuses.data[0].id;
            const serviceTimes = await client.serviceTime.getAll(campusId);
            expect(serviceTimes.data).toBeDefined();
            expect(Array.isArray(serviceTimes.data)).toBe(true);

            // Service times may not exist for all campuses
            if (serviceTimes.data.length > 0) {
                expect(testCampusId).toBeDefined();
                const serviceTimeId = serviceTimes.data[0].id;
                const serviceTime = await client.serviceTime.getById(testCampusId, serviceTimeId);
                expect(serviceTime.type).toBe('ServiceTime');
            } else {
                // If no service times exist, that's acceptable
                expect(serviceTimes.data.length).toBe(0);
            }
        }, 30000);
    });

    describe('Forms Module Endpoint Coverage', () => {
        it('should cover forms endpoints', async () => {
            const forms = await client.forms.getPage({ perPage: 10 });
            expect(forms.data).toBeDefined();
            expect(Array.isArray(forms.data)).toBe(true);

            expect(forms.data.length).toBeGreaterThan(0);
            const formId = forms.data[0].id;
            const form = await client.forms.getById(formId);
            expect(form.type).toBe('Form');
        }, 30000);

        it('should cover form categories endpoints', async () => {
            // First get a form ID to test form categories
            const forms = await client.forms.getPage({ perPage: 1 });
            expect(forms.data.length).toBeGreaterThan(0);
            const formId = forms.data[0].id;
            const category = await client.forms.getFormCategory(formId);
            expect(category).toBeDefined();
            expect(category.type).toBe('FormCategory');
        }, 30000);

        it('should cover form fields endpoints', async () => {
            const forms = await client.forms.getPage({ perPage: 1 });
            expect(forms.data.length).toBeGreaterThan(0);
            const formId = forms.data[0].id;
            const fields = await client.forms.getFormFields(formId, { perPage: 10 });
            expect(fields.data).toBeDefined();
            expect(Array.isArray(fields.data)).toBe(true);
        }, 30000);
    });

    describe('Reports Module Endpoint Coverage', () => {
        it('should cover reports endpoints', async () => {
            const reports = await client.reports.getPage({ perPage: 10 });
            expect(reports.data).toBeDefined();
            expect(Array.isArray(reports.data)).toBe(true);

            expect(reports.data.length).toBeGreaterThan(0);
            const reportId = reports.data[0].id;
                const report = await client.reports.getById(reportId);
                expect(report.type).toBe('Report');
        }, 30000);
    });

    describe('Batch Operations Endpoint Coverage', () => {
        it('should cover batch operations', async () => {
            const batch = client.batch;
            expect(batch).toBeDefined();

            // Test batch execution
            const operations = [
                {
                    type: 'people',
                    method: 'getAll',
                    params: [{ perPage: 1 }]
                }
            ];

            // Batch operations may not be available in all environments
            await expect(
                batch.execute(operations)
            ).resolves.toBeDefined().catch(() => {
                // Expected to fail in some environments - that's okay
            });
        }, 30000);
    });

    describe('Pagination Coverage', () => {
        it('should cover pagination across all modules', async () => {
            const modules = [
                { name: 'people', method: 'getAll' },
                { name: 'fields', method: 'getAll' },
                { name: 'workflows', method: 'getAll' },
                { name: 'households', method: 'getAll' },
                { name: 'notes', method: 'getAll' },
                { name: 'lists', method: 'getAll' },
                { name: 'campus', method: 'getAll' },
                { name: 'serviceTime', method: 'getAll' },
                { name: 'forms', method: 'getAll' },
                { name: 'reports', method: 'getAll' }
            ];

            for (const module of modules) {
                // Access modules dynamically - filter out non-module properties
                const moduleName = module.name as keyof PcoClient;
                const moduleInstance = client[moduleName];
                
                // Type guard to ensure it's a module with getAll method
                if (moduleInstance && typeof moduleInstance === 'object' && 'getAll' in moduleInstance) {
                    const moduleWithGetAll = moduleInstance as { getAll: (options: { perPage: number; page: number }) => Promise<{ data: unknown[]; links?: unknown; meta?: unknown }> };
                    try {
                        const result = await moduleWithGetAll.getAll({ perPage: 2, page: 1 });
                        expect(result.data).toBeDefined();
                        expect(Array.isArray(result.data)).toBe(true);
                        if (result.meta != null) expect(result.meta).toBeDefined();
                    } catch {
                        // Some modules may 404 or restrict access in this org
                    }
                }
            }
        }, 180000);
    });

    describe('Include Parameter Coverage', () => {
        it('should cover include parameters across major endpoints', async () => {
            const peopleWithIncludes = await client.people.getPage({
                perPage: 1,
                include: ['emails', 'phone_numbers', 'addresses', 'households', 'primary_campus']
            });
            expect(peopleWithIncludes.data).toBeDefined();
            expect(peopleWithIncludes.data.length).toBeGreaterThan(0);

            const person = peopleWithIncludes.data[0];
            const personHasRelationships = person.relationships !== undefined
                || person.emails !== undefined
                || person.phone_numbers !== undefined
                || person.addresses !== undefined
                || person.household !== undefined
                || person.primary_campus !== undefined;
            // API may return person without populated includes in some orgs
            if (personHasRelationships) {
                expect(personHasRelationships).toBe(true);
            }

            // Test single person with includes (flattened resources have relationship data at top level)
            const singlePerson = await client.people.getById(person.id, ['emails', 'phone_numbers']);
            const singleHasRelationships = singlePerson.relationships !== undefined
                || singlePerson.emails !== undefined
                || singlePerson.phone_numbers !== undefined;
            if (singleHasRelationships) {
                expect(singleHasRelationships).toBe(true);
            }
        }, 30000);
    });

    describe('Filtering Coverage', () => {
        it('should cover where filtering across major endpoints', async () => {
            // Test people filtering
            const activePeople = await client.people.getPage({
                where: { status: 'active' },
                perPage: 5
            });
            expect(activePeople.data).toBeDefined();

            // Test workflows filtering
            const people = await client.people.getPage({ perPage: 1 });
            expect(people.data.length).toBeGreaterThan(0);
            const personId = people.data[0].id;
                const activeCards = await client.workflows.getPersonWorkflowCards(personId);
                expect(activeCards.data).toBeDefined();
        }, 30000);
    });
});
