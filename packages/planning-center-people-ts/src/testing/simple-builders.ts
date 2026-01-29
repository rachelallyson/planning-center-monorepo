/**
 * Simplified Mock Response Builders for Testing
 *
 * Builders return flattened shape (same as API): attributes and relationships at top level.
 */

export class SimpleMockResponseBuilder {
    /**
     * Build a simple mock person resource (flattened shape)
     */
    static person(overrides: any = {}): any {
        const id = overrides.id || `person_${Date.now()}`;
        return {
            type: 'Person',
            id,
            first_name: overrides.first_name ?? 'John',
            last_name: overrides.last_name ?? 'Doe',
            status: 'active',
            ...overrides,
            emails: [],
            phone_numbers: [],
            field_data: [],
            workflow_cards: [],
            household: null,
        };
    }

    /**
     * Build a simple mock email resource (flattened shape)
     */
    static email(overrides: any = {}): any {
        const id = overrides.id || `email_${Date.now()}`;
        return {
            type: 'Email',
            id,
            address: overrides.address ?? 'john@gmail.com',
            location: 'Home',
            primary: true,
            ...overrides,
            person: { type: 'Person', id: 'person_123' },
        };
    }

    /**
     * Build a simple mock phone number resource (flattened shape)
     */
    static phoneNumber(overrides: any = {}): any {
        const id = overrides.id || `phone_${Date.now()}`;
        return {
            type: 'PhoneNumber',
            id,
            number: overrides.number ?? '555-1234',
            location: 'Mobile',
            primary: true,
            ...overrides,
            person: { type: 'Person', id: 'person_123' },
        };
    }

    /**
     * Build a simple mock workflow resource (flattened shape)
     */
    static workflow(overrides: any = {}): any {
        const id = overrides.id || `workflow_${Date.now()}`;
        return {
            type: 'Workflow',
            id,
            name: overrides.name ?? 'New Member Workflow',
            description: overrides.description ?? 'Workflow for new members',
            ...overrides,
        };
    }

    /**
     * Build a simple paginated response
     */
    static paginated(data: any[], meta: any = {}): any {
        return {
            data,
            meta: {
                total_count: data.length,
                count: data.length,
                ...meta,
            },
            links: {
                self: '/api/v2/people?page=1',
                next: null,
                prev: null,
            },
        };
    }

    /**
     * Build a simple single resource response
     */
    static single(data: any): any {
        return { data };
    }

    /**
     * Build a simple error response
     */
    static error(status: number, message: string, details: any = {}): any {
        return {
            errors: [
                {
                    status: status.toString(),
                    title: message,
                    detail: details,
                },
            ],
        };
    }
}
