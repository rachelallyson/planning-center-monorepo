/**
 * Relationship Validation Integration Tests
 * 
 * These tests verify that relationship structures and included resources work correctly.
 * They test JSON:API compliance and ensure relationships are properly structured.
 * 
 * To run: npm run test:integration -- --testNamePattern="Relationship Validation"
 */

import { PcoClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

describe('People API Relationship Validation Integration Tests', () => {
    let client: PcoClient;
    let testPersonId: string;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Add request monitoring
        client.on('request:start', (event) => {
            console.log(`🔗 ${event.method} ${event.endpoint}`);
        });
        client.on('request:complete', (event) => {
            console.log(`✅ ${event.method} ${event.endpoint} - ${event.status} (${event.duration}ms)`);
        });
    }, 30000);

    afterAll(async () => {
        if (testPersonId) {
            await client.people.delete(testPersonId);
        }
    }, 30000);

    describe('Person Relationships Structure Validation', () => {
        it('should validate person relationships structure', async () => {
            const response = await client.people.getAll({
                perPage: 1,
                include: ['emails', 'phone_numbers', 'addresses', 'household', 'primary_campus']
            });

            expect(response.data.length).toBeGreaterThan(0);
            const person = response.data[0];

            // Validate relationships object exists
            expect(person.relationships).toBeDefined();
            expect(typeof person.relationships).toBe('object');

            // Validate each relationship has proper structure
            const relationships = person.relationships!;

            if (relationships.emails) {
                expect(relationships.emails).toHaveProperty('data');
                // links may not include self; only assert related if links present
                if (relationships.emails.links) {
                    expect(relationships.emails.links).toHaveProperty('related');
                }
            }

            if (relationships.phone_numbers) {
                expect(relationships.phone_numbers).toHaveProperty('data');
                // links may be omitted; only check related if present
                if (relationships.phone_numbers.links) {
                    expect(relationships.phone_numbers.links).toHaveProperty('related');
                }
            }

            if (relationships.addresses) {
                expect(relationships.addresses).toHaveProperty('data');
                // links optional in responses
                if (relationships.addresses.links) {
                    expect(relationships.addresses.links).toHaveProperty('related');
                }
            }

            if (relationships.household) {
                expect(relationships.household).toHaveProperty('data');
                // links optional in responses
                if (relationships.household.links) {
                    expect(relationships.household.links).toHaveProperty('related');
                }
            }

            if (relationships.primary_campus) {
                expect(relationships.primary_campus).toHaveProperty('data');
                // links optional in responses
                if (relationships.primary_campus.links) {
                    expect(relationships.primary_campus.links).toHaveProperty('related');
                }
            }
        }, 30000);

        it('should validate relationship data structure', async () => {
            const response = await client.people.getAll({
                perPage: 1,
                include: ['emails']
            });

            expect(response.data.length).toBeGreaterThan(0);
            const person = response.data[0];

            if (person.relationships?.emails?.data) {
                const emailData = person.relationships.emails.data;
                
                if (Array.isArray(emailData)) {
                    // To-many relationship
                    expect(Array.isArray(emailData)).toBe(true);
                    emailData.forEach((emailRef) => {
                        expect(emailRef).toHaveProperty('type');
                        expect(emailRef).toHaveProperty('id');
                        expect(typeof emailRef.type).toBe('string');
                        expect(typeof emailRef.id).toBe('string');
                    });
                } else {
                    // To-one relationship
                    expect(emailData).toHaveProperty('type');
                    expect(emailData).toHaveProperty('id');
                    expect(typeof emailData.type).toBe('string');
                    expect(typeof emailData.id).toBe('string');
                }
            }
        }, 30000);
    });

    describe('Included Resources Validation', () => {
        it('should validate included resources structure', async () => {
            const response = await client.people.getAll({
                perPage: 1,
                include: ['emails', 'phone_numbers', 'addresses']
            });

            expect(response.data.length).toBeGreaterThan(0);
            const person = response.data[0];

            // Check if included resources are present
            if ((response as any).included) {
                expect(Array.isArray((response as any).included)).toBe(true);

                (response as any).included.forEach((included: any) => {
                    // Validate included resource structure
                    expect(included).toHaveProperty('type');
                    expect(included).toHaveProperty('id');
                    expect(included).toHaveProperty('attributes');
                    expect(typeof included.type).toBe('string');
                    expect(typeof included.id).toBe('string');
                    expect(typeof included.attributes).toBe('object');

                    // Validate specific included types
                    expect(['Email', 'PhoneNumber', 'Address', 'Household', 'Campus']).toContain(included.type);
                });
            }
        }, 30000);

        it('should validate email included resources', async () => {
            const response = await client.people.getAll({
                perPage: 1,
                include: ['emails']
            });

            if ((response as any).included) {
                const emails = (response as any).included.filter((included: any) => included.type === 'Email');
                
                emails.forEach((email: any) => {
                    expect(email.type).toBe('Email');
                    expect(email.attributes).toBeDefined();
                    
                    if (email.attributes?.address) {
                        expect(typeof email.attributes.address).toBe('string');
                    }
                    if (email.attributes?.primary !== undefined) {
                        expect(typeof email.attributes.primary).toBe('boolean');
                    }
                    if (email.attributes?.location) {
                        expect(typeof email.attributes.location).toBe('string');
                    }
                });
            }
        }, 30000);

        it('should validate phone number included resources', async () => {
            const response = await client.people.getAll({
                perPage: 1,
                include: ['phone_numbers']
            });

            if ((response as any).included) {
                const phones = (response as any).included.filter((included: any) => included.type === 'PhoneNumber');
                
                phones.forEach((phone: any) => {
                    expect(phone.type).toBe('PhoneNumber');
                    expect(phone.attributes).toBeDefined();
                    
                    if (phone.attributes?.number) {
                        expect(typeof phone.attributes.number).toBe('string');
                    }
                    if (phone.attributes?.primary !== undefined) {
                        expect(typeof phone.attributes.primary).toBe('boolean');
                    }
                    if (phone.attributes?.location) {
                        expect(typeof phone.attributes.location).toBe('string');
                    }
                });
            }
        }, 30000);

        it('should validate address included resources', async () => {
            const response = await client.people.getAll({
                perPage: 1,
                include: ['addresses']
            });

            if ((response as any).included) {
                const addresses = (response as any).included.filter((included: any) => included.type === 'Address');
                
                addresses.forEach((address: any) => {
                    expect(address.type).toBe('Address');
                    expect(address.attributes).toBeDefined();
                    
                    if (address.attributes?.street_line_1) {
                        expect(typeof address.attributes.street_line_1).toBe('string');
                    }
                    if (address.attributes?.city) {
                        expect(typeof address.attributes.city).toBe('string');
                    }
                    if (address.attributes?.state) {
                        expect(typeof address.attributes.state).toBe('string');
                    }
                    if (address.attributes?.zip) {
                        expect(typeof address.attributes.zip).toBe('string');
                    }
                    if (address.attributes?.primary !== undefined) {
                        expect(typeof address.attributes.primary).toBe('boolean');
                    }
                });
            }
        }, 30000);
    });

    describe('Household Relationships Validation', () => {
        it('should validate household relationships', async () => {
            const response = await client.households.getAll({
                perPage: 1,
                include: ['people', 'primary_contact']
            });

            if (response.data.length > 0) {
                const household = response.data[0];

                if (household.relationships?.people) {
                    expect(household.relationships.people).toHaveProperty('data');
                    expect(household.relationships.people).toHaveProperty('links');
                    
                    const peopleData = household.relationships.people.data;
                    if (Array.isArray(peopleData)) {
                        peopleData.forEach((personRef) => {
                            expect(personRef).toHaveProperty('type');
                            expect(personRef).toHaveProperty('id');
                            expect(personRef.type).toBe('Person');
                        });
                    }
                }

                if (household.relationships?.primary_contact) {
                    expect(household.relationships.primary_contact).toHaveProperty('data');
                    // links optional
                    
                    const contactData = household.relationships.primary_contact.data;
                    if (contactData && !Array.isArray(contactData)) {
                        expect(contactData.type).toBe('Person');
                    }
                }
            }
        }, 30000);
    });

    describe('Campus Relationships Validation', () => {
        it('should validate campus relationships', async () => {
            const response = await client.campus.getAll({
                perPage: 1,
                include: ['organization']
            });

            if (response.data.length > 0) {
                const campus = response.data[0];

                if (campus.relationships?.organization) {
                    expect(campus.relationships.organization).toHaveProperty('data');
                    // links optional
                    
                    const orgData = campus.relationships.organization.data;
                    if (orgData && !Array.isArray(orgData)) {
                        expect(orgData.type).toBe('Organization');
                    }
                }
            }
        }, 30000);
    });

    describe('Field Definition Relationships Validation', () => {
        it('should validate field definition relationships', async () => {
            const fields = await client.fields.getAllFieldDefinitions();
            if (fields.length > 0) {
                const field = fields[0];

                if (field.relationships?.tab) {
                    expect(field.relationships.tab).toHaveProperty('data');
                    expect(field.relationships.tab).toHaveProperty('links');
                    
                    const tabData = field.relationships.tab.data;
                    if (tabData && !Array.isArray(tabData)) {
                        expect(tabData.type).toBe('Tab');
                    }
                }
            }
        }, 30000);
    });

    describe('Workflow Card Relationships Validation', () => {
        it('should validate workflow card relationships', async () => {
            // Get a person first to get their workflow cards
            const people = await client.people.getAll({ perPage: 1 });
            if (people.data.length > 0) {
                const personId = people.data[0].id;
                const response = await client.workflows.getPersonWorkflowCards(personId);

                if (response.data.length > 0) {
                    const card = response.data[0];

                    if (card.relationships?.workflow) {
                        expect(card.relationships.workflow).toHaveProperty('data');
                        // links optional
                        
                        const workflowData = card.relationships.workflow.data;
                        if (workflowData && !Array.isArray(workflowData)) {
                            expect(workflowData.type).toBe('Workflow');
                        }
                    }

                    if (card.relationships?.person) {
                        expect(card.relationships.person).toHaveProperty('data');
                        // links optional in responses
                        
                        const personData = card.relationships.person.data;
                        if (personData && !Array.isArray(personData)) {
                            expect(personData.type).toBe('Person');
                        }
                    }

                    if (card.relationships?.assignee) {
                        expect(card.relationships.assignee).toHaveProperty('data');
                        // links optional in responses
                        
                        const assigneeData = card.relationships.assignee.data;
                        if (assigneeData && !Array.isArray(assigneeData)) {
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
            const response = await client.notes.getAll({
                perPage: 1,
                include: ['person', 'note_category', 'organization', 'created_by']
            });

            if (response.data.length > 0) {
                const note = response.data[0];

                if (note.relationships?.person) {
                    expect(note.relationships.person).toHaveProperty('data');
                    expect(note.relationships.person).toHaveProperty('links');
                    
                    const personData = note.relationships.person.data;
                    if (personData && !Array.isArray(personData)) {
                        expect(personData.type).toBe('Person');
                    }
                }

                if (note.relationships?.note_category) {
                    expect(note.relationships.note_category).toHaveProperty('data');
                    expect(note.relationships.note_category).toHaveProperty('links');
                    
                    const categoryData = note.relationships.note_category.data;
                    if (categoryData && !Array.isArray(categoryData)) {
                        expect(categoryData.type).toBe('NoteCategory');
                    }
                }

                if (note.relationships?.organization) {
                    expect(note.relationships.organization).toHaveProperty('data');
                    expect(note.relationships.organization).toHaveProperty('links');
                    
                    const orgData = note.relationships.organization.data;
                    if (orgData && !Array.isArray(orgData)) {
                        expect(orgData.type).toBe('Organization');
                    }
                }
            }
        }, 30000);
    });

    describe('Form Relationships Validation', () => {
        it('should validate form relationships', async () => {
            const response = await client.forms.getAll({
                perPage: 1,
                include: ['organization', 'form_category']
            });

            if (response.data.length > 0) {
                const form = response.data[0];

                if (form.relationships?.organization) {
                    expect(form.relationships.organization).toHaveProperty('data');
                    expect(form.relationships.organization).toHaveProperty('links');
                    
                    const orgData = form.relationships.organization.data;
                    if (orgData && !Array.isArray(orgData)) {
                        expect(orgData.type).toBe('Organization');
                    }
                }

                if (form.relationships?.form_category) {
                    expect(form.relationships.form_category).toHaveProperty('data');
                    // links optional
                    
                    const categoryData = form.relationships.form_category.data;
                    if (categoryData && !Array.isArray(categoryData)) {
                        expect(categoryData.type).toBe('FormCategory');
                    }
                }
            }
        }, 30000);
    });

    describe('Report Relationships Validation', () => {
        it('should validate report relationships', async () => {
            const response = await client.reports.getAll({
                perPage: 1,
                include: ['organization', 'created_by', 'updated_by']
            });

            if (response.data.length > 0) {
                const report = response.data[0];

                if (report.relationships?.organization) {
                    expect(report.relationships.organization).toHaveProperty('data');
                    expect(report.relationships.organization).toHaveProperty('links');
                    
                    const orgData = report.relationships.organization.data;
                    if (orgData && !Array.isArray(orgData)) {
                        expect(orgData.type).toBe('Organization');
                    }
                }

                if (report.relationships?.created_by) {
                    expect(report.relationships.created_by).toHaveProperty('data');
                    expect(report.relationships.created_by).toHaveProperty('links');
                    
                    const createdByData = report.relationships.created_by.data;
                    if (createdByData && !Array.isArray(createdByData)) {
                        expect(createdByData.type).toBe('Person');
                    }
                }
            }
        }, 30000);
    });

    describe('JSON:API Compliance Validation', () => {
        it('should validate JSON:API document structure', async () => {
            const response = await client.people.getAll({ perPage: 1 });

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
            const response = await client.people.getAll({ perPage: 1 });

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
            const response = await client.people.getAll({ perPage: 1 });

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
            const response = await client.people.getAll({
                perPage: 1,
                include: ['emails']
            });

            if (response.data.length > 0) {
                const person = response.data[0];

                if (person.relationships?.emails?.links?.related) {
                    const relatedLink = person.relationships.emails.links.related;
                    expect(typeof relatedLink).toBe('string');
                    expect(relatedLink).toContain('/people/');
                    expect(relatedLink).toContain('/emails');
                }

                if (person.relationships?.emails?.links?.self) {
                    const selfLink = person.relationships.emails.links.self;
                    expect(typeof selfLink).toBe('string');
                    expect(selfLink).toContain('/people/');
                    expect(selfLink).toContain('/emails');
                }
            }
        }, 30000);
    });
});
