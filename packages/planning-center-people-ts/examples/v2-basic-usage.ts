/**
 * v2.0.0 Basic Usage Examples
 */

import { PcoClient } from '@rachelallyson/planning-center-people-ts';

// Example 1: Basic client setup
async function basicSetup() {
    const client = new PcoClient({
        auth: {
            type: 'oauth',
            accessToken: 'your-access-token',
            refreshToken: 'your-refresh-token',
            onRefresh: (tokens) => {
                console.log('Tokens refreshed:', tokens);
                // Save new tokens to your database
            },
            onRefreshFailure: () => {
                console.error('Token refresh failed');
            },
        },
        debug: true, // optional: request logging
    });

    return client;
}

// Example 2: People operations (see Example 3)
// For multi-tenant apps, create a new PcoClient per church/session or cache clients yourself.

// Example 3: People operations with smart matching
async function peopleOperations(client: PcoClient) {
    // Get all people (all pages)
    const allPeople = await client.people.getAll({
        where: { status: 'active' },
        include: ['emails', 'phone_numbers'],
    });

    console.log(`Found ${allPeople.data.length} people`);

    // Smart person matching and creation
    const person = await client.people.findOrCreate({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@gmail.com',
        phone: '555-1234',
        matchStrategy: 'fuzzy',
        createIfNotFound: true,
    });

    console.log('Person found/created:', person.id);

    // Age preference matching examples
    console.log('\n--- Age Preference Examples ---');

    // Prefer adults (18+ years old)
    const adultPerson = await client.people.findOrCreate({
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@gmail.com',
        agePreference: 'adults',
        matchStrategy: 'fuzzy',
    });
    console.log('Adult person found:', adultPerson.id);

    // Prefer children (under 18 years old)
    const childPerson = await client.people.findOrCreate({
        first_name: 'Bobby',
        last_name: 'Johnson',
        agePreference: 'children',
        matchStrategy: 'fuzzy',
    });
    console.log('Child person found:', childPerson.id);

    // Match by age range
    const youngAdult = await client.people.findOrCreate({
        first_name: 'Alice',
        last_name: 'Brown',
        email: 'alice@gmail.com',
        minAge: 20,
        maxAge: 30,
        matchStrategy: 'fuzzy',
    });
    console.log('Young adult found:', youngAdult.id);

    // Match by birth year
    const millennial = await client.people.findOrCreate({
        first_name: 'David',
        last_name: 'Wilson',
        birthYear: 1990,
        matchStrategy: 'fuzzy',
    });
    console.log('Millennial found:', millennial.id);

    // Create person with contact information
    const personWithContacts = await client.people.createWithContacts(
        {
            first_name: 'Jane',
            last_name: 'Smith',
        },
        {
            email: { address: 'jane@gmail.com', primary: true },
            phone: { number: '555-5678', primary: true },
        }
    );

    return { person, personWithContacts };
}

// Example 4: Type-safe field operations
async function fieldOperations(client: PcoClient) {
    const personId = 'person-123';

    // Set field by slug (with automatic field definition lookup)
    await client.fields.setPersonFieldBySlug(personId, 'BIRTHDATE', '1990-01-01');

    // Set field by name
    await client.fields.setPersonFieldByName(personId, 'Membership Status', 'Member');

    // Set field with options
    await client.fields.setPersonField(personId, {
        fieldSlug: 'CUSTOM_FIELD',
        value: 'Some value',
        handleFileUploads: true,
    });

    // Get all field definitions
    const fieldDefinitions = await client.fields.getAllFieldDefinitions();
    console.log(`Found ${fieldDefinitions.data.length} field definitions`);
}

// Example 5: Smart workflow operations
async function workflowOperations(client: PcoClient) {
    const personId = 'person-123';
    const workflowId = 'workflow-456';

    // Add person to workflow with duplicate detection
    const workflowCard = await client.workflows.addPersonToWorkflow(
        personId,
        workflowId,
        {
            note: 'Added from integration',
            skipIfExists: true, // Don't add if already completed/removed
            skipIfActive: true, // Don't add if already active
        }
    );

    console.log('Workflow card created:', workflowCard.id);

    // Get all workflows
    const allWorkflows = await client.workflows.getAll();
    console.log(`Found ${allWorkflows.data.length} workflows`);
}

// Example 6: Rate limit info
async function rateLimitInfo(client: PcoClient) {
    const rateLimitInfo = client.getRateLimitInfo();
    console.log('Rate limit info:', rateLimitInfo);
}

// Example 7: Complete workflow
async function completeWorkflow() {
    const client = new PcoClient({
        auth: {
            type: 'oauth',
            accessToken: process.env.PCO_ACCESS_TOKEN!,
            refreshToken: process.env.PCO_REFRESH_TOKEN!,
            onRefresh: async () => {},
            onRefreshFailure: async () => {},
        },
    });

    try {
        // 1. Find or create a person
        const person = await client.people.findOrCreate({
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@gmail.com',
            matchStrategy: 'fuzzy',
        });

        // 2. Set custom fields
        await client.fields.setPersonFieldBySlug(person.id, 'BIRTHDATE', '1990-01-01');
        await client.fields.setPersonFieldByName(person.id, 'Membership Status', 'Member');

        // 3. Add to workflow
        const workflowCard = await client.workflows.addPersonToWorkflow(
            person.id,
            'new-member-workflow',
            {
                note: 'New member added via integration',
                skipIfExists: true,
            }
        );

        console.log('Complete workflow finished successfully');
        return { person, workflowCard };
    } catch (error) {
        console.error('Workflow failed:', error);
        throw error;
    }
}

export {
    basicSetup,
    peopleOperations,
    fieldOperations,
    workflowOperations,
    rateLimitInfo,
    completeWorkflow,
};
