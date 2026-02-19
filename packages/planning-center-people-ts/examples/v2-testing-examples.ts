/**
 * v2.0.0 Integration Testing Examples
 *
 * We prefer integration tests (real API) over mocks. Use a real PcoClient
 * with credentials from environment (e.g. .env.test) and run against the API.
 *
 * In this repo, tests use createTestClient() from tests/integration/test-config.ts
 * which loads credentials and returns a real client. This file shows the same
 * pattern for examples or your own test suites.
 */

import { PcoClient } from '@rachelallyson/planning-center-people-ts';

/**
 * Create a real client for integration tests.
 * In the repo we use tests/integration/test-config.ts which does this with
 * createTestClient() and logs auth status.
 */
function createIntegrationClient(): PcoClient {
    const applicationId = process.env.PCO_APPLICATION_ID;
    const secret = process.env.PCO_SECRET;

    if (!applicationId || !secret) {
        throw new Error(
            'Set PCO_APPLICATION_ID and PCO_SECRET (e.g. in .env.test) to run integration examples.'
        );
    }

    return new PcoClient({
        auth: {
            type: 'personal_access_token',
            applicationId,
            secret,
        },
    });
}

/**
 * Example: basic integration test flow — create a person and fetch people.
 */
async function basicIntegrationExample() {
    const client = createIntegrationClient();

    const people = await client.people.getPage({ per_page: 5 });
    console.log('People (first page):', people.data?.length ?? 0);

    const person = await client.people.create({
        first_name: 'Integration',
        last_name: 'Test',
        status: 'active',
    });
    console.log('Created person:', person.id);

    const fieldDefs = await client.fields.getAllFieldDefinitions();
    console.log('Field definitions:', fieldDefs.length);
}

/**
 * Example: findOrCreate with real API.
 */
async function findOrCreateExample() {
    const client = createIntegrationClient();

    const person = await client.people.findOrCreate({
        first_name: 'Test',
        last_name: 'User',
        email: `test-${Date.now()}@example.com`,
        createIfNotFound: true,
    });
    console.log('Find or create person:', person.id);
}

/**
 * Example: simple getPage call (useful in integration tests).
 */
async function getPageExample() {
    const client = createIntegrationClient();
    await client.people.getPage({ per_page: 1 });
}

export {
    createIntegrationClient,
    basicIntegrationExample,
    findOrCreateExample,
    getPageExample,
};
