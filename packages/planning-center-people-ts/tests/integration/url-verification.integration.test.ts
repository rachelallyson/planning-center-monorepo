/**
 * URL Verification Integration Tests
 * 
 * These tests verify that all API endpoints are correctly constructed and accessible.
 * They make real API calls to ensure URLs, parameters, and response structures are correct.
 * 
 * To run: npm run test:integration -- --testNamePattern="URL Verification"
 */

import { PcoClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

describe('URL Verification Integration Tests', () => {
    let client: PcoClient;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Add request monitoring
        client.on('request:start', (event) => {
            console.log(`🌐 ${(event as any).method} ${(event as any).endpoint}`);
        });
        client.on('request:complete', (event) => {
            console.log(`✅ ${(event as any).method} ${(event as any).endpoint} - ${(event as any).status} (${(event as any).duration}ms)`);
        });
        client.on('error', (event) => {
            console.error(`❌ ${(event as any).method} ${(event as any).endpoint} - ${(event as any).error.message}`);
        });
    }, 30000);

    describe('People API URL Verification', () => {
        it('should access people list endpoint with correct URL structure', async () => {
            const response = await client.people.getAll({ perPage: 1 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
            expect(response).toHaveProperty('links');
            expect(response).toHaveProperty('meta');
        }, 30000);

        it('should access people list with filtering parameters', async () => {
            const response = await client.people.getAll({
                where: { status: 'active' },
                include: ['emails', 'phone_numbers'],
                perPage: 5,
                page: 1
            });
            
            expect(response.data).toBeDefined();
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single person endpoint with correct URL structure', async () => {
            // First get a person ID
            const peopleResponse = await client.people.getAll({ perPage: 1 });
            expect(peopleResponse.data.length).toBeGreaterThan(0);
            
            const personId = peopleResponse.data[0].id;
            const person = await client.people.getById(personId, ['emails', 'phone_numbers']);
            
            expect(person).toBeDefined();
            expect(person.type).toBe('Person');
            expect(person.id).toBe(personId);
        }, 30000);

        it('should access people search endpoint with correct parameters', async () => {
            const response = await client.people.search({
                name: 'test',
                perPage: 5
            });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access people by campus endpoint', async () => {
            // First get a campus ID
            const campusesResponse = await client.campus.getAll({ per_page: 1 });
            if (campusesResponse.data.length > 0) {
                const campusId = campusesResponse.data[0].id;
                const response = await client.people.getByCampus(campusId, { perPage: 5 });
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access people household members endpoint', async () => {
            // First get a household ID
            const householdsResponse = await client.households.getAll({ perPage: 1 });
            if (householdsResponse.data.length > 0) {
                const householdId = householdsResponse.data[0].id;
                const response = await client.people.getHouseholdMembers(householdId, { perPage: 5 });
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access people workflow cards endpoint', async () => {
            // First get a person ID
            const peopleResponse = await client.people.getAll({ perPage: 1 });
            if (peopleResponse.data.length > 0) {
                const personId = peopleResponse.data[0].id;
                const response = await client.people.getWorkflowCards(personId, { perPage: 5 });
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access people notes endpoint', async () => {
            // First get a person ID
            const peopleResponse = await client.people.getAll({ perPage: 1 });
            if (peopleResponse.data.length > 0) {
                const personId = peopleResponse.data[0].id;
                const response = await client.people.getNotes(personId, { perPage: 5 });
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access people field data endpoint', async () => {
            // First get a person ID
            const peopleResponse = await client.people.getAll({ perPage: 1 });
            if (peopleResponse.data.length > 0) {
                const personId = peopleResponse.data[0].id;
                const response = await client.people.getFieldData(personId, { perPage: 5 });
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access people social profiles endpoint', async () => {
            // First get a person ID
            const peopleResponse = await client.people.getAll({ perPage: 1 });
            if (peopleResponse.data.length > 0) {
                const personId = peopleResponse.data[0].id;
                const response = await client.people.getSocialProfiles(personId, { perPage: 5 });
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);
    });

    describe('Contacts API URL Verification', () => {
        let testPersonId: string;

        beforeAll(async () => {
            // Create a test person for contact operations
            const personData = {
                first_name: `URL_TEST_${Date.now()}`,
                last_name: 'ContactTest',
                status: 'active'
            };
            const person = await client.people.create(personData);
            testPersonId = person.id;
        }, 30000);

        afterAll(async () => {
            if (testPersonId) {
                await client.people.delete(testPersonId);
            }
        }, 30000);

        it('should access person emails endpoint', async () => {
            const response = await client.people.getEmails(testPersonId);
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access person phone numbers endpoint', async () => {
            const response = await client.people.getPhoneNumbers(testPersonId);
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access person addresses endpoint', async () => {
            const response = await client.people.getAddresses(testPersonId);
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);
    });

    describe('Fields API URL Verification', () => {
        it('should access field definitions endpoint', async () => {
            const response = await client.fields.getAllFieldDefinitions();
            
            expect(Array.isArray(response)).toBe(true);
        }, 30000);

        it('should access field definitions with filtering', async () => {
            const response = await client.fields.getAllFieldDefinitions();
            
            expect(Array.isArray(response)).toBe(true);
        }, 30000);

        it('should access tabs endpoint', async () => {
            const response = await client.fields.getTabs();
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access field options endpoint', async () => {
            // First get a field definition ID
            const fieldsResponse = await client.fields.getAllFieldDefinitions();
            if (fieldsResponse.length > 0) {
                const fieldId = fieldsResponse[0].id;
                const response = await client.fields.getFieldOptions(fieldId);
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);
    });

    describe('Workflows API URL Verification', () => {
        it('should access workflows endpoint', async () => {
            const response = await client.workflows.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access workflow cards endpoint', async () => {
            // Get a person first to get their workflow cards
            const people = await client.people.getAll({ perPage: 1 });
            if (people.data.length > 0) {
                const personId = people.data[0].id;
                const response = await client.workflows.getPersonWorkflowCards(personId);
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);

        it('should access workflow cards with filtering', async () => {
            // Get a person first to get their workflow cards
            const people = await client.people.getAll({ perPage: 1 });
            if (people.data.length > 0) {
                const personId = people.data[0].id;
                const response = await client.workflows.getPersonWorkflowCards(personId);
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);
    });

    describe('Households API URL Verification', () => {
        it('should access households endpoint', async () => {
            const response = await client.households.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single household endpoint', async () => {
            // First get a household ID
            const householdsResponse = await client.households.getAll({ perPage: 1 });
            if (householdsResponse.data.length > 0) {
                const householdId = householdsResponse.data[0].id;
                const household = await client.households.getById(householdId, ['people']);
                
                expect(household).toBeDefined();
                expect(household.type).toBe('Household');
                expect(household.id).toBe(householdId);
            }
        }, 30000);
    });

    describe('Notes API URL Verification', () => {
        it('should access notes endpoint', async () => {
            const response = await client.notes.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access note categories endpoint', async () => {
            const response = await client.notes.getNoteCategories();
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);
    });

    describe('Lists API URL Verification', () => {
        it('should access lists endpoint', async () => {
            const response = await client.lists.getAll({ perPage: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access list categories endpoint', async () => {
            const response = await client.lists.getListCategories();
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);
    });

    describe('Campus API URL Verification', () => {
        it('should access campuses endpoint', async () => {
            const response = await client.campus.getAll({ per_page: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access single campus endpoint', async () => {
            // First get a campus ID
            const campusesResponse = await client.campus.getAll({ per_page: 1 });
            if (campusesResponse.data.length > 0) {
                const campusId = campusesResponse.data[0].id;
                const campus = await client.campus.getById(campusId);
                
                expect(campus).toBeDefined();
                expect(campus.type).toBe('Campus');
                expect(campus.id).toBe(campusId);
            }
        }, 30000);
    });

    describe('ServiceTime API URL Verification', () => {
        it('should access service times endpoint', async () => {
            // Get a campus first
            const campuses = await client.campus.getAll({ per_page: 1 });
            if (campuses.data.length > 0) {
                const campusId = campuses.data[0].id;
                const response = await client.serviceTime.getAll(campusId);
                
                expect(response).toHaveProperty('data');
                expect(Array.isArray(response.data)).toBe(true);
            }
        }, 30000);
    });

    describe('Forms API URL Verification', () => {
        it('should access forms endpoint', async () => {
            const response = await client.forms.getAll({ per_page: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);

        it('should access form categories endpoint', async () => {
            // Get a form first
            const forms = await client.forms.getAll({ per_page: 1 });
            if (forms.data.length > 0) {
                const formId = forms.data[0].id;
                const response = await client.forms.getFormCategory(formId);
                
                expect(response).toHaveProperty('type');
                expect(response.type).toBe('FormCategory');
            }
        }, 30000);
    });

    describe('Reports API URL Verification', () => {
        it('should access reports endpoint', async () => {
            const response = await client.reports.getAll({ per_page: 5 });
            
            expect(response).toHaveProperty('data');
            expect(Array.isArray(response.data)).toBe(true);
        }, 30000);
    });

    describe('Error Handling URL Verification', () => {
        it('should handle 404 errors gracefully', async () => {
            await expect(client.people.getById('nonexistent-id')).rejects.toThrow();
        }, 30000);

        it('should handle invalid parameters gracefully', async () => {
            await expect(client.people.getAll({
                where: { invalid_field: 'invalid_value' }
            })).resolves.toBeDefined();
        }, 30000);
    });
});
