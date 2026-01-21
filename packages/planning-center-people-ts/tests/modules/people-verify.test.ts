import { PeopleModule } from '../../src/modules/people';

// Mock dependencies
const createMockHttpClient = () => ({
    request: jest.fn(),
});

const createMockPaginationHelper = () => ({
    getAll: jest.fn(),
});

const createMockEventEmitter = () => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
});

describe('PeopleModule.verifyPersonExists', () => {
    let peopleModule: PeopleModule;
    let mockHttpClient: ReturnType<typeof createMockHttpClient>;

    beforeEach(() => {
        mockHttpClient = createMockHttpClient();
        const mockPaginationHelper = createMockPaginationHelper();
        const mockEventEmitter = createMockEventEmitter();
        
        peopleModule = new PeopleModule(
            mockHttpClient as any,
            mockPaginationHelper as any,
            mockEventEmitter as any
        );
    });

    it('returns true when person exists', async () => {
        mockHttpClient.request.mockResolvedValue({
            data: {
                data: {
                    id: 'person-123',
                    attributes: { first_name: 'John' }
                }
            }
        });

        const exists = await peopleModule.verifyPersonExists('person-123');
        
        expect(exists).toBe(true);
        expect(mockHttpClient.request).toHaveBeenCalledWith({
            method: 'GET',
            endpoint: '/people/person-123',
            params: {}
        });
    });

    it('returns false when person not found (404)', async () => {
        const error: any = new Error('Not found');
        error.status = 404;
        mockHttpClient.request.mockRejectedValue(error);

        const exists = await peopleModule.verifyPersonExists('deleted-person');
        
        expect(exists).toBe(false);
    });

    it('returns false when 404 is in response.status', async () => {
        const error: any = new Error('Not found');
        error.response = { status: 404 };
        mockHttpClient.request.mockRejectedValue(error);

        const exists = await peopleModule.verifyPersonExists('deleted-person');
        
        expect(exists).toBe(false);
    });

    it('throws error for non-404 errors', async () => {
        const error = new Error('Server error');
        (error as any).status = 500;
        mockHttpClient.request.mockRejectedValue(error);

        await expect(peopleModule.verifyPersonExists('person-123'))
            .rejects.toThrow('Server error');
    });

    it('times out after specified duration', async () => {
        // Simulate a slow request
        mockHttpClient.request.mockImplementation(() => 
            new Promise(resolve => setTimeout(resolve, 5000))
        );

        await expect(peopleModule.verifyPersonExists('person-123', { timeout: 100 }))
            .rejects.toThrow('Person verification timed out after 100ms');
    });

    it('uses default timeout of 30000ms', async () => {
        mockHttpClient.request.mockResolvedValue({
            data: { data: { id: 'person-123' } }
        });

        // Should not timeout within reasonable time
        const exists = await peopleModule.verifyPersonExists('person-123');
        
        expect(exists).toBe(true);
    });

    it('resolves before timeout when request is fast', async () => {
        mockHttpClient.request.mockResolvedValue({
            data: { data: { id: 'person-123' } }
        });

        const startTime = Date.now();
        const exists = await peopleModule.verifyPersonExists('person-123', { timeout: 5000 });
        const elapsed = Date.now() - startTime;
        
        expect(exists).toBe(true);
        expect(elapsed).toBeLessThan(1000); // Should resolve quickly
    });
});
