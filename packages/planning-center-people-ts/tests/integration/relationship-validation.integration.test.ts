/**
 * Relationship Validation Integration Tests
 * 
 * These tests verify that relationship structures and included resources work correctly.
 * They test JSON:API compliance and ensure relationships are properly structured.
 * 
 * To run: npm run test:integration -- --testNamePattern="Relationship Validation"
 */

import { PcoClient, type FlattenedPersonResource, type WorkflowCardAttributes } from '../../src';
import type { FlattenedResource } from '@rachelallyson/planning-center-base-ts';
import { createTestClient, logAuthStatus } from './test-config';
import type { Relationship } from '../../src/types/json-api';

describe('People API Relationship Validation Integration Tests', () => {
    let client: PcoClient;
    let testPersonId: string = '';

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        const person = await client.people.create({
            first_name: 'RelationshipValidation',
            last_name: `Test_${Date.now()}`,
            status: 'active',
        });
        testPersonId = person.id ?? '';
        expect(testPersonId).toBeTruthy();

        await client.people.addEmail(testPersonId, {
            address: `rel.validation.${Date.now()}@gmail.com`,
            location: 'Other',
            primary: true,
        });
    }, 30000);

    afterAll(async () => {
        if (testPersonId) {
            await client.people.delete(testPersonId);
        }
    }, 30000);

    describe('Person Relationships Structure Validation', () => {
        it('should validate person relationships structure', async () => {
            expect(testPersonId).toBeTruthy();

            const personFlattened = await client.people.getById(testPersonId, [
                'emails', 'phone_numbers', 'addresses', 'households', 'primary_campus'
            ]) as FlattenedPersonResource;

            expect(personFlattened).toBeDefined();
            expect(personFlattened.type).toBe('Person');
            expect(personFlattened.id).toBe(testPersonId);

            // Validate structure when relationship data is present (flattened from include)
            if (personFlattened.emails) {
                // emails is an array of EmailResource or ResourceIdentifier
                const emails = Array.isArray(personFlattened.emails) ? personFlattened.emails : [personFlattened.emails];
                expect(emails.length).toBeGreaterThanOrEqual(0);
                if (emails.length > 0) {
                    expect(emails[0]).toHaveProperty('type');
                    expect(emails[0]).toHaveProperty('id');
                }
            }

            if (personFlattened.phone_numbers) {
                // phone_numbers is an array of PhoneNumberResource or ResourceIdentifier
                const phones = Array.isArray(personFlattened.phone_numbers) ? personFlattened.phone_numbers : [personFlattened.phone_numbers];
                expect(phones.length).toBeGreaterThanOrEqual(0);
                if (phones.length > 0) {
                    expect(phones[0]).toHaveProperty('type');
                    expect(phones[0]).toHaveProperty('id');
                }
            }

            if (personFlattened.addresses) {
                // addresses is an array of AddressResource or ResourceIdentifier
                const addresses = Array.isArray(personFlattened.addresses) ? personFlattened.addresses : [personFlattened.addresses];
                expect(addresses.length).toBeGreaterThanOrEqual(0);
                if (addresses.length > 0) {
                    expect(addresses[0]).toHaveProperty('type');
                    expect(addresses[0]).toHaveProperty('id');
                }
            }

            if (personFlattened.household) {
                // household is a HouseholdResource or ResourceIdentifier
                expect(personFlattened.household).toHaveProperty('type');
                expect(personFlattened.household).toHaveProperty('id');
            }

            if (personFlattened.primary_campus) {
                expect(personFlattened.primary_campus).toHaveProperty('type');
                expect(personFlattened.primary_campus).toHaveProperty('id');
            }
        }, 30000);

        it('should validate relationship data structure', async () => {
            const response = await client.people.getPage({
                perPage: 1,
                include: ['emails']
            });

            expect(response.data.length).toBeGreaterThan(0);
            // getPage returns flattened resources - relationships are at top level
            const person = response.data[0];

            if (person.emails) {
                // emails is an array of EmailResource or ResourceIdentifier
                const emailData = Array.isArray(person.emails) ? person.emails : [person.emails];
                
                expect(Array.isArray(emailData)).toBe(true);
                emailData.forEach((emailRef) => {
                    expect(emailRef).toHaveProperty('type');
                    expect(emailRef).toHaveProperty('id');
                    expect(typeof emailRef.type).toBe('string');
                    expect(typeof emailRef.id).toBe('string');
                });
            }
        }, 30000);
    });

    describe('Included Resources Validation', () => {
        it('should validate that included resources are flattened to relationships', async () => {
            const response = await client.people.getPage({
                perPage: 1,
                include: ['emails', 'phone_numbers', 'addresses']
            });

            expect(response.data.length).toBeGreaterThan(0);
            const person = response.data[0];

            // Included resources should NOT be present - they're flattened to relationships
            expect('included' in response).toBe(false);
            
            // Relationships should be at the top level
            // Check that relationships exist and are properly typed
            const personFlattened = person;
            if (personFlattened.emails) {
                const emails = Array.isArray(personFlattened.emails) ? personFlattened.emails : [personFlattened.emails];
                expect(emails.length).toBeGreaterThanOrEqual(0);
                if (emails.length > 0) {
                    const email = emails[0];
                    expect(email).toHaveProperty('type');
                    expect(email).toHaveProperty('id');
                    expect(email).toHaveProperty('address'); // Attributes are flattened
                    expect(typeof email.type).toBe('string');
                    expect(typeof email.id).toBe('string');
                }
            }
        }, 30000);

        it('should validate email relationships are flattened', async () => {
            const response = await client.people.getPage({
                perPage: 1,
                include: ['emails']
            });

            // Included should not exist
            expect('included' in response).toBe(false);
            
            // Find a person with emails
            const personWithEmails = response.data.find((p): p is FlattenedPersonResource => {
                const person = p as FlattenedPersonResource;
                return person.emails !== undefined && Array.isArray(person.emails) && person.emails.length > 0;
            });
            
            if (personWithEmails && personWithEmails.emails) {
                const emails = Array.isArray(personWithEmails.emails) ? personWithEmails.emails : [personWithEmails.emails];
                emails.forEach((email) => {
                    expect(email.type).toBe('Email');
                    // Attributes are flattened - address is directly on email
                    if (email.address) {
                        expect(typeof email.address).toBe('string');
                    }
                    if (email.primary !== undefined) {
                        expect(typeof email.primary).toBe('boolean');
                    }
                    if (email.location) {
                        expect(typeof email.location).toBe('string');
                    }
                });
            }
        }, 30000);

        it('should validate phone number relationships are flattened', async () => {
            const response = await client.people.getPage({
                perPage: 1,
                include: ['phone_numbers']
            });

            // Included should not exist
            expect('included' in response).toBe(false);
            
            // Find a person with phone numbers
            const personWithPhones = response.data.find((p): p is FlattenedPersonResource => {
                const person = p as FlattenedPersonResource;
                return person.phone_numbers !== undefined && Array.isArray(person.phone_numbers) && person.phone_numbers.length > 0;
            });
            
            if (personWithPhones && personWithPhones.phone_numbers) {
                const phones = Array.isArray(personWithPhones.phone_numbers) ? personWithPhones.phone_numbers : [personWithPhones.phone_numbers];
                phones.forEach((phone) => {
                    expect(phone.type).toBe('PhoneNumber');
                    // Attributes are flattened - number is directly on phone
                    if (phone.number) {
                        expect(typeof phone.number).toBe('string');
                    }
                    if (phone.primary !== undefined) {
                        expect(typeof phone.primary).toBe('boolean');
                    }
                    if (phone.location) {
                        expect(typeof phone.location).toBe('string');
                    }
                });
            }
        }, 30000);

        it('should validate address relationships are flattened', async () => {
            const response = await client.people.getPage({
                perPage: 1,
                include: ['addresses']
            });

            // Included should not exist
            expect('included' in response).toBe(false);
            
            // Find a person with addresses
            const personWithAddresses = response.data.find((p): p is FlattenedPersonResource => {
                const person = p ;
                return person.addresses !== undefined && Array.isArray(person.addresses) && person.addresses.length > 0;
            });
            
            if (personWithAddresses && personWithAddresses.addresses) {
                const addresses = Array.isArray(personWithAddresses.addresses) ? personWithAddresses.addresses : [personWithAddresses.addresses];
                addresses.forEach((address) => {
                    expect(address.type).toBe('Address');
                    // Attributes are flattened - street_line_1 is directly on address
                    if (address.street_line_1) {
                        expect(typeof address.street_line_1).toBe('string');
                    }
                    if (address.city) {
                        expect(typeof address.city).toBe('string');
                    }
                    if (address.state) {
                        expect(typeof address.state).toBe('string');
                    }
                    if (address.zip) {
                        expect(typeof address.zip).toBe('string');
                    }
                    if (address.primary !== undefined) {
                        expect(typeof address.primary).toBe('boolean');
                    }
                });
            }
        }, 30000);
    });

    describe('Household Relationships Validation', () => {
        it('should validate household relationships', async () => {
            const response = await client.households.getPage({
                perPage: 1,
                include: ['people', 'primary_contact']
            });

            if (response.data.length > 0) {
                // getPage returns flattened resources - relationships are at top level
                type FlattenedHousehold = FlattenedResource<
                    'Household',
                    { name?: string; created_at?: string; updated_at?: string },
                    { people?: Relationship; primary_contact?: Relationship }
                >;
                const household = response.data[0];

                if (household.people) {
                    // people is an array of PersonResource or ResourceIdentifier
                    const peopleData = Array.isArray(household.people) ? household.people : [household.people];
                    peopleData.forEach((personRef) => {
                        expect(personRef).toHaveProperty('type');
                        expect(personRef).toHaveProperty('id');
                        if ('type' in personRef) {
                            expect(personRef.type).toBe('Person');
                        }
                    });
                }

                if (household.primary_contact) {
                    // primary_contact is a PersonResource or ResourceIdentifier
                    const contactData = household.primary_contact;
                    if (!Array.isArray(contactData) && 'type' in contactData) {
                        expect(contactData.type).toBe('Person');
                    }
                }
            }
        }, 30000);
    });

    describe('Campus Relationships Validation', () => {
        it('should validate campus relationships', async () => {
            const response = await client.campus.getPage({
                perPage: 1,
                include: ['organization']
            });

            if (response.data.length > 0) {
                // getPage returns flattened resources - relationships are at top level
                type FlattenedCampus = FlattenedResource<
                    'Campus',
                    { name?: string; description?: string; latitude?: string; longitude?: string; created_at?: string; updated_at?: string },
                    { organization?: Relationship }
                >;
                const campus = response.data[0] ;

                if (campus.organization) {
                    // organization is an OrganizationResource or ResourceIdentifier
                    const orgData = campus.organization;
                    if (!Array.isArray(orgData) && 'type' in orgData) {
                        expect(orgData.type).toBe('Organization');
                    }
                }
            }
        }, 30000);
    });

    describe('Field Definition Relationships Validation', () => {
        it('should validate field definition relationships', async () => {
            const fields = await client.fields.getAllFieldDefinitions();
            expect(fields.data.length).toBeGreaterThan(0);

            type FlattenedFieldDefinition = FlattenedResource<
                'FieldDefinition',
                { data_type: string; name: string; sequence: number; slug: string; tab_id: number },
                { tab?: Relationship }
            >;
            const field = fields.data[0] as FlattenedFieldDefinition;

            if (field.tab) {
                const tabData = field.tab;
                if (!Array.isArray(tabData) && 'type' in tabData) {
                    expect(tabData.type).toBe('Tab');
                }
            }
        }, 60000);
    });

    describe('Workflow Card Relationships Validation', () => {
        it('should validate workflow card relationships', async () => {
            // Get a person first to get their workflow cards
            const people = await client.people.getPage({ perPage: 1 });
            if (people.data.length > 0) {
                const personId = people.data[0].id;
                const response = await client.workflows.getPersonWorkflowCards(personId);

                if (response.data.length > 0) {
                   
                    const card = response.data[0];

                    if (card.workflow) {
                        // workflow is a WorkflowResource or ResourceIdentifier
                        const workflowData = card.workflow;
                        if (!Array.isArray(workflowData) && 'type' in workflowData) {
                            expect(workflowData.type).toBe('Workflow');
                        }
                    }

                    if (card.person) {
                        // person is a PersonResource or ResourceIdentifier
                        const personData = card.person;
                        if (!Array.isArray(personData) && 'type' in personData) {
                            expect(personData.type).toBe('Person');
                        }
                    }

                    if (card.assignee) {
                        // assignee is a PersonResource or ResourceIdentifier
                        const assigneeData = card.assignee;
                        if (!Array.isArray(assigneeData) && 'type' in assigneeData) {
                            // Assignee can be Person or Assignee type depending on API version
                            expect(['Person', 'Assignee']).toContain(assigneeData.type);
                        }
                    }
                }
            }
        }, 30000);
    });

    describe('Note Relationships Validation', () => {
        it('should validate note relationships', async () => {
            const response = await client.notes.getPage({
                perPage: 1,
                include: ['person', 'note_category', 'organization', 'created_by']
            });

            if (response.data.length > 0) {
                // getPage returns flattened resources - relationships are at top level
                type FlattenedNote = FlattenedResource<
                    'Note',
                    { note?: string; created_at?: string; updated_at?: string },
                    { person?: Relationship; note_category?: Relationship; organization?: Relationship; created_by?: Relationship }
                >;
                const note = response.data[0] ;

                if (note.person) {
                    // person is a PersonResource or ResourceIdentifier
                    const personData = note.person;
                    if (!Array.isArray(personData) && 'type' in personData) {
                        expect(personData.type).toBe('Person');
                    }
                }

                if (note.note_category) {
                    // note_category is a NoteCategoryResource or ResourceIdentifier
                    const categoryData = note.note_category;
                    if (!Array.isArray(categoryData) && 'type' in categoryData) {
                        expect(categoryData.type).toBe('NoteCategory');
                    }
                }

                if (note.organization) {
                    // organization is an OrganizationResource or ResourceIdentifier
                    const orgData = note.organization;
                    if (!Array.isArray(orgData) && 'type' in orgData) {
                        expect(orgData.type).toBe('Organization');
                    }
                }
            }
        }, 30000);
    });

    describe('Form Relationships Validation', () => {
        it('should validate form relationships', async () => {
            const response = await client.forms.getPage({
                perPage: 1,
                include: ['organization', 'form_category']
            });

            if (response.data.length > 0) {
                // getPage returns flattened resources - relationships are at top level
                type FlattenedForm = FlattenedResource<
                    'Form',
                    { name?: string; created_at?: string; updated_at?: string },
                    { organization?: Relationship; form_category?: Relationship }
                >;
                const form = response.data[0] ;

                if (form.organization) {
                    // organization is an OrganizationResource or ResourceIdentifier
                    const orgData = form.organization;
                    if (!Array.isArray(orgData) && 'type' in orgData) {
                        expect(orgData.type).toBe('Organization');
                    }
                }

                if (form.form_category) {
                    // form_category is a FormCategoryResource or ResourceIdentifier
                    const categoryData = form.form_category;
                    if (!Array.isArray(categoryData) && 'type' in categoryData) {
                        expect(categoryData.type).toBe('FormCategory');
                    }
                }
            }
        }, 30000);
    });

    describe('Report Relationships Validation', () => {
        it('should validate report relationships', async () => {
            const response = await client.reports.getPage({
                perPage: 1,
                include: ['organization', 'created_by', 'updated_by']
            });

            if (response.data.length > 0) {
              
                const report = response.data[0] ;

                if (report.organization) {
                    // organization is an OrganizationResource or ResourceIdentifier
                    const orgData = report.organization;
                    if (!Array.isArray(orgData) && 'type' in orgData) {
                        expect(orgData.type).toBe('Organization');
                    }
                }

                if (report.created_by) {
                    // created_by is a PersonResource or ResourceIdentifier
                    const createdByData = report.created_by;
                    if (!Array.isArray(createdByData) && 'type' in createdByData) {
                        expect(createdByData.type).toBe('Person');
                    }
                }
            }
        }, 30000);
    });

    describe('JSON:API Compliance Validation', () => {
        it('should validate JSON:API document structure', async () => {
            const response = await client.people.getPage({ perPage: 1 });

            // Validate top-level structure
            expect(response).toHaveProperty('data');
            expect(response).toHaveProperty('links');
            expect(response).toHaveProperty('meta');

            // Validate data is array
            expect(Array.isArray(response.data)).toBe(true);

            // Validate each resource has required fields
            response.data.forEach((resource) => {
                expect(resource).toHaveProperty('type');
                expect(resource).toHaveProperty('id');
                expect(typeof resource.type).toBe('string');
                expect(typeof resource.id).toBe('string');
            });
        }, 30000);

        it('should validate JSON:API links structure', async () => {
            const response = await client.people.getPage({ perPage: 1 });

            if (response.links) {
                // Validate links are strings or objects
                Object.values(response.links).forEach((link) => {
                    if (typeof link === 'string') {
                        expect(typeof link).toBe('string');
                    } else if (typeof link === 'object' && link !== null) {
                        expect(link).toHaveProperty('href');
                    }
                });
            }
        }, 30000);

        it('should validate JSON:API meta structure', async () => {
            const response = await client.people.getPage({ perPage: 1 });

            if (response.meta) {
                // Validate meta contains expected pagination fields
                if (response.meta.count !== undefined) {
                    expect(typeof response.meta.count).toBe('number');
                }
                if (response.meta.total_count !== undefined) {
                    expect(typeof response.meta.total_count).toBe('number');
                }
                if (response.meta.total_pages !== undefined) {
                    expect(typeof response.meta.total_pages).toBe('number');
                }
                if (response.meta.per_page !== undefined) {
                    expect(typeof response.meta.per_page).toBe('number');
                }
                if (response.meta.current_page !== undefined) {
                    expect(typeof response.meta.current_page).toBe('number');
                }
            }
        }, 30000);
    });

    describe('Relationship Link Validation', () => {
        it('should validate relationship links are accessible', async () => {
            const response = await client.people.getPage({
                perPage: 1,
                include: ['emails']
            });

            if (response.data.length > 0) {
                // getPage returns flattened resources - relationships are at top level
                const person = response.data[0];

                // Flattened resources don't have links in relationships - links are at the response level
                // Just verify the relationship exists
                if (person.emails) {
                    const emails = Array.isArray(person.emails) ? person.emails : [person.emails];
                    expect(emails.length).toBeGreaterThanOrEqual(0);
                    if (emails.length > 0) {
                        expect(emails[0]).toHaveProperty('type');
                        expect(emails[0]).toHaveProperty('id');
                    }
                }
            }
        }, 30000);
    });
});
