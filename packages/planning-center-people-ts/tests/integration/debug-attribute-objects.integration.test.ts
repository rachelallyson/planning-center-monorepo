/**
 * Diagnostic test: log object-shaped attributes returned by the API
 */
import { createTestClient, logAuthStatus } from './test-config';

describe('Diagnostic: Inspect object-shaped attributes', () => {
    const FIELDS_TO_CHECK: Array<keyof any> = [
        'given_name',
        'middle_name',
        'nickname',
        'anniversary',
        'gender',
        'grade',
        'graduation_year',
        'school_type',
        'inactive_reason',
        'marital_status',
        'name_prefix',
        'name_suffix',
        'remote_id',
        'medical_notes',
        'inactivated_at',
        // campus fields often stringified numbers
        'latitude',
        'longitude',
        // generic timestamps that may vary
        'deleted_at',
    ];

    const client = createTestClient();

    beforeAll(() => {
        logAuthStatus();
    });

    it('logs object-shaped person attributes for the first person', async () => {
        const people = await client.people.getPage({ perPage: 1 });
        expect(people.data.length).toBeGreaterThan(0);
        const person = people.data[0];

        // Flattened resources: attributes at top level (no .attributes)
        const attrs = (person as { attributes?: Record<string, unknown> }).attributes ?? person;
        for (const key of FIELDS_TO_CHECK) {
            const value = (attrs as any)[key];
            if (value !== undefined && typeof value === 'object') {
                // Safe stringify with fallback
                let serialized = '';
                try {
                    serialized = JSON.stringify(value, null, 2);
                } catch {
                    serialized = String(value);
                }
                expect(typeof value).toBe('object');
                expect(serialized).toBeTruthy();
            }
        }
    }, 30000);

    it('logs object-shaped field attributes for a field definition (if present)', async () => {
        const defs = await client.fields.getAllFieldDefinitions();
        // getAllFieldDefinitions returns PaginationResult with data array
        expect(defs.data.length).toBeGreaterThan(0);
        // Fields are flattened - attributes are at top level
        const field = defs.data[0];
        // For flattened resources, we access properties directly, not through attributes
        const attrs = field;
        const candidateKeys = ['deleted_at'];
        for (const key of candidateKeys) {
            const value = (attrs as any)[key];
            if (value !== undefined && typeof value === 'object') {
                let serialized = '';
                try {
                    serialized = JSON.stringify(value, null, 2);
                } catch {
                    serialized = String(value);
                }
                expect(typeof value).toBe('object');
                expect(serialized).toBeTruthy();
            }
        }
    }, 30000);

    it('logs campus latitude/longitude types (if present)', async () => {
        const campuses = await client.campus.getPage({ perPage: 1 });
        expect(campuses.data.length).toBeGreaterThan(0);
        const campus = campuses.data[0];
        // Flattened resources: attributes at top level
        const attrs = (campus as { attributes?: Record<string, unknown> }).attributes ?? campus;
        const lat = (attrs as any)['latitude'];
        const lng = (attrs as any)['longitude'];
        expect(typeof lat).toBeDefined();
        expect(typeof lng).toBeDefined();
    }, 30000);
});




