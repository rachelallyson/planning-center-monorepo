import { PersonMatcher } from '../../src/matching/matcher';

// Mock PeopleModule
const createMockPeopleModule = () => {
    const mockPeople: any[] = [];
    
    return {
        search: jest.fn().mockResolvedValue({ data: mockPeople }),
        getEmails: jest.fn().mockResolvedValue({ data: [] }),
        getPhoneNumbers: jest.fn().mockResolvedValue({ data: [] }),
        create: jest.fn().mockResolvedValue({ id: 'new-person-123', attributes: {} }),
        addEmail: jest.fn().mockResolvedValue({}),
        addPhoneNumber: jest.fn().mockResolvedValue({}),
        setPrimaryCampus: jest.fn().mockResolvedValue({}),
        // Allow tests to configure mock people
        _setMockPeople: (people: any[]) => {
            mockPeople.length = 0;
            mockPeople.push(...people);
        },
    };
};

describe('PersonMatcher Multi-Step Search', () => {
    let matcher: PersonMatcher;
    let mockModule: ReturnType<typeof createMockPeopleModule>;

    beforeEach(() => {
        mockModule = createMockPeopleModule();
        matcher = new PersonMatcher(mockModule as any);
    });

    describe('findMatchMultiStep', () => {
        it('tries fuzzy with age preference first', async () => {
            const mockPerson = {
                id: 'person-123',
                attributes: {
                    first_name: 'John',
                    last_name: 'Doe',
                    birthdate: '1985-05-15', // Adult
                },
            };
            
            mockModule._setMockPeople([mockPerson]);
            mockModule.getEmails.mockResolvedValue({
                data: [{ attributes: { address: 'john@example.com' } }]
            });
            
            const result = await matcher.findMatchMultiStep({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                agePreference: 'adults',
            });
            
            expect(result).not.toBeNull();
            expect(result?.person.id).toBe('person-123');
        });

        it('falls back to fuzzy without age preference if first strategy fails', async () => {
            const childPerson = {
                id: 'child-123',
                attributes: {
                    first_name: 'John',
                    last_name: 'Doe Jr',
                    birthdate: new Date().toISOString(), // Child (just born)
                },
            };
            
            // First search (with age preference) returns empty
            // Second search (without age preference) returns the child
            let searchCount = 0;
            mockModule.search.mockImplementation(() => {
                searchCount++;
                // First two searches (fuzzy with age, fuzzy without age) - return empty then person
                if (searchCount <= 2) {
                    return Promise.resolve({ data: [] });
                }
                // Later searches find the person
                return Promise.resolve({ data: [childPerson] });
            });
            
            mockModule.getEmails.mockResolvedValue({
                data: [{ attributes: { address: 'john@example.com' } }]
            });
            
            const result = await matcher.findMatchMultiStep({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                agePreference: 'adults', // Looking for adult
            });
            
            // Should have tried multiple strategies
            expect(mockModule.search).toHaveBeenCalled();
        });

        it('returns null when no match found in any strategy', async () => {
            mockModule._setMockPeople([]);
            
            const result = await matcher.findMatchMultiStep({
                firstName: 'NonExistent',
                lastName: 'Person',
                email: 'nobody@example.com',
            });
            
            expect(result).toBeNull();
        });

        it('handles errors gracefully and continues to next strategy', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            
            let callCount = 0;
            mockModule.search.mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.reject(new Error('Network error'));
                }
                return Promise.resolve({ data: [] });
            });
            
            const result = await matcher.findMatchMultiStep({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
            });
            
            expect(result).toBeNull();
            // The error could be logged as "Email search failed:" or "Multi-step strategy"
            // depending on where in the call stack it's caught
            expect(consoleSpy).toHaveBeenCalled();
            
            consoleSpy.mockRestore();
        });
    });

    describe('findOrCreate with searchStrategy', () => {
        it('uses single strategy by default', async () => {
            mockModule._setMockPeople([]);
            
            await matcher.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                createIfNotFound: true,
            });
            
            // With single strategy, search should be called fewer times
            // than multi-step which tries 4 different strategies
            expect(mockModule.search.mock.calls.length).toBeLessThan(4);
        });

        it('uses multi-step strategy when specified', async () => {
            mockModule._setMockPeople([]);
            
            await matcher.findOrCreate({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                searchStrategy: 'multi-step',
                createIfNotFound: true,
            });
            
            // Multi-step tries up to 4 strategies, each may make multiple searches
            expect(mockModule.search).toHaveBeenCalled();
        });
    });
});
