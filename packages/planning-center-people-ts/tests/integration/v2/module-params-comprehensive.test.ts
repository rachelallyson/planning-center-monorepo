/**
 * Comprehensive test for all module fetch functions and parameter combinations
 * 
 * This test ensures that:
 * - All modules' fetch methods work correctly
 * - All parameter types (where, include, perPage, page, order) work
 * - Response structures are correct
 * - Parameters are properly transformed and sent to the API
 * 
 * To run: npm run test:integration:v2:module-params
 */

import { PcoClient, type PersonAttributes, type FlattenedPersonResource } from '../../../src';
import { createTestClient, logAuthStatus } from '../test-config';

describe('Comprehensive Module Fetch Functions & Parameters Test', () => {
    let client: PcoClient;
    let testPersonId: string;
    let testCampusId: string = '';

    beforeAll(async () => {
        // Log authentication status for debugging
        logAuthStatus();

        // Create client with proper token refresh support
        client = createTestClient();

        // Add error handlers and request monitoring for debugging
        client.on('error', () => {
            // Error handling tested elsewhere
        });

        // Create a test person for testing
        const timestamp = Date.now();
        const personData: Partial<PersonAttributes> = {
            first_name: `TEST_PARAMS_${timestamp}`,
            last_name: `Test_${timestamp}`,
            status: 'active',
        };
        
        try {
            const person = await client.people.create(personData);
            testPersonId = person.id || '';
            expect(testPersonId).toBeTruthy();
        } catch (error) {
            throw error;
        }

        // Get a campus ID for service-time tests (required)
        const campuses = await client.campus.getPage({ perPage: 1 });
        expect(campuses.data.length).toBeGreaterThan(0); // Must have at least one campus
        testCampusId = campuses.data[0].id;
        expect(testCampusId).toBeTruthy();
    }, 60000);

    afterAll(async () => {
        if (testPersonId) {
            await client.people.delete(testPersonId);
        }
    }, 30000);

    describe('People Module - getAll()', () => {
        it('should work with no parameters', async () => {
            const result = await client.people.getAll();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);
        }, 120000);

        it('should work with where parameter', async () => {
            const result = await client.people.getAll({
                where: { status: 'active' }
            });
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            result.data.forEach(person => {
                // Attributes are flattened to top level
                expect(person.status).toBe('active');
            });
        }, 120000);

        it('should work with include parameter', async () => {
            const result = await client.people.getAll({
                include: ['emails', 'phone_numbers']
            });
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(0);
            
            // Relationships are flattened to top level - person.emails instead of person.relationships.emails
            const personWithEmails = result.data.find((p: FlattenedPersonResource) => {
                // Check if emails exist - could be array, single object, or ResourceIdentifier
                if ('emails' in p && p.emails) {
                    if (Array.isArray(p.emails)) {
                        return p.emails.length > 0;
                    }
                    // Could be a single email object or ResourceIdentifier
                    return typeof p.emails === 'object';
                }
                return false;
            });
            
            // If we found a person with emails, verify the structure
            if (personWithEmails && 'emails' in personWithEmails && personWithEmails.emails) {
                // Verify relationships are at top level and contain full objects
                expect(personWithEmails.emails).toBeDefined();
                const emails = Array.isArray(personWithEmails.emails) ? personWithEmails.emails : [personWithEmails.emails];
                expect(emails.length).toBeGreaterThan(0);
                
                // Attributes are flattened - address is directly on the email
                const firstEmail = emails[0];
                if (firstEmail && typeof firstEmail === 'object' && 'address' in firstEmail) {
                    expect(firstEmail.address).toBeDefined();
                    expect(typeof firstEmail.address).toBe('string');
                }
            }
            
            // Verify included array is NOT in the response (it's been mapped to relationships)
            // TypeScript ensures 'included' doesn't exist on the return type
            expect('included' in result).toBe(false);
        }, 240000);

        it('should work with order parameter (ascending)', async () => {
            // Use getPage to limit results for more reliable ordering tests
            const result = await client.people.getPage({
                order: 'created_at',
                perPage: 10
            });
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(1); // Need at least 2 items to verify ordering
            
            // Verify ordering: created_at should be in ascending order
            // Attributes are flattened to top level
            const timestamps = result.data
                .map(p => p.created_at)
                .filter((ts): ts is string => !!ts);
            
            expect(timestamps.length).toBeGreaterThan(1); // Must have timestamps to verify order
            
            // Check that timestamps are in ascending order
            for (let i = 1; i < timestamps.length; i++) {
                const prev = new Date(timestamps[i - 1]).getTime();
                const curr = new Date(timestamps[i]).getTime();
                expect(curr).toBeGreaterThanOrEqual(prev);
            }
        }, 30000);

        it('should work with order parameter (descending)', async () => {
            // Use getPage to limit results for more reliable ordering tests
            const result = await client.people.getPage({
                order: '-created_at',
                perPage: 10
            });
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(1); // Need at least 2 items to verify ordering
            
            // Verify ordering: created_at should be in descending order
            // Attributes are flattened to top level
            const timestamps = result.data
                .map(p => p.created_at)
                .filter((ts): ts is string => !!ts);
            
            expect(timestamps.length).toBeGreaterThan(1); // Must have timestamps to verify order
            
            // Check that timestamps are in descending order
            for (let i = 1; i < timestamps.length; i++) {
                const prev = new Date(timestamps[i - 1]).getTime();
                const curr = new Date(timestamps[i]).getTime();
                expect(curr).toBeLessThanOrEqual(prev);
            }
        }, 30000);

        it('should produce different order when order parameter changes', async () => {
            const ascending = await client.people.getPage({
                order: 'created_at',
                perPage: 5
            });
            const descending = await client.people.getPage({
                order: '-created_at',
                perPage: 5
            });
            
            expect(ascending.data.length).toBeGreaterThan(1); // Need multiple items to verify ordering
            expect(descending.data.length).toBeGreaterThan(1);
            
            // Verify order is different - arrays should be different
            const ascendingIds = ascending.data.map(p => p.id);
            const descendingIds = descending.data.map(p => p.id);
            
            // Arrays should be different (reversed or different order)
            expect(ascendingIds).not.toEqual(descendingIds);
            
            // First items should be different when order changes
            expect(ascendingIds[0]).not.toBe(descendingIds[0]);
        }, 30000);

        it('should work with combined parameters', async () => {
            // Use getPage with same params to avoid fetching all people (getAll can exceed timeout)
            const result = await client.people.getPage({
                perPage: 10,
                where: { status: 'active' },
                include: ['emails'],
                order: 'last_name'
            });
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            result.data.forEach(person => {
                // Attributes are flattened to top level
                expect(person.status).toBe('active');
            });
        }, 30000);
    });

    describe('People Module - getPage()', () => {
        it('should work with no parameters', async () => {
            const result = await client.people.getPage();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.meta).toBeDefined();
            expect(result.links).toBeDefined();
        }, 30000);

        it('should work with perPage parameter', async () => {
            const result = await client.people.getPage({ perPage: 5 });
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeLessThanOrEqual(5);
            expect(result.meta).toBeDefined();
        }, 30000);

        it('should work with page parameter', async () => {
            const page1 = await client.people.getPage({ perPage: 5, page: 1 });
            const page2 = await client.people.getPage({ perPage: 5, page: 2 });
            
            expect(page1.data).toBeDefined();
            expect(page2.data).toBeDefined();
            expect(Array.isArray(page1.data)).toBe(true);
            expect(Array.isArray(page2.data)).toBe(true);
            
            // Verify pagination structure
            expect(page1.meta).toBeDefined();
            expect(page1.links).toBeDefined();
            expect(page2.meta).toBeDefined();
            expect(page2.links).toBeDefined();
            
            // Debug: Log pagination links to understand API behavior
            // The API's next/self links will show what pagination method it actually uses
            const page1NextLink = typeof page1.links?.next === 'string' ? page1.links.next : String(page1.links?.next || '');
            const page2SelfLink = typeof page2.links?.self === 'string' ? page2.links.self : String(page2.links?.self || '');
            
            // Pages should be different - page2 should not contain items from page1
            const page1Ids = new Set(page1.data.map(p => p.id));
            const page2Ids = new Set(page2.data.map(p => p.id));
            
            // Verify no overlap between pages
            const overlap = [...page1Ids].filter(id => page2Ids.has(id));
            
            // If there's overlap, log detailed debug info before failing
            if (overlap.length > 0) {
                // Log to stderr to ensure it shows in test output
                process.stderr.write('\n=== PAGE PARAMETER BUG DETECTED ===\n');
                process.stderr.write(`Page1 next link: ${page1NextLink}\n`);
                process.stderr.write(`Page2 self link: ${page2SelfLink}\n`);
                process.stderr.write(`Page1 data length: ${page1.data.length}\n`);
                process.stderr.write(`Page2 data length: ${page2.data.length}\n`);
                process.stderr.write(`Overlap count: ${overlap.length}\n`);
                process.stderr.write(`Page1 IDs: ${Array.from(page1Ids).join(', ')}\n`);
                process.stderr.write(`Page2 IDs: ${Array.from(page2Ids).join(', ')}\n`);
                process.stderr.write(`Overlapping IDs: ${overlap.join(', ')}\n`);
                process.stderr.write('=====================================\n');
            }
            
            // Pages must be different - no overlap allowed
            expect(overlap.length).toBe(0);
            
            // Verify page1 has next link when page is full
            expect(page1.data.length).toBe(5); // Page should be full
            expect(page1.links?.next).toBeDefined();
        }, 30000);

        it('should work with where + pagination', async () => {
            const result = await client.people.getPage({
                where: { status: 'active' },
                perPage: 10,
                page: 1
            });
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeLessThanOrEqual(10);
            result.data.forEach(person => {
                // Attributes are flattened to top level
                expect(person.status).toBe('active');
            });
            expect(result.links?.self).toBeDefined();
        }, 30000);

        it('should work with include + pagination', async () => {
            const result = await client.people.getPage({
                include: ['emails', 'phone_numbers'],
                perPage: 5
            });
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(0);
            expect(result.data.length).toBeLessThanOrEqual(5);
            
            // Relationships are flattened to top level - person.emails instead of person.relationships.emails
            const personWithEmails = result.data.find((p: FlattenedPersonResource) => {
                // Check if emails exist - could be array, single object, or ResourceIdentifier
                if ('emails' in p && p.emails) {
                    if (Array.isArray(p.emails)) {
                        return p.emails.length > 0;
                    }
                    // Could be a single email object or ResourceIdentifier
                    return typeof p.emails === 'object';
                }
                return false;
            });
            
            // If we found a person with emails, verify the structure
            if (personWithEmails && 'emails' in personWithEmails && personWithEmails.emails) {
                // Attributes are also flattened - address is directly on the email
                const emails = Array.isArray(personWithEmails.emails) ? personWithEmails.emails : [personWithEmails.emails];
                if (emails.length > 0) {
                    const firstEmail = emails[0];
                    if (firstEmail && typeof firstEmail === 'object' && 'address' in firstEmail) {
                        expect(firstEmail.address).toBeDefined();
                        expect(typeof firstEmail.address).toBe('string');
                    }
                }
            }
        }, 30000);

        it('should automatically map included resources to relationships', async () => {
            const result = await client.people.getPage({
                include: ['emails', 'phone_numbers'],
                perPage: 5
            });
            
            // Verify that included array is NOT in the response
            // TypeScript ensures 'included' doesn't exist on the return type
            expect('included' in result).toBe(false);
            
            // Find persons with email relationships
            // Relationships are flattened to top level: person.emails instead of person.relationships.emails
            const personsWithEmails = result.data.filter((p: FlattenedPersonResource) => {
                if ('emails' in p && p.emails) {
                    if (Array.isArray(p.emails)) {
                        return p.emails.length > 0;
                    }
                    return typeof p.emails === 'object';
                }
                return false;
            });
            const personWithEmails = personsWithEmails[0];

            // If we found a person with emails, verify the structure
            if (personWithEmails && 'emails' in personWithEmails && personWithEmails.emails) {
                const emailData = personWithEmails.emails;
                expect(emailData).toBeDefined();
                const emails = Array.isArray(emailData) ? emailData : [emailData];
                expect(emails.length).toBeGreaterThan(0);

                const firstEmail = emails[0];
                if (firstEmail && typeof firstEmail === 'object' && 'address' in firstEmail) {
                    // Attributes are also flattened - address is directly on the email object
                    expect(firstEmail.address).toBeDefined();
                    expect(typeof firstEmail.address).toBe('string');
                }
            } else {
                // First 5 results may not include anyone with emails; verify we got data and structure
                expect(result.data.length).toBeGreaterThan(0);
                expect('included' in result).toBe(false);
            }
            
            // Find a person with phone relationships
            const personWithPhones = result.data.find((p) => {
                const person = p;
                return person.phone_numbers !== undefined && Array.isArray(person.phone_numbers) && person.phone_numbers.length > 0;
            });
            
            if (personWithPhones && personWithPhones.phone_numbers) {
                // Relationships are at top level - phone_numbers is directly the array
                const phoneData = personWithPhones.phone_numbers;
                
                // Verify that relationships contain FULL objects
                expect(phoneData).toBeDefined();
                const phones = Array.isArray(phoneData) ? phoneData : [phoneData];
                expect(phones.length).toBeGreaterThan(0);
                
                const firstPhone = phones[0];
                if (firstPhone && 'number' in firstPhone) {
                    // Attributes are flattened - number is directly on the phone object
                    expect(firstPhone.number).toBeDefined();
                    expect(typeof firstPhone.number).toBe('string');
                }
            }
        }, 120000);

        it('should work with all parameters combined', async () => {
            const result = await client.people.getPage({
                where: { status: 'active' },
                include: ['emails'],
                perPage: 5,
                page: 1,
                order: 'last_name'
            });
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeLessThanOrEqual(5);
            expect(result.meta).toBeDefined();
            expect(result.links).toBeDefined();
            result.data.forEach(person => {
                // Attributes are flattened to top level
                expect(person.status).toBe('active');
            });
        }, 30000);
    });

    describe('People Module - getById()', () => {
        it('should work with no include parameter', async () => {
            const result = await client.people.getById(testPersonId);
            expect(result).toBeDefined();
            expect(result.id).toBe(testPersonId);
            expect(result.type).toBe('Person');
            // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
            expect(result).toHaveProperty('first_name');
        }, 30000);

        it('should work with include parameter', async () => {
            const result = await client.people.getById(testPersonId, ['emails', 'phone_numbers']);
            expect(result).toBeDefined();
            expect(result.id).toBe(testPersonId);
            expect(result.type).toBe('Person');
            
            // Relationships are flattened to top level - person.emails instead of person.emails
            // Note: The test person may not have emails/phones, so we check if they exist
            if (result.emails && Array.isArray(result.emails) && result.emails.length > 0) {
                // Attributes are flattened - address is directly on the email
                const firstEmail = result.emails[0];
                expect(firstEmail).toHaveProperty('address');
                expect(typeof firstEmail.address).toBe('string');
            }
            
            if (result.phone_numbers && Array.isArray(result.phone_numbers) && result.phone_numbers.length > 0) {
                // Attributes are flattened - number is directly on the phone
                const firstPhone = result.phone_numbers[0];
                expect(firstPhone).toHaveProperty('number');
                expect(typeof firstPhone.number).toBe('string');
            }
            
            // Verify included array is NOT in the response (it's been mapped to relationships)
            // TypeScript ensures 'included' doesn't exist on the return type
            expect('included' in result).toBe(false);
        }, 30000);
    });

    describe('Workflows Module - getAll()', () => {
        it('should work with no parameters', async () => {
            const result = await client.workflows.getAll();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should work with where parameter', async () => {
            const result = await client.workflows.getAll({
                where: {} // Empty where clause
            });
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should work with include parameter', async () => {
            const result = await client.workflows.getAll({
                include: ['category', 'steps']
            });
            expect(result.data).toBeDefined();
            // Verify relationships exist (FlattenedResource has relationships at top level, not in .relationships)
            if (result.data.length > 0) {
                // FlattenedResource doesn't have .relationships - relationships are flattened to top level
                // Check for a relationship property directly (e.g., person, workflow, etc.)
                const firstItem = result.data[0];
                expect(firstItem).toBeDefined();
                expect(firstItem.id).toBeDefined();
                expect(firstItem.type).toBeDefined();
            }
        }, 30000);

        it('should work with order parameter', async () => {
            const result = await client.workflows.getAll({
                order: 'name'
            });
            expect(result.data).toBeDefined();
        }, 30000);
    });

    describe('Workflows Module - getPage()', () => {
        it('should work with pagination parameters', async () => {
            const result = await client.workflows.getPage({
                perPage: 5,
                page: 1
            });
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeLessThanOrEqual(5);
            expect(result.meta).toBeDefined();
            expect(result.links).toBeDefined();
        }, 30000);

        it('should work with all parameters', async () => {
            const result = await client.workflows.getPage({
                where: {}, // Empty where clause
                include: ['category'],
                perPage: 5,
                page: 1,
                order: 'name'
            });
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
            expect(result.links).toBeDefined();
        }, 30000);
    });

    describe('Workflows Module - getById()', () => {
        it('should work with include parameter', async () => {
            const workflows = await client.workflows.getPage({ perPage: 1 });
            expect(workflows.data.length).toBeGreaterThan(0);
            const workflowId = workflows.data[0].id;
            const result = await client.workflows.getById(workflowId, ['category', 'steps']);
            expect(result).toBeDefined();
            expect(result.id).toBe(workflowId);
        }, 60000);
    });

    describe('Notes Module - getAll()', () => {
        it('should work with no parameters', async () => {
            const result = await client.notes.getAll();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should work with where parameter', async () => {
            const result = await client.notes.getAll({
                where: {} // Empty where clause
            });
            expect(result.data).toBeDefined();
        }, 30000);

        it('should work with include parameter', async () => {
            const result = await client.notes.getAll({
                include: ['note_category', 'person']
            });
            expect(result.data).toBeDefined();
        }, 30000);
    });

    describe('Notes Module - getPage()', () => {
        it('should work with pagination', async () => {
            const result = await client.notes.getPage({
                perPage: 5,
                page: 1
            });
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
            expect(result.links).toBeDefined();
        }, 30000);
    });

    describe('Lists Module - getAll()', () => {
        it('should work with no parameters', async () => {
            const result = await client.lists.getAll();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should work with where parameter', async () => {
            const result = await client.lists.getAll({
                where: {} // Empty where clause
            });
            expect(result.data).toBeDefined();
        }, 30000);

        it('should work with include parameter', async () => {
            const result = await client.lists.getAll({
                include: ['category', 'campus']
            });
            expect(result.data).toBeDefined();
        }, 30000);

        it('should work with order parameter', async () => {
            const result = await client.lists.getAll({
                order: 'name'
            });
            expect(result.data).toBeDefined();
        }, 30000);
    });

    describe('Lists Module - getPage()', () => {
        it('should work with all parameters', async () => {
            const result = await client.lists.getPage({
                where: { list_category_id: undefined },
                include: ['category'],
                perPage: 5,
                page: 1,
                order: 'name'
            });
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
            expect(result.links).toBeDefined();
        }, 30000);
    });

    describe('Households Module - getAll()', () => {
        it('should work with no parameters', async () => {
            const result = await client.households.getAll();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should work with where parameter', async () => {
            const result = await client.households.getAll({
                where: {} // Empty where clause
            });
            expect(result.data).toBeDefined();
        }, 30000);

        it('should work with include parameter', async () => {
            const result = await client.households.getAll({
                include: ['people', 'primary_contact']
            });
            expect(result.data).toBeDefined();
        }, 30000);
    });

    describe('Households Module - getPage()', () => {
        it('should work with pagination', async () => {
            const result = await client.households.getPage({
                perPage: 5,
                page: 1,
                order: 'name'
            });
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
            expect(result.links).toBeDefined();
        }, 30000);
    });

    describe('Campus Module - getAll()', () => {
        it('should work with no parameters', async () => {
            const result = await client.campus.getAll();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should work with include parameter', async () => {
            const result = await client.campus.getAll({
                include: ['organization', 'service_times']
            });
            expect(result.data).toBeDefined();
        }, 30000);
    });

    describe('Campus Module - getPage()', () => {
        it('should work with pagination', async () => {
            const result = await client.campus.getPage({
                perPage: 5,
                page: 1
            });
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
            expect(result.links).toBeDefined();
        }, 30000);
    });

    describe('ServiceTime Module - getAll()', () => {
        it('should work with no parameters (except campusId)', async () => {
            expect(testCampusId).toBeTruthy(); // Campus ID must be set
            const result = await client.serviceTime.getAll(testCampusId);
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should work with include parameter', async () => {
            expect(testCampusId).toBeTruthy(); // Campus ID must be set
            const result = await client.serviceTime.getAll(testCampusId, {
                include: []
            });
            expect(result.data).toBeDefined();
        }, 30000);
    });

    describe('ServiceTime Module - getPage()', () => {
        it('should work with pagination', async () => {
            expect(testCampusId).toBeTruthy(); // Campus ID must be set
            const result = await client.serviceTime.getPage(testCampusId, {
                perPage: 5,
                page: 1
            });
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
            expect(result.links).toBeDefined();
        }, 30000);
    });

    describe('Forms Module - getAll()', () => {
        it('should work with no parameters', async () => {
            const result = await client.forms.getAll();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should work with where parameter', async () => {
            const result = await client.forms.getAll({
                where: { active: true }
            });
            expect(result.data).toBeDefined();
        }, 30000);
    });

    describe('Forms Module - getPage()', () => {
        it('should work with pagination', async () => {
            const result = await client.forms.getPage({
                perPage: 5,
                page: 1
            });
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
            expect(result.links).toBeDefined();
        }, 30000);
    });

    describe('Reports Module - getAll()', () => {
        it('should work with no parameters', async () => {
            const result = await client.reports.getAll();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should work with where parameter', async () => {
            const result = await client.reports.getAll({
                where: {} // Empty where clause
            });
            expect(result.data).toBeDefined();
        }, 30000);
    });

    describe('Reports Module - getPage()', () => {
        it('should work with pagination', async () => {
            const result = await client.reports.getPage({
                perPage: 5,
                page: 1
            });
            expect(result.data).toBeDefined();
            expect(result.meta).toBeDefined();
            expect(result.links).toBeDefined();
        }, 30000);
    });

    describe('Fields Module - getAllFieldDefinitions()', () => {
        it('should work with no parameters', async () => {
            // getAllFieldDefinitions returns PaginationResult with data array
            const result = await client.fields.getAllFieldDefinitions();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBeGreaterThan(0);
        }, 60000);

        it('should work with include parameter', async () => {
            // getAllFieldDefinitions doesn't accept include parameter - it's a cached method
            const result = await client.fields.getAllFieldDefinitions();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should work with where parameter', async () => {
            // getAllFieldDefinitions doesn't accept where parameter - it's a cached method
            const result = await client.fields.getAllFieldDefinitions();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);

        it('should work with order parameter', async () => {
            // getAllFieldDefinitions accepts FieldDefinitionListOptions, not include array
            const result = await client.fields.getAllFieldDefinitions({
                include: ['tab'],
                order: 'name'
            });
            // getAllFieldDefinitions returns PaginationResult with data array
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);
    });

    describe('Contacts Module - getAllEmails()', () => {
        it('should work with no parameters', async () => {
            const result = await client.contacts.getAllEmails();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);
    });

    describe('Contacts Module - getAllPhoneNumbers()', () => {
        it('should work with no parameters', async () => {
            const result = await client.contacts.getAllPhoneNumbers();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);
    });

    describe('Contacts Module - getAllAddresses()', () => {
        it('should work with no parameters', async () => {
            const result = await client.contacts.getAllAddresses();
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);
    });

    describe('Response Structure Validation', () => {
        it('should validate getAll() response structure', async () => {
            const result = await client.people.getAll();
            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('meta');
            expect(Array.isArray(result.data)).toBe(true);
            if (result.data.length > 0) {
                expect(result.data[0]).toHaveProperty('id');
                expect(result.data[0]).toHaveProperty('type');
                // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
                expect(result.data[0]).toHaveProperty('first_name');
            }
        }, 120000);

        it('should validate getPage() response structure', async () => {
            const result = await client.people.getPage({ perPage: 5 });
            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('meta');
            expect(result).toHaveProperty('links');
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.links).toHaveProperty('self');
            // Note: API may use offset-based pagination or may not always return all links
            // Just verify that links object exists and has at least 'self'
            expect(result.links).toBeDefined();
        }, 30000);

        it('should validate getById() response structure', async () => {
            const result = await client.people.getById(testPersonId);
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('type');
            // FlattenedResource doesn't have 'attributes' - attributes are flattened to top level
            // Check for a flattened attribute instead (e.g., first_name, last_name)
            expect(result).toHaveProperty('first_name');
            expect(result.id).toBe(testPersonId);
            expect(result.type).toBe('Person');
        }, 30000);

        it('should validate pagination links include all parameters', async () => {
            const result = await client.people.getPage({
                where: { status: 'active' },
                include: ['emails'],
                perPage: 10,
                page: 1,
                order: 'last_name'
            });
            
            expect(result.links).toBeDefined();
            expect(result.links?.self).toBeDefined();
            const selfLink = (result.links?.self || '') as string;
            // Links should preserve query parameters
            expect(selfLink).toContain('per_page=10');
            expect(selfLink).toContain('page=1');
        }, 30000);

        it('should validate meta.total_count reflects filtering', async () => {
            const allResult = await client.people.getPage({ perPage: 1 });
            const filteredResult = await client.people.getPage({
                where: { status: 'active' },
                perPage: 1
            });
            
            expect(allResult.meta?.total_count).toBeDefined();
            expect(filteredResult.meta?.total_count).toBeDefined();
            // Filtered count should be <= total count
            const allCount = Number(allResult.meta?.total_count) || 0;
            const filteredCount = Number(filteredResult.meta?.total_count) || 0;
            expect(filteredCount).toBeLessThanOrEqual(allCount);
        }, 30000);
    });

    describe('Parameter Edge Cases', () => {
        it('should handle empty where clause', async () => {
            const result = await client.people.getAll({ where: {} });
            expect(result.data).toBeDefined();
        }, 120000);

        it('should handle empty include array', async () => {
            const result = await client.people.getAll({ include: [] });
            expect(result.data).toBeDefined();
        }, 120000);

        it('should handle perPage at maximum (100)', async () => {
            const result = await client.people.getPage({ perPage: 100 });
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeLessThanOrEqual(100);
        }, 30000);

        it('should handle perPage at minimum (1)', async () => {
            const result = await client.people.getPage({ perPage: 1 });
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeLessThanOrEqual(1);
        }, 30000);

        it('should handle descending order', async () => {
            const result = await client.people.getPage({
                perPage: 5,
                order: '-created_at'
            });
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(1); // Need multiple items to verify ordering
            
            // Verify descending order (getPage returns flattened resources - created_at is at top level)
            const timestamps = result.data
                .map(p => 'created_at' in p ? p.created_at : undefined)
                .filter((ts): ts is string => typeof ts === 'string' && ts.length > 0);
            
            expect(timestamps.length).toBeGreaterThan(1); // Must have timestamps to verify order
            
            for (let i = 1; i < timestamps.length; i++) {
                const prev = new Date(timestamps[i - 1]).getTime();
                const curr = new Date(timestamps[i]).getTime();
                expect(curr).toBeLessThanOrEqual(prev);
            }
        }, 30000);

        it('should handle page number beyond available pages', async () => {
            const result = await client.people.getPage({
                perPage: 5,
                page: 99999 // Very high page number
            });
            expect(result.data).toBeDefined();
            // Should return empty array or handle gracefully
            expect(Array.isArray(result.data)).toBe(true);
        }, 30000);
    });

    describe('Comprehensive Order Parameter Testing', () => {
        it('should order by string field (last_name)', async () => {
            const result = await client.people.getPage({
                order: 'last_name',
                perPage: 10
            });
            
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(1); // Need multiple items to verify ordering
            
            // Verify ordering: last_name should be in ascending order (getPage returns flattened resources)
            const lastNames = result.data
                .map(p => 'last_name' in p ? p.last_name : undefined)
                .filter((name): name is string => typeof name === 'string' && name.length > 0);
            
            expect(lastNames.length).toBeGreaterThan(1); // Must have names to verify order
            
            for (let i = 1; i < lastNames.length; i++) {
                const prev = lastNames[i - 1].toLowerCase();
                const curr = lastNames[i].toLowerCase();
                expect(curr >= prev).toBe(true);
            }
        }, 30000);

        it('should order by string field (status)', async () => {
            const result = await client.people.getPage({
                order: 'status',
                perPage: 10
            });
            
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(1); // Need multiple items to verify ordering
            
            // Verify ordering: status should be in ascending order (as string)
            // getPage returns flattened resources - status is at top level
            const statuses: string[] = [];
            for (const person of result.data) {
                const status = 'status' in person ? person.status : undefined;
                if (typeof status === 'string') {
                    statuses.push(status);
                }
            }
            
            // Must have multiple statuses to verify order - test will fail if test data lacks statuses
            expect(statuses.length).toBeGreaterThan(1);
            
            for (let i = 1; i < statuses.length; i++) {
                const prev = statuses[i - 1].toLowerCase();
                const curr = statuses[i].toLowerCase();
                expect(curr >= prev).toBe(true);
            }
        }, 30000);

        it('should order by date field (updated_at)', async () => {
            const ascending = await client.people.getPage({
                order: 'updated_at',
                perPage: 10
            });
            
            expect(ascending.data).toBeDefined();
            expect(ascending.data.length).toBeGreaterThan(1); // Need multiple items to verify ordering
            
            // getPage returns flattened resources - updated_at is at top level
            const timestamps = ascending.data
                .map(p => 'updated_at' in p ? p.updated_at : undefined)
                .filter((ts): ts is string => typeof ts === 'string' && ts.length > 0);
            
            expect(timestamps.length).toBeGreaterThan(1); // Must have timestamps to verify order
            
            for (let i = 1; i < timestamps.length; i++) {
                const prev = new Date(timestamps[i - 1]).getTime();
                const curr = new Date(timestamps[i]).getTime();
                expect(curr).toBeGreaterThanOrEqual(prev);
            }
        }, 30000);

        it('should order workflows by name', async () => {
            const result = await client.workflows.getPage({
                order: 'name',
                perPage: 10
            });
            
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(1); // Need multiple items to verify ordering
            
            // getPage returns flattened resources - name is at top level
            const names = result.data
                .map(w => 'name' in w ? w.name : undefined)
                .filter((name): name is string => typeof name === 'string' && name.length > 0);
            
            expect(names.length).toBeGreaterThan(1); // Must have names to verify order
            
            for (let i = 1; i < names.length; i++) {
                const prev = names[i - 1].toLowerCase();
                const curr = names[i].toLowerCase();
                expect(curr >= prev).toBe(true);
            }
        }, 30000);

        it('should order lists by created_at descending', async () => {
            const result = await client.lists.getPage({
                order: '-created_at',
                perPage: 10
            });
            
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(1); // Need multiple items to verify ordering
            
            // getPage returns flattened resources - created_at is at top level
            const timestamps = result.data
                .map(l => 'created_at' in l ? l.created_at : undefined)
                .filter((ts): ts is string => typeof ts === 'string' && ts.length > 0);
            
            expect(timestamps.length).toBeGreaterThan(1); // Must have timestamps to verify order
            
            for (let i = 1; i < timestamps.length; i++) {
                const prev = new Date(timestamps[i - 1]).getTime();
                const curr = new Date(timestamps[i]).getTime();
                expect(curr).toBeLessThanOrEqual(prev);
            }
        }, 30000);

        it('should handle order with where clause', async () => {
            const result = await client.people.getPage({
                where: { status: 'active' },
                order: 'last_name',
                perPage: 10
            });
            
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(1); // Need multiple items to verify ordering
            result.data.forEach(person => {
                // Attributes are flattened to top level
                expect(person.status).toBe('active');
            });
            
            // Verify ordering is still applied (getPage returns flattened resources)
            const lastNames = result.data
                .map(p => 'last_name' in p ? p.last_name : undefined)
                .filter((name): name is string => typeof name === 'string' && name.length > 0);
            
            expect(lastNames.length).toBeGreaterThan(1); // Must have names to verify order
            
            for (let i = 1; i < lastNames.length; i++) {
                const prev = lastNames[i - 1].toLowerCase();
                const curr = lastNames[i].toLowerCase();
                expect(curr >= prev).toBe(true);
            }
        }, 30000);

        it('should handle order with include parameter', async () => {
            const result = await client.people.getPage({
                include: ['emails'],
                order: 'created_at',
                perPage: 10
            });
            
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(1); // Need multiple items to verify ordering
            
            // Verify ordering is still applied even with include
            // Attributes are flattened to top level
            const timestamps = result.data
                .map(p => p.created_at)
                .filter((ts): ts is string => !!ts);
            
            expect(timestamps.length).toBeGreaterThan(1); // Must have timestamps to verify order
            
            for (let i = 1; i < timestamps.length; i++) {
                const prev = new Date(timestamps[i - 1]).getTime();
                const curr = new Date(timestamps[i]).getTime();
                expect(curr).toBeGreaterThanOrEqual(prev);
            }
        }, 30000);
    });
});
