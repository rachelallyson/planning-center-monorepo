/**
 * Helpers API Integration Tests
 * 
 * Tests for src/helpers.ts functions:
 * - buildQueryParams, calculateAge, isValidEmail, isValidPhone, formatPersonName,
 *   formatDate, validatePersonData, getPrimaryContact, createPersonWithContact,
 *   searchPeople, getPeopleByHousehold, getCompletePersonProfile, getOrganizationInfo,
 *   getListsWithCategories, getPersonWorkflowCardsWithNotes, createWorkflowCardWithNote,
 *   exportAllPeopleData
 * 
 * To run: npm run test:integration:helpers
 */

import {
    PcoClient,
    type FlattenedPersonResource,
    calculateAge,
    isValidEmail,
    isValidPhone,
    formatPersonName,
    formatDate,
    validatePersonData,
    getPrimaryContact,
    createPersonWithContact,
    searchPeople,
    getPeopleByHousehold,
    getCompletePersonProfile,
    getOrganizationInfo,
    getListsWithCategories,
    getPersonWorkflowCardsWithNotes,
    createWorkflowCardWithNote,
    exportAllPeopleData,
    type PersonAttributes,
    type EmailAttributes,
    type PhoneNumberAttributes,
    type AddressAttributes,
    type WorkflowCardNoteAttributes,
} from '../../src';
import { buildQueryParams } from '@rachelallyson/planning-center-base-ts';
import { createTestClient, logAuthStatus } from './test-config';

// Test configuration
const TEST_PREFIX = 'TEST_INTEGRATION_2025';
const RATE_LIMIT_MAX = parseInt(process.env.PCO_RATE_LIMIT_MAX || '90');
const RATE_LIMIT_WINDOW = parseInt(process.env.PCO_RATE_LIMIT_WINDOW || '20000');
const ENV_WORKFLOW_ID = typeof process.env.PCO_TEST_WORKFLOW_ID === 'string' && process.env.PCO_TEST_WORKFLOW_ID.trim()
    ? process.env.PCO_TEST_WORKFLOW_ID.trim()
    : '';

describe('Helpers API Integration Tests', () => {
    let client: PcoClient;
    let testPersonId = ''
    let testHouseholdId = ''
    let testWorkflowId = ''

    beforeAll(async () => {
        // Use createTestClient() to ensure consistent credential loading
        logAuthStatus();
        client = createTestClient();

        // Get test data for helper functions
        const householdsResponse = await client.households.getPage({ perPage: 1 });
        expect(householdsResponse.data.length).toBeGreaterThan(0);
        testHouseholdId = householdsResponse.data[0].id;

        if (ENV_WORKFLOW_ID) {
            testWorkflowId = ENV_WORKFLOW_ID;
        } else {
            const workflowsResponse = await client.workflows.getPage({ perPage: 1 });
            expect(workflowsResponse.data.length).toBeGreaterThan(0);
            testWorkflowId = workflowsResponse.data[0].id;
        }
    }, 30000);

    afterAll(async () => {
        // Clean up test person
        if (testPersonId) {
            await client.people.delete(testPersonId);
            testPersonId = '';
        }
    }, 30000);

    describe('Utility Functions', () => {
        it('should build query params correctly', () => {
            const params = {
                where: { status: 'active', name: 'John' },
                include: ['emails', 'phone_numbers'],
                per_page: 10,
                page: 2,
            };

            const result = buildQueryParams(params);

            // buildQueryParams adds offset when page and per_page are present: offset = (page - 1) * per_page
            expect(result).toEqual({
                'where[status]': 'active',
                'where[name]': 'John',
                include: 'emails,phone_numbers',
                per_page: 10,
                page: 2,
                offset: 10,
            });
        });

        it('should calculate age correctly', () => {
            const birthdate = '1990-01-01';
            const age = calculateAge(birthdate);

            expect(typeof age).toBe('number');
            expect(age).toBeGreaterThan(30); // Should be around 34-35 years old
        });

        it('should validate email format', () => {
            expect(isValidEmail('test@gmail.com')).toBe(true);
            expect(isValidEmail('invalid-email')).toBe(false);
            expect(isValidEmail('test@')).toBe(false);
            expect(isValidEmail('@gmail.com')).toBe(false);
        });

        it('should validate phone format', () => {
            expect(isValidPhone('+1234567890')).toBe(true);
            expect(isValidPhone('1234567890')).toBe(true);
            expect(isValidPhone('(123) 456-7890')).toBe(true);
            expect(isValidPhone('123-456-7890')).toBe(true);
            expect(isValidPhone('invalid')).toBe(false);
            expect(isValidPhone('123')).toBe(false);
        });

        it('should format person name correctly', () => {
            expect(formatPersonName({ first_name: 'John', last_name: 'Doe' })).toBe('John Doe');
            expect(formatPersonName({ first_name: 'John' })).toBe('John');
            expect(formatPersonName({ last_name: 'Doe' })).toBe('Doe');
            expect(formatPersonName({ nickname: 'Johnny', first_name: 'John', last_name: 'Doe' })).toBe('Johnny Doe');
            expect(formatPersonName({})).toBe('Unknown');
        });

        it('should format date correctly', () => {
            const dateString = '2023-12-25T10:30:00Z';

            expect(formatDate(dateString, 'short')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
            expect(formatDate(dateString, 'long')).toMatch(/December \d{1,2}, 2023/);
            expect(formatDate(dateString, 'iso')).toBe('2023-12-25');
            expect(formatDate('invalid-date')).toBe('Invalid Date');
        });

        it('should validate person data', () => {
            const validData = {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john@gmail.com',
                phone: '+1234567890',
                birthdate: '1990-01-01',
            };

            const result = validatePersonData(validData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);

            const invalidData = {
                email: 'invalid-email',
                phone: 'invalid-phone',
                birthdate: 'invalid-date',
            };

            const invalidResult = validatePersonData(invalidData);
            expect(invalidResult.isValid).toBe(false);
            expect(invalidResult.errors.length).toBeGreaterThan(0);
        });
    });

    describe('API Helper Functions', () => {
        it('should create person with contact information', async () => {
            const timestamp = Date.now();
            const personData: Partial<PersonAttributes> = {
                first_name: `${TEST_PREFIX}_Helper_${timestamp}`,
                last_name: `${TEST_PREFIX}_Test_${timestamp}`,
                status: 'active',
            };

            const contactData = {
                email: {
                    address: `helper${timestamp}@planningcenteronline.com`,
                    location: 'home',
                    primary: true,
                },
                phone: {
                    number: `+1-555-${timestamp.toString().slice(-7)}`,
                    location: 'mobile',
                    primary: true,
                } ,
                address: {
                    street_line_1: `${timestamp} Helper Street`,
                    city: 'Helper City',
                    state: 'HC',
                    zip: '12345',
                    location: 'home',
                    primary: true,
                } 
            };

            const result = await createPersonWithContact(client, personData, contactData);

            expect(result.person).toBeDefined();
            expect(result.person.first_name).toBe(personData.first_name);
            expect(result.email).toBeDefined();
            expect(result.phone).toBeDefined();
            expect(result.address).toBeDefined();

            testPersonId = result.person.id || '';
        }, 30000);

        it('should get primary contact information', async () => {
            const primaryContact = await getPrimaryContact(client, testPersonId);

            expect(primaryContact).toHaveProperty('email');
            expect(primaryContact).toHaveProperty('phone');
            expect(primaryContact).toHaveProperty('address');

            // Should have at least one contact method
            expect(
                primaryContact.email || primaryContact.phone || primaryContact.address
            ).toBeTruthy();
        }, 30000);

        it('should search people by criteria', async () => {
            const searchResult = await searchPeople(client, {
                status: 'active',
                perPage: 5,
            });

            expect(searchResult).toHaveProperty('data');
            expect(Array.isArray(searchResult.data)).toBe(true);

            // All returned people should be active (flattened resources have status at top level)
            searchResult.data.forEach((person: FlattenedPersonResource & { attributes?: { status?: string }; status?: string }) => {
                expect(person.status).toBe('active');
            });
        }, 30000);

        it('should get people by household', async () => {
            expect(testHouseholdId).toBeDefined();
            const peopleByHousehold = await getPeopleByHousehold(client, testHouseholdId);

            expect(peopleByHousehold).toHaveProperty('data');
            expect(Array.isArray(peopleByHousehold.data)).toBe(true);

            // All returned people should belong to the specified household
            // getAll returns flattened resources - household is at top level
            peopleByHousehold.data.forEach((person) => {
                expect(person.id).toBeTruthy();
                const householdData = person.household;
                expect(householdData).toBeDefined();
                // household can be HouseholdResource or ResourceIdentifier
                if (householdData) {
                    expect(householdData).toHaveProperty('id');
                    if ('id' in householdData) {
                        expect(householdData.id).toBe(testHouseholdId);
                    }
                }
            });
        }, 120000);

        it('should get complete person profile', async () => {
            const completeProfile = await getCompletePersonProfile(client, testPersonId);

            expect(completeProfile).toHaveProperty('person');
            expect(completeProfile).toHaveProperty('emails');
            expect(completeProfile).toHaveProperty('phones');
            expect(completeProfile).toHaveProperty('addresses');
            expect(completeProfile).toHaveProperty('fieldData');
            expect(completeProfile).toHaveProperty('workflowCards');

            expect(completeProfile.person.id).toBe(testPersonId);
            expect(Array.isArray(completeProfile.emails.data)).toBe(true);
            expect(Array.isArray(completeProfile.phones.data)).toBe(true);
            expect(Array.isArray(completeProfile.addresses.data)).toBe(true);
            expect(Array.isArray(completeProfile.fieldData.data)).toBe(true);
            expect(Array.isArray(completeProfile.workflowCards.data)).toBe(true);
        }, 30000);

        it('should get organization info with statistics', async () => {
            const orgInfo = await getOrganizationInfo(client);

            expect(orgInfo).toHaveProperty('organization');
            expect(orgInfo).toHaveProperty('stats');
            expect(orgInfo.stats).toHaveProperty('totalPeople');
            expect(orgInfo.stats).toHaveProperty('totalHouseholds');
            expect(orgInfo.stats).toHaveProperty('totalLists');

            expect(orgInfo.organization !== undefined).toBe(true);
            if (orgInfo.organization != null) {
                expect(orgInfo.organization.type).toBe('Organization');
            }
            expect(typeof orgInfo.stats.totalPeople).toBe('number');
            expect(typeof orgInfo.stats.totalHouseholds).toBe('number');
            expect(typeof orgInfo.stats.totalLists).toBe('number');
        }, 30000);

        it('should get lists with categories', async () => {

            const listsWithCategories = await getListsWithCategories(client);

            expect(listsWithCategories).toHaveProperty('lists');
            expect(listsWithCategories).toHaveProperty('categories');

            expect(Array.isArray(listsWithCategories.lists.data)).toBe(true);
            expect(Array.isArray(listsWithCategories.categories.data)).toBe(true);

        }, 30000);

        it('should get person workflow cards with notes', async () => {
            const workflowCardsWithNotes = await getPersonWorkflowCardsWithNotes(client, testPersonId);

            expect(workflowCardsWithNotes).toHaveProperty('workflowCards');
            expect(workflowCardsWithNotes).toHaveProperty('notes');

            expect(Array.isArray(workflowCardsWithNotes.workflowCards.data)).toBe(true);
            expect(typeof workflowCardsWithNotes.notes).toBe('object');

            // Each workflow card should have a notes entry
            workflowCardsWithNotes.workflowCards.data.forEach((card) => {
                expect(workflowCardsWithNotes.notes).toHaveProperty(card.id);
                expect(workflowCardsWithNotes.notes[card.id]).toHaveProperty('data');
                expect(Array.isArray(workflowCardsWithNotes.notes[card.id].data)).toBe(true);
            });
        }, 30000);

        it('should create workflow card with note', async () => {
            expect(testPersonId).toBeDefined();
            expect(testWorkflowId).toBeDefined();

            const timestamp = Date.now();
            const noteData: Partial<WorkflowCardNoteAttributes> = {
                note: `Test workflow card note ${timestamp}`,
            };

            const result = await createWorkflowCardWithNote(client, testWorkflowId, testPersonId, noteData);

            expect(result).toHaveProperty('workflowCard');
            expect(result).toHaveProperty('note');

            expect(result.workflowCard.type).toBe('WorkflowCard');
            expect(result.note.type).toBe('WorkflowCardNote');
            expect(result.note.note).toBe(noteData.note);
        }, 30000);

        it('should export all people data', async () => {
            const exportData = await exportAllPeopleData(client, {
                includeInactive: false,
                includeFieldData: false,
                includeWorkflowCards: false,
            });

            expect(exportData).toHaveProperty('people');
            expect(exportData).toHaveProperty('households');
            expect(exportData).toHaveProperty('lists');
            expect(exportData).toHaveProperty('organization');
            expect(exportData).toHaveProperty('exportDate');
            expect(exportData).toHaveProperty('totalCount');

            expect(Array.isArray(exportData.people)).toBe(true);
            expect(Array.isArray(exportData.households)).toBe(true);
            expect(Array.isArray(exportData.lists)).toBe(true);
            expect(exportData.organization).toBeDefined();
            expect(typeof exportData.exportDate).toBe('string');
            expect(typeof exportData.totalCount).toBe('number');

            // All exported people should be active (flattened resources have status at top level)
            exportData.people.forEach((person: { attributes?: { status?: string }; status?: string }) => {
                expect(person.status).toBe('active');
            });
        }, 120000);
    });
});
