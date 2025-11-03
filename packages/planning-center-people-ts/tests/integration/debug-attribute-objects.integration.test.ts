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
        const people = await client.people.getAll({ perPage: 1 });
        expect(people.data.length).toBeGreaterThan(0);
        const person = people.data[0];

        const attrs = person.attributes ?? {};
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
                // eslint-disable-next-line no-console
                console.log(`[Person.attributes.${String(key)}] typeof=object value=\n${serialized}`);
            }
        }
    }, 30000);

    it('logs object-shaped field attributes for a field definition (if present)', async () => {
        const defs = await client.fields.getAllFieldDefinitions();
        if (defs.length === 0) return;
        const field = defs[0];
        const attrs = field.attributes ?? {};
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
                // eslint-disable-next-line no-console
                console.log(`[FieldDefinition.attributes.${String(key)}] typeof=object value=\n${serialized}`);
            }
        }
    }, 30000);

    it('logs campus latitude/longitude types (if present)', async () => {
        const campuses = await client.campus.getAll({ perPage: 1 });
        if (campuses.data.length === 0) return;
        const campus = campuses.data[0];
        const attrs = campus.attributes ?? {};
        const lat = (attrs as any)['latitude'];
        const lng = (attrs as any)['longitude'];
        // eslint-disable-next-line no-console
        console.log(`[Campus.attributes.latitude] typeof=${typeof lat} value=${lat}`);
        // eslint-disable-next-line no-console
        console.log(`[Campus.attributes.longitude] typeof=${typeof lng} value=${lng}`);
    }, 30000);
});




