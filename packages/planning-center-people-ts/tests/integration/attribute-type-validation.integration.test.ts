/**
 * Attribute Type Validation Integration Tests
 * 
 * These tests verify that TypeScript attribute types match actual API responses.
 * They make real API calls and validate that the response data matches the expected types.
 * 
 * To run: npm run test:integration -- --testNamePattern="Attribute Type Validation"
 */

import { PcoClient } from '../../src';
import { createTestClient, logAuthStatus } from './test-config';

describe('Attribute Type Validation Integration Tests', () => {
    let client: PcoClient;
    let testPersonId: string;

    beforeAll(async () => {
        logAuthStatus();
        client = createTestClient();

        // Add request monitoring
        client.on('request:start', (event) => {
            console.log(`🔍 ${event.method} ${event.endpoint}`);
        });
        client.on('request:complete', (event) => {
            console.log(`✅ ${event.method} ${event.endpoint} - ${event.statusCode} (${event.duration}ms)`);
        });
    }, 30000);

    afterAll(async () => {
        if (testPersonId) {
            await client.people.delete(testPersonId);
        }
    }, 30000);

    describe('Person Attributes Type Validation', () => {
        it('should validate PersonAttributes types match API response', async () => {
            const response = await client.people.getAll({ perPage: 1 });
            expect(response.data.length).toBeGreaterThan(0);
            
            const person = response.data[0];
            
            // Validate required fields
            expect(person.id).toBeDefined();
            expect(typeof person.id).toBe('string');
            expect(person.type).toBe('Person');
            
            // Validate optional string attributes
            if (person.attributes?.first_name !== undefined) {
                expect(typeof person.attributes.first_name).toBe('string');
            }
            if (person.attributes?.last_name !== undefined) {
                expect(typeof person.attributes.last_name).toBe('string');
            }
            if (person.attributes?.given_name !== undefined) {
                expect(
                    person.attributes.given_name === null || typeof person.attributes.given_name === 'string'
                ).toBe(true);
            }
            if (person.attributes?.middle_name !== undefined) {
                expect(
                    person.attributes.middle_name === null || typeof person.attributes.middle_name === 'string'
                ).toBe(true);
            }
            if (person.attributes?.nickname !== undefined) {
                expect(
                    person.attributes.nickname === null || typeof person.attributes.nickname === 'string'
                ).toBe(true);
            }
            if (person.attributes?.birthdate !== undefined) {
                expect(typeof person.attributes.birthdate).toBe('string');
            }
            if (person.attributes?.anniversary !== undefined) {
                expect(
                    person.attributes.anniversary === null || typeof person.attributes.anniversary === 'string'
                ).toBe(true);
            }
            if (person.attributes?.gender !== undefined) {
                expect(
                    person.attributes.gender === null || typeof person.attributes.gender === 'string'
                ).toBe(true);
            }
            if (person.attributes?.grade !== undefined) {
                expect(
                    person.attributes.grade === null || typeof person.attributes.grade === 'string'
                ).toBe(true);
            }
            if (person.attributes?.status !== undefined) {
                expect(typeof person.attributes.status).toBe('string');
            }
            if (person.attributes?.medical_notes !== undefined) {
                expect(
                    person.attributes.medical_notes === null || typeof person.attributes.medical_notes === 'string'
                ).toBe(true);
            }
            if (person.attributes?.name !== undefined) {
                expect(typeof person.attributes.name).toBe('string');
            }
            if (person.attributes?.family_name !== undefined) {
                expect(typeof person.attributes.family_name).toBe('string');
            }
            if (person.attributes?.job_title !== undefined) {
                expect(typeof person.attributes.job_title).toBe('string');
            }
            if (person.attributes?.employer !== undefined) {
                expect(typeof person.attributes.employer).toBe('string');
            }
            if (person.attributes?.school !== undefined) {
                expect(typeof person.attributes.school).toBe('string');
            }
            if (person.attributes?.graduation_year !== undefined) {
                expect(
                    person.attributes.graduation_year === null || typeof person.attributes.graduation_year === 'string'
                ).toBe(true);
            }
            if (person.attributes?.avatar !== undefined) {
                expect(typeof person.attributes.avatar).toBe('string');
            }
            if (person.attributes?.people_permissions !== undefined) {
                expect(typeof person.attributes.people_permissions).toBe('string');
            }
            if (person.attributes?.directory_status !== undefined) {
                expect(typeof person.attributes.directory_status).toBe('string');
            }
            if (person.attributes?.login_identifier !== undefined) {
                expect(typeof person.attributes.login_identifier).toBe('string');
            }
            if (person.attributes?.membership !== undefined) {
                expect(typeof person.attributes.membership).toBe('string');
            }
            if (person.attributes?.remote_id !== undefined) {
                expect(
                    person.attributes.remote_id === null || typeof person.attributes.remote_id === 'string'
                ).toBe(true);
            }
            if (person.attributes?.demographic_avatar_url !== undefined) {
                expect(typeof person.attributes.demographic_avatar_url).toBe('string');
            }
            if (person.attributes?.inactivated_at !== undefined) {
                expect(
                    person.attributes.inactivated_at === null || typeof person.attributes.inactivated_at === 'string'
                ).toBe(true);
            }

            // Validate boolean attributes
            if (person.attributes?.child !== undefined) {
                expect(typeof person.attributes.child).toBe('boolean');
            }
            if (person.attributes?.site_administrator !== undefined) {
                expect(typeof person.attributes.site_administrator).toBe('boolean');
            }
            if (person.attributes?.accounting_administrator !== undefined) {
                expect(typeof person.attributes.accounting_administrator).toBe('boolean');
            }

            // Validate date attributes
            if (person.attributes?.created_at !== undefined) {
                expect(typeof person.attributes.created_at).toBe('string');
                expect(new Date(person.attributes.created_at).getTime()).not.toBeNaN();
            }
            if (person.attributes?.updated_at !== undefined) {
                expect(typeof person.attributes.updated_at).toBe('string');
                expect(new Date(person.attributes.updated_at).getTime()).not.toBeNaN();
            }

            // Validate object attributes
            if (person.attributes?.resource_permission_flags !== undefined) {
                expect(typeof person.attributes.resource_permission_flags).toBe('object');
                expect(person.attributes.resource_permission_flags).not.toBeNull();
            }
        }, 30000);

        it('should validate PersonRelationships structure', async () => {
            const response = await client.people.getAll({ 
                perPage: 1,
                include: ['emails', 'phone_numbers', 'addresses', 'household', 'primary_campus']
            });
            expect(response.data.length).toBeGreaterThan(0);
            
            const person = response.data[0];
            
            // Validate relationships structure
            if (person.relationships?.emails) {
                expect(person.relationships.emails).toHaveProperty('data');
                expect(person.relationships.emails).toHaveProperty('links');
            }
            if (person.relationships?.phone_numbers) {
                expect(person.relationships.phone_numbers).toHaveProperty('data');
                expect(person.relationships.phone_numbers).toHaveProperty('links');
            }
            if (person.relationships?.addresses) {
                expect(person.relationships.addresses).toHaveProperty('data');
                expect(person.relationships.addresses).toHaveProperty('links');
            }
            if (person.relationships?.household) {
                expect(person.relationships.household).toHaveProperty('data');
                expect(person.relationships.household).toHaveProperty('links');
            }
            if (person.relationships?.primary_campus) {
                expect(person.relationships.primary_campus).toHaveProperty('data');
                // links may be omitted by API
            }
        }, 30000);
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
                address: `test${Date.now()}@example.com`,
                location: 'Home',
                primary: true
            };
            let email;
            try {
                email = await client.people.addEmail(testPersonId, emailData);
            } catch (error: any) {
                expect(error.message).toMatch(/disallowed domain name|can't be blank/i);
                return;
            }

            // Validate email attributes
            expect(email.id).toBeDefined();
            expect(typeof email.id).toBe('string');
            expect(email.type).toBe('Email');

            if (email.attributes?.address !== undefined) {
                expect(typeof email.attributes.address).toBe('string');
            }
            if (email.attributes?.location !== undefined) {
                expect(typeof email.attributes.location).toBe('string');
            }
            if (email.attributes?.primary !== undefined) {
                expect(typeof email.attributes.primary).toBe('boolean');
            }
            if (email.attributes?.blocked !== undefined) {
                expect(typeof email.attributes.blocked).toBe('boolean');
            }
            if (email.attributes?.created_at !== undefined) {
                expect(typeof email.attributes.created_at).toBe('string');
                expect(new Date(email.attributes.created_at).getTime()).not.toBeNaN();
            }
            if (email.attributes?.updated_at !== undefined) {
                expect(typeof email.attributes.updated_at).toBe('string');
                expect(new Date(email.attributes.updated_at).getTime()).not.toBeNaN();
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

            if (phone.attributes?.number !== undefined) {
                expect(typeof phone.attributes.number).toBe('string');
            }
            if (phone.attributes?.location !== undefined) {
                expect(typeof phone.attributes.location).toBe('string');
            }
            if (phone.attributes?.primary !== undefined) {
                expect(typeof phone.attributes.primary).toBe('boolean');
            }
            if (phone.attributes?.created_at !== undefined) {
                expect(typeof phone.attributes.created_at).toBe('string');
                expect(new Date(phone.attributes.created_at).getTime()).not.toBeNaN();
            }
            if (phone.attributes?.updated_at !== undefined) {
                expect(typeof phone.attributes.updated_at).toBe('string');
                expect(new Date(phone.attributes.updated_at).getTime()).not.toBeNaN();
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
            let address;
            try {
                address = await client.people.addAddress(testPersonId, addressData);
            } catch (error: any) {
                expect(error.message).toMatch(/cannot be assigned/i);
                return;
            }

            // Validate address attributes
            expect(address.id).toBeDefined();
            expect(typeof address.id).toBe('string');
            expect(address.type).toBe('Address');

            if (address.attributes?.street_line_1 !== undefined) {
                expect(typeof address.attributes.street_line_1).toBe('string');
            }
            if (address.attributes?.street_line_2 !== undefined) {
                expect(typeof address.attributes.street_line_2).toBe('string');
            }
            if (address.attributes?.city !== undefined) {
                expect(typeof address.attributes.city).toBe('string');
            }
            if (address.attributes?.state !== undefined) {
                expect(typeof address.attributes.state).toBe('string');
            }
            if (address.attributes?.zip !== undefined) {
                expect(typeof address.attributes.zip).toBe('string');
            }
            if (address.attributes?.country_code !== undefined) {
                expect(typeof address.attributes.country_code).toBe('string');
            }
            if (address.attributes?.country_name !== undefined) {
                expect(typeof address.attributes.country_name).toBe('string');
            }
            if (address.attributes?.location !== undefined) {
                expect(typeof address.attributes.location).toBe('string');
            }
            if (address.attributes?.primary !== undefined) {
                expect(typeof address.attributes.primary).toBe('boolean');
            }
            if (address.attributes?.created_at !== undefined) {
                expect(typeof address.attributes.created_at).toBe('string');
                expect(new Date(address.attributes.created_at).getTime()).not.toBeNaN();
            }
            if (address.attributes?.updated_at !== undefined) {
                expect(typeof address.attributes.updated_at).toBe('string');
                expect(new Date(address.attributes.updated_at).getTime()).not.toBeNaN();
            }
        }, 30000);
    });

    describe('Household Attributes Type Validation', () => {
        it('should validate HouseholdAttributes types match API response', async () => {
            const response = await client.households.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const household = response.data[0];

                // Validate household attributes
                expect(household.id).toBeDefined();
                expect(typeof household.id).toBe('string');
                expect(household.type).toBe('Household');

                if (household.attributes?.name !== undefined) {
                    expect(typeof household.attributes.name).toBe('string');
                }
                if (household.attributes?.created_at !== undefined) {
                    expect(typeof household.attributes.created_at).toBe('string');
                    expect(new Date(household.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (household.attributes?.updated_at !== undefined) {
                    expect(typeof household.attributes.updated_at).toBe('string');
                    expect(new Date(household.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('Campus Attributes Type Validation', () => {
        it('should validate CampusAttributes types match API response', async () => {
            const response = await client.campus.getAll({ perPage: 1 });
            if (response.data.length > 0) {
                const campus = response.data[0];

                // Validate campus attributes
                expect(campus.id).toBeDefined();
                expect(typeof campus.id).toBe('string');
                expect(campus.type).toBe('Campus');

                if (campus.attributes?.name !== undefined) {
                    expect(typeof campus.attributes.name).toBe('string');
                }
                if (campus.attributes?.latitude !== undefined) {
                    // API returns latitude/longitude as strings
                    expect(typeof campus.attributes.latitude).toBe('string');
                }
                if (campus.attributes?.longitude !== undefined) {
                    expect(typeof campus.attributes.longitude).toBe('string');
                }
                if (campus.attributes?.description !== undefined) {
                    expect(typeof campus.attributes.description).toBe('string');
                }
                if (campus.attributes?.street !== undefined) {
                    expect(typeof campus.attributes.street).toBe('string');
                }
                if (campus.attributes?.city !== undefined) {
                    expect(typeof campus.attributes.city).toBe('string');
                }
                if (campus.attributes?.state !== undefined) {
                    expect(typeof campus.attributes.state).toBe('string');
                }
                if (campus.attributes?.zip !== undefined) {
                    expect(typeof campus.attributes.zip).toBe('string');
                }
                if (campus.attributes?.country !== undefined) {
                    expect(typeof campus.attributes.country).toBe('string');
                }
                if (campus.attributes?.phone_number !== undefined) {
                    expect(
                        campus.attributes.phone_number === null || typeof campus.attributes.phone_number === 'string'
                    ).toBe(true);
                }
                if (campus.attributes?.website !== undefined) {
                    expect(
                        campus.attributes.website === null || typeof campus.attributes.website === 'string'
                    ).toBe(true);
                }
                if (campus.attributes?.twenty_four_hour_time !== undefined) {
                    expect(
                        campus.attributes.twenty_four_hour_time === null || typeof campus.attributes.twenty_four_hour_time === 'boolean'
                    ).toBe(true);
                }
                if (campus.attributes?.date_format !== undefined) {
                    expect(
                        campus.attributes.date_format === null || typeof campus.attributes.date_format === 'number'
                    ).toBe(true);
                }
                if (campus.attributes?.church_center_enabled !== undefined) {
                    expect(typeof campus.attributes.church_center_enabled).toBe('boolean');
                }
                if (campus.attributes?.created_at !== undefined) {
                    expect(typeof campus.attributes.created_at).toBe('string');
                    expect(new Date(campus.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (campus.attributes?.updated_at !== undefined) {
                    expect(typeof campus.attributes.updated_at).toBe('string');
                    expect(new Date(campus.attributes.updated_at).getTime()).not.toBeNaN();
                }
            }
        }, 30000);
    });

    describe('Field Definition Attributes Type Validation', () => {
        it('should validate FieldDefinitionAttributes types match API response', async () => {
            const response = await client.fields.getAllFieldDefinitions();
            if (response.length > 0) {
                const field = response[0];

                // Validate field definition attributes
                expect(field.id).toBeDefined();
                expect(typeof field.id).toBe('string');
                expect(field.type).toBe('FieldDefinition');

                // Required fields
                expect(field.attributes?.data_type).toBeDefined();
                expect(typeof field.attributes?.data_type).toBe('string');
                expect(field.attributes?.name).toBeDefined();
                expect(typeof field.attributes?.name).toBe('string');
                expect(field.attributes?.sequence).toBeDefined();
                expect(typeof field.attributes?.sequence).toBe('number');
                expect(field.attributes?.slug).toBeDefined();
                expect(typeof field.attributes?.slug).toBe('string');
                expect(field.attributes?.tab_id).toBeDefined();
                expect(typeof field.attributes?.tab_id).toBe('number');

                // Optional fields
                if (field.attributes?.config !== undefined) {
                    expect(typeof field.attributes.config).toBe('object');
                }
                if (field.attributes?.deleted_at !== undefined) {
                    const t = typeof field.attributes.deleted_at;
                    expect(['string','object']).toContain(t);
                }
            }
        }, 30000);
    });

    describe('Workflow Card Attributes Type Validation', () => {
        it('should validate WorkflowCardAttributes types match API response', async () => {
            // Get a person first to get their workflow cards
            const people = await client.people.getAll({ perPage: 1 });
            if (people.data.length > 0) {
                const personId = people.data[0].id;
                const response = await client.workflows.getPersonWorkflowCards(personId);
                if (response.data.length > 0) {
                    const card = response.data[0];

                    // Validate workflow card attributes
                    expect(card.id).toBeDefined();
                    expect(typeof card.id).toBe('string');
                    expect(card.type).toBe('WorkflowCard');

                    if (card.attributes?.title !== undefined) {
                    expect(typeof card.attributes.title).toBe('string');
                }
                if (card.attributes?.description !== undefined) {
                    expect(typeof card.attributes.description).toBe('string');
                }
                if (card.attributes?.status !== undefined) {
                    expect(typeof card.attributes.status).toBe('string');
                }
                if (card.attributes?.stage !== undefined) {
                    expect(typeof card.attributes.stage).toBe('string');
                }
                if (card.attributes?.completed_at !== undefined) {
                    expect(typeof card.attributes.completed_at).toBe('string');
                }
                if (card.attributes?.overdue !== undefined) {
                    expect(typeof card.attributes.overdue).toBe('boolean');
                }
                if (card.attributes?.calculated_due_at_in_days_ago !== undefined) {
                    const t = typeof card.attributes.calculated_due_at_in_days_ago;
                    expect(['number','object']).toContain(t);
                }
                if (card.attributes?.flagged_for_notification_at !== undefined) {
                    expect(
                        card.attributes.flagged_for_notification_at === null || typeof card.attributes.flagged_for_notification_at === 'string'
                    ).toBe(true);
                }
                if (card.attributes?.moved_to_step_at !== undefined) {
                    expect(
                        card.attributes.moved_to_step_at === null || typeof card.attributes.moved_to_step_at === 'string'
                    ).toBe(true);
                }
                if (card.attributes?.snooze_until !== undefined) {
                    expect(
                        card.attributes.snooze_until === null || typeof card.attributes.snooze_until === 'string'
                    ).toBe(true);
                }
                if (card.attributes?.removed_at !== undefined) {
                    expect(
                        card.attributes.removed_at === null || typeof card.attributes.removed_at === 'string'
                    ).toBe(true);
                }
                if (card.attributes?.created_at !== undefined) {
                    expect(typeof card.attributes.created_at).toBe('string');
                    expect(new Date(card.attributes.created_at).getTime()).not.toBeNaN();
                }
                if (card.attributes?.updated_at !== undefined) {
                    expect(typeof card.attributes.updated_at).toBe('string');
                    expect(new Date(card.attributes.updated_at).getTime()).not.toBeNaN();
                }
                }
            }
        }, 30000);
    });

    describe('Pagination and Meta Type Validation', () => {
        it('should validate pagination structure types', async () => {
            const response = await client.people.getAll({ perPage: 5 });

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
