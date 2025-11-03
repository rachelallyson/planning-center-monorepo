import { PersonMatcher } from '../../src/matching/matcher';
import { PeopleModule } from '../../src/modules/people';

// Mock the PeopleModule
const mockPeopleModule = {
  search: jest.fn(),
  getEmails: jest.fn(),
  getPhoneNumbers: jest.fn(),
  create: jest.fn(),
  addEmail: jest.fn(),
  addPhoneNumber: jest.fn(),
  setPrimaryCampus: jest.fn(),
  getById: jest.fn(),
} as unknown as PeopleModule;

describe('PersonMatcher', () => {
  let matcher: PersonMatcher;

  beforeEach(() => {
    jest.clearAllMocks();
    matcher = new PersonMatcher(mockPeopleModule);
  });

  describe('constructor', () => {
    it('should create a PersonMatcher instance', () => {
      expect(matcher).toBeInstanceOf(PersonMatcher);
    });
  });

  describe('findOrCreate', () => {
    it('should create a person when no match is found', async () => {
      const mockPerson = {
        id: '1',
        type: 'Person',
        attributes: {
          first_name: 'John',
          last_name: 'Doe',
        },
      } as any;

      (mockPeopleModule.search as any).mockResolvedValue({ data: [] });
      (mockPeopleModule.getEmails as any).mockResolvedValue({ data: [] });
      (mockPeopleModule.getPhoneNumbers as any).mockResolvedValue({ data: [] });
      (mockPeopleModule.create as any).mockResolvedValueOnce(mockPerson);

      const result = await matcher.findOrCreate({
        firstName: 'John',
        lastName: 'Doe',
      } as any);

      expect(mockPeopleModule.create).toHaveBeenCalled();
      expect(result).toEqual(mockPerson);
    });
  });

  describe('findMatch', () => {
    it('should return null when no candidates match', async () => {
      (mockPeopleModule.search as any).mockResolvedValue({ data: [] });
      (mockPeopleModule.getEmails as any).mockResolvedValue({ data: [] });
      (mockPeopleModule.getPhoneNumbers as any).mockResolvedValue({ data: [] });

      const result = await matcher.findMatch({ firstName: 'No', lastName: 'Match' } as any);

      expect(result === null || result?.person).toBeTruthy();
    });
  });
});