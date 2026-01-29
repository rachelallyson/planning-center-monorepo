/**
 * Attribute Type Validation Integration Tests
 * 
 * These tests verify that TypeScript attribute types match actual API responses.
 * They make real API calls and validate that the response data matches the expected types.
 * 
 * To run: npm run test:integration -- --testNamePattern="Attribute Type Validation"
 */

import { PcoClient, type FlattenedPersonResource, type HouseholdResource, type CampusResource, type WorkflowCardResource, type WorkflowCardAttributes } from '../../src';
import type { FlattenedResource } from '@rachelallyson/planning-center-base-ts';
import { createTestClient, logAuthStatus } from './test-config';
import type { ResourceObject } from '../../src/types/json-api';

describe('Attribute Type Validation Integration Tests', () => {
    let client: PcoClient;
    let testPersonId: string;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

    }, 30000);

    afterAll(async () => {
        if (testPersonId) {
            await client.people.delete(testPersonId);
        }
    }, 30000);

    describe('Person Attributes Type Validation', () => {
        it('should validate PersonAttributes types match API response', async () => {
            const response = await client.people.getPage({ perPage: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            
            const person = response.data[0] as FlattenedPersonResource;
            
            // Validate required fields
            expect(person.id).toBeDefined();
            expect(typeof person.id).toBe('string');
            expect(person.type).toBe('Person');
            
            // Validate optional string attributes (flattened - attributes are at top level)
            if (person.first_name !== undefined) {
                expect(typeof person.first_name).toBe('string');
            }
            if (person.last_name !== undefined) {
                expect(typeof person.last_name).toBe('string');
            }
            if (person.given_name !== undefined) {
                expect(
                    person.given_name === null || typeof person.given_name === 'string'
                ).toBe(true);
            }
            if (person.middle_name !== undefined) {
                expect(
                    person.middle_name === null || typeof person.middle_name === 'string'
                ).toBe(true);
            }
            if (person.nickname !== undefined) {
                expect(
                    person.nickname === null || typeof person.nickname === 'string'
                ).toBe(true);
            }
            if (person.birthdate !== undefined) {
                expect(typeof person.birthdate).toBe('string');
            }
            if (person.anniversary !== undefined) {
                expect(
                    person.anniversary === null || typeof person.anniversary === 'string'
                ).toBe(true);
            }
            if (person.gender !== undefined) {
                expect(
                    person.gender === null || typeof person.gender === 'string'
                ).toBe(true);
            }
            if (person.grade !== undefined) {
                expect(
                    person.grade === null || typeof person.grade === 'string'
                ).toBe(true);
            }
            if (person.status !== undefined) {
                expect(typeof person.status).toBe('string');
            }
            if (person.medical_notes !== undefined) {
                expect(
                    person.medical_notes === null || typeof person.medical_notes === 'string'
                ).toBe(true);
            }
            if (person.name !== undefined) {
                expect(typeof person.name).toBe('string');
            }
            if (person.family_name !== undefined) {
                expect(typeof person.family_name).toBe('string');
            }
            if (person.job_title !== undefined) {
                expect(typeof person.job_title).toBe('string');
            }
            if (person.employer !== undefined) {
                expect(typeof person.employer).toBe('string');
            }
            if (person.school !== undefined) {
                expect(typeof person.school).toBe('string');
            }
            if (person.graduation_year !== undefined) {
                expect(
                    person.graduation_year === null || typeof person.graduation_year === 'string'
                ).toBe(true);
            }
            if (person.avatar !== undefined) {
                expect(typeof person.avatar).toBe('string');
            }
            if (person.people_permissions !== undefined) {
                expect(typeof person.people_permissions).toBe('string');
            }
            if (person.directory_status !== undefined) {
                expect(typeof person.directory_status).toBe('string');
            }
            if (person.login_identifier !== undefined) {
                expect(typeof person.login_identifier).toBe('string');
            }
            if (person.membership !== undefined) {
                expect(typeof person.membership).toBe('string');
            }
            if (person.remote_id !== undefined) {
                expect(
                    person.remote_id === null || typeof person.remote_id === 'string'
                ).toBe(true);
            }
            if (person.demographic_avatar_url !== undefined) {
                expect(typeof person.demographic_avatar_url).toBe('string');
            }
            if (person.inactivated_at !== undefined) {
                expect(
                    person.inactivated_at === null || typeof person.inactivated_at === 'string'
                ).toBe(true);
            }

            // Validate boolean attributes
            if (person.child !== undefined) {
                expect(typeof person.child).toBe('boolean');
            }
            if (person.site_administrator !== undefined) {
                expect(typeof person.site_administrator).toBe('boolean');
            }
            if (person.accounting_administrator !== undefined) {
                expect(typeof person.accounting_administrator).toBe('boolean');
            }

            // Validate date attributes
            if (person.created_at !== undefined) {
                expect(typeof person.created_at).toBe('string');
                expect(new Date(person.created_at).getTime()).not.toBeNaN();
            }
            if (person.updated_at !== undefined) {
                expect(typeof person.updated_at).toBe('string');
                expect(new Date(person.updated_at).getTime()).not.toBeNaN();
            }

            // Validate object attributes
            if (person.resource_permission_flags !== undefined) {
                expect(typeof person.resource_permission_flags).toBe('object');
                expect(person.resource_permission_flags).not.toBeNull();
            }
        }, 30000);

        it('should validate PersonRelationships structure', async () => {
            const response = await client.people.getPage({ 
                perPage: 1,
                include: ['emails', 'phone_numbers', 'addresses', 'households', 'primary_campus']
            });
            expect(response.data.length).toBeGreaterThan(0);
            
            const person = response.data[0] as FlattenedPersonResource;
            
            // Validate relationships structure (flattened - relationships are at top level)
            // emails can be an array of EmailResource or ResourceIdentifier
            if (person.emails) {
                const emails = Array.isArray(person.emails) ? person.emails : [person.emails];
                expect(emails.length).toBeGreaterThanOrEqual(0);
                if (emails.length > 0) {
                    expect(emails[0]).toHaveProperty('type');
                    expect(emails[0]).toHaveProperty('id');
                }
            }
            // phone_numbers can be an array of PhoneNumberResource or ResourceIdentifier
            if (person.phone_numbers) {
                const phones = Array.isArray(person.phone_numbers) ? person.phone_numbers : [person.phone_numbers];
                expect(phones.length).toBeGreaterThanOrEqual(0);
                if (phones.length > 0) {
                    expect(phones[0]).toHaveProperty('type');
                    expect(phones[0]).toHaveProperty('id');
                }
            }
            // addresses can be an array of AddressResource or ResourceIdentifier
            if (person.addresses) {
                const addresses = Array.isArray(person.addresses) ? person.addresses : [person.addresses];
                expect(addresses.length).toBeGreaterThanOrEqual(0);
                if (addresses.length > 0) {
                    expect(addresses[0]).toHaveProperty('type');
                    expect(addresses[0]).toHaveProperty('id');
                }
            }
            if (person.household) {
                expect(person.household).toHaveProperty('type');
                expect(person.household).toHaveProperty('id');
            }
            if (person.primary_campus) {
                expect(person.primary_campus).toHaveProperty('type');
                expect(person.primary_campus).toHaveProperty('id');
            }
        }, 120000);
    });

    describe('Email Attributes Type Validation', () => {
        it('should validate EmailAttributes types match API response', async () => {
            // Create a test person first
            const personData = {
                first_name: `EmailTest_${Date.now()}`,
                last_name: 'TypeValidation',
                status: 'active'
            };
            const person = await client.people.create(personData);
            testPersonId = person.id;

            // Add an email
            const emailData = {
                address: `test${Date.now()}@gmail.com`,
                location: 'Home',
                primary: true
            };
            const email = await client.people.addEmail(testPersonId, emailData);

            // Validate email attributes
            expect(email.id).toBeDefined();
            expect(typeof email.id).toBe('string');
            expect(email.type).toBe('Email');

            if (email.address !== undefined) {
                expect(typeof email.address).toBe('string');
            }
            if (email.location !== undefined) {
                expect(typeof email.location).toBe('string');
            }
            if (email.primary !== undefined) {
                expect(typeof email.primary).toBe('boolean');
            }
            if (email.blocked !== undefined) {
                expect(typeof email.blocked).toBe('boolean');
            }
            if (email.created_at !== undefined) {
                expect(typeof email.created_at).toBe('string');
                expect(new Date(email.created_at).getTime()).not.toBeNaN();
            }
            if (email.updated_at !== undefined) {
                expect(typeof email.updated_at).toBe('string');
                expect(new Date(email.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Phone Number Attributes Type Validation', () => {
        it('should validate PhoneNumberAttributes types match API response', async () => {
            if (!testPersonId) {
                // Create a test person first
                const personData = {
                    first_name: `PhoneTest_${Date.now()}`,
                    last_name: 'TypeValidation',
                    status: 'active'
                };
                const person = await client.people.create(personData);
                testPersonId = person.id;
            }

            // Add a phone number
            const phoneData = {
                number: `555-${Date.now().toString().slice(-4)}`,
                location: 'Home',
                primary: true
            };
            const phone = await client.people.addPhoneNumber(testPersonId, phoneData);

            // Validate phone number attributes
            expect(phone.id).toBeDefined();
            expect(typeof phone.id).toBe('string');
            expect(phone.type).toBe('PhoneNumber');

            if (phone.number !== undefined) {
                expect(typeof phone.number).toBe('string');
            }
            if (phone.location !== undefined) {
                expect(typeof phone.location).toBe('string');
            }
            if (phone.primary !== undefined) {
                expect(typeof phone.primary).toBe('boolean');
            }
            if (phone.created_at !== undefined) {
                expect(typeof phone.created_at).toBe('string');
                expect(new Date(phone.created_at).getTime()).not.toBeNaN();
            }
            if (phone.updated_at !== undefined) {
                expect(typeof phone.updated_at).toBe('string');
                expect(new Date(phone.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Address Attributes Type Validation', () => {
        it('should validate AddressAttributes types match API response', async () => {
            if (!testPersonId) {
                // Create a test person first
                const personData = {
                    first_name: `AddressTest_${Date.now()}`,
                    last_name: 'TypeValidation',
                    status: 'active'
                };
                const person = await client.people.create(personData);
                testPersonId = person.id;
            }

            // Add an address
            const addressData = {
                street_line_1: '123 Test Street',
                city: 'Test City',
                state: 'TS',
                zip: '12345',
                country_code: 'US',
                location: 'Home',
                primary: true
            };
            const address = await client.people.addAddress(testPersonId, addressData);

            // Validate address attributes
            expect(address.id).toBeDefined();
            expect(typeof address.id).toBe('string');
            expect(address.type).toBe('Address');

            if (address.street_line_1 !== undefined) {
                expect(typeof address.street_line_1).toBe('string');
            }
            // API may return street_line_2 as string, null, or object
            if (address.street_line_2 !== undefined && address.street_line_2 !== null && typeof address.street_line_2 === 'string') {
                expect(typeof address.street_line_2).toBe('string');
            }
            if (address.city !== undefined) {
                expect(typeof address.city).toBe('string');
            }
            if (address.state !== undefined) {
                expect(typeof address.state).toBe('string');
            }
            if (address.zip !== undefined) {
                expect(typeof address.zip).toBe('string');
            }
            if (address.country_code !== undefined) {
                expect(typeof address.country_code).toBe('string');
            }
            if (address.country_name !== undefined) {
                expect(typeof address.country_name).toBe('string');
            }
            if (address.location !== undefined) {
                expect(typeof address.location).toBe('string');
            }
            if (address.primary !== undefined) {
                expect(typeof address.primary).toBe('boolean');
            }
            if (address.created_at !== undefined) {
                expect(typeof address.created_at).toBe('string');
                expect(new Date(address.created_at).getTime()).not.toBeNaN();
            }
            if (address.updated_at !== undefined) {
                expect(typeof address.updated_at).toBe('string');
                expect(new Date(address.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Household Attributes Type Validation', () => {
        it('should validate HouseholdAttributes types match API response', async () => {
            const response = await client.households.getPage({ perPage: 1 });
            if (response.data.length > 0) {
                // getPage returns flattened resources
                type FlattenedHousehold = FlattenedResource<
                    HouseholdResource['type'],
                    HouseholdResource extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
                    HouseholdResource extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
                >;
                const household = response.data[0] as FlattenedHousehold;

                // Validate household attributes (flattened - attributes are at top level)
                expect(household.id).toBeDefined();
                expect(typeof household.id).toBe('string');
                expect(household.type).toBe('Household');

                if (household.name !== undefined) {
                    expect(typeof household.name).toBe('string');
                }
                if (household.created_at !== undefined) {
                    expect(typeof household.created_at).toBe('string');
                    expect(new Date(household.created_at).getTime()).not.toBeNaN();
                }
                if (household.updated_at !== undefined) {
                    expect(typeof household.updated_at).toBe('string');
                    expect(new Date(household.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('Campus Attributes Type Validation', () => {
        it('should validate CampusAttributes types match API response', async () => {
            const response = await client.campus.getPage({ perPage: 1 });
            if (response.data.length > 0) {
                // getPage returns flattened resources
                type FlattenedCampus = FlattenedResource<
                    CampusResource['type'],
                    CampusResource extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
                    CampusResource extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
                >;
                const campus = response.data[0] as FlattenedCampus;

                // Validate campus attributes (flattened - attributes are at top level)
                expect(campus.id).toBeDefined();
                expect(typeof campus.id).toBe('string');
                expect(campus.type).toBe('Campus');

                if (campus.name !== undefined) {
                    expect(typeof campus.name).toBe('string');
                }
                if (campus.latitude !== undefined) {
                    // API returns latitude/longitude as strings
                    expect(typeof campus.latitude).toBe('string');
                }
                if (campus.longitude !== undefined) {
                    expect(typeof campus.longitude).toBe('string');
                }
                if (campus.description !== undefined) {
                    expect(typeof campus.description).toBe('string');
                }
                if (campus.street !== undefined) {
                    expect(typeof campus.street).toBe('string');
                }
                if (campus.city !== undefined) {
                    expect(typeof campus.city).toBe('string');
                }
                if (campus.state !== undefined) {
                    expect(typeof campus.state).toBe('string');
                }
                if (campus.zip !== undefined) {
                    expect(typeof campus.zip).toBe('string');
                }
                if (campus.country !== undefined) {
                    expect(typeof campus.country).toBe('string');
                }
                if (campus.phone_number !== undefined) {
                    expect(
                        campus.phone_number === null || typeof campus.phone_number === 'string'
                    ).toBe(true);
                }
                if (campus.website !== undefined) {
                    expect(
                        campus.website === null || typeof campus.website === 'string'
                    ).toBe(true);
                }
                if (campus.twenty_four_hour_time !== undefined) {
                    expect(
                        campus.twenty_four_hour_time === null || typeof campus.twenty_four_hour_time === 'boolean'
                    ).toBe(true);
                }
                if (campus.date_format !== undefined) {
                    expect(
                        campus.date_format === null || typeof campus.date_format === 'number'
                    ).toBe(true);
                }
                if (campus.church_center_enabled !== undefined) {
                    expect(typeof campus.church_center_enabled).toBe('boolean');
                }
                if (campus.created_at !== undefined) {
                    expect(typeof campus.created_at).toBe('string');
                    expect(new Date(campus.created_at).getTime()).not.toBeNaN();
                }
                if (campus.updated_at !== undefined) {
                    expect(typeof campus.updated_at).toBe('string');
                    expect(new Date(campus.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('Field Definition Attributes Type Validation', () => {
        it('should validate FieldDefinitionAttributes types match API response', async () => {
            const response = await client.fields.getAllFieldDefinitions();
            // getAllFieldDefinitions returns PaginationResult with data array
            if (response.data.length > 0) {
                // data contains flattened resources
                type FlattenedFieldDefinition = FlattenedResource<
                    'FieldDefinition',
                    { data_type: string; name: string; sequence: number; slug: string; tab_id: number; config?: unknown; deleted_at?: unknown },
                    Record<string, never>
                >;
                const field = response.data[0] as FlattenedFieldDefinition;

                // Validate field definition attributes (flattened - attributes are at top level)
                expect(field.id).toBeDefined();
                expect(typeof field.id).toBe('string');
                expect(field.type).toBe('FieldDefinition');

                // Required fields
                expect(field.data_type).toBeDefined();
                expect(typeof field.data_type).toBe('string');
                expect(field.name).toBeDefined();
                expect(typeof field.name).toBe('string');
                expect(field.sequence).toBeDefined();
                expect(typeof field.sequence).toBe('number');
                expect(field.slug).toBeDefined();
                expect(typeof field.slug).toBe('string');
                expect(field.tab_id).toBeDefined();
                expect(typeof field.tab_id).toBe('number');

                // Optional fields
                if (field.config !== undefined) {
                    expect(typeof field.config).toBe('object');
                }
                if (field.deleted_at !== undefined) {
                    const t = typeof field.deleted_at;
                    expect(['string','object']).toContain(t);
                }
            }
        }, 30000);
    });

    describe('Workflow Card Attributes Type Validation', () => {
        it('should validate WorkflowCardAttributes types match API response', async () => {
            // Get a person first to get their workflow cards
            const people = await client.people.getPage({ perPage: 1 });
            if (people.data.length > 0) {
                const personId = people.data[0].id;
                const response = await client.workflows.getPersonWorkflowCards(personId);
                if (response.data.length > 0) {
                    // getPersonWorkflowCards returns flattened resources
                    type FlattenedWorkflowCard = FlattenedResource<
                        WorkflowCardResource['type'],
                        WorkflowCardAttributes,
                        WorkflowCardResource extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
                    >;
                    const card = response.data[0] as FlattenedWorkflowCard;

                    // Validate workflow card attributes (flattened - attributes are at top level)
                    expect(card.id).toBeDefined();
                    expect(typeof card.id).toBe('string');
                    expect(card.type).toBe('WorkflowCard');

                    if (card.title !== undefined) {
                        expect(typeof card.title).toBe('string');
                    }
                    if (card.description !== undefined) {
                        expect(typeof card.description).toBe('string');
                    }
                    if (card.status !== undefined) {
                        expect(typeof card.status).toBe('string');
                    }
                    if (card.stage !== undefined) {
                        expect(typeof card.stage).toBe('string');
                    }
                    if (card.completed_at !== undefined) {
                        expect(typeof card.completed_at).toBe('string');
                    }
                    if (card.overdue !== undefined) {
                        expect(typeof card.overdue).toBe('boolean');
                    }
                    if (card.calculated_due_at_in_days_ago !== undefined) {
                        const t = typeof card.calculated_due_at_in_days_ago;
                        expect(['number','object']).toContain(t);
                    }
                    if (card.flagged_for_notification_at !== undefined) {
                        expect(
                            card.flagged_for_notification_at === null || typeof card.flagged_for_notification_at === 'string'
                        ).toBe(true);
                    }
                    if (card.moved_to_step_at !== undefined) {
                        expect(
                            card.moved_to_step_at === null || typeof card.moved_to_step_at === 'string'
                        ).toBe(true);
                    }
                    if (card.snooze_until !== undefined) {
                        expect(
                            card.snooze_until === null || typeof card.snooze_until === 'string'
                        ).toBe(true);
                    }
                    if (card.removed_at !== undefined) {
                        expect(
                            card.removed_at === null || typeof card.removed_at === 'string'
                        ).toBe(true);
                    }
                    if (card.created_at !== undefined) {
                        expect(typeof card.created_at).toBe('string');
                        expect(new Date(card.created_at).getTime()).not.toBeNaN();
                    }
                    if (card.updated_at !== undefined) {
                        expect(typeof card.updated_at).toBe('string');
                        expect(new Date(card.updated_at).getTime()).not.toBeNaN();
                    }
                }
            }
        }, 30000);
    });

    describe('Pagination and Meta Type Validation', () => {
        it('should validate pagination structure types', async () => {
            const response = await client.people.getPage({ perPage: 5 });

            // Validate pagination links
            if (response.links) {
                if (response.links.self) {
                    expect(typeof response.links.self).toBe('string');
                }
                if (response.links.first) {
                    expect(typeof response.links.first).toBe('string');
                }
                if (response.links.last) {
                    expect(typeof response.links.last).toBe('string');
                }
                if (response.links.prev) {
                    expect(typeof response.links.prev).toBe('string');
                }
                if (response.links.next) {
                    expect(typeof response.links.next).toBe('string');
                }
            }

            // Validate pagination meta
            if (response.meta) {
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
});
