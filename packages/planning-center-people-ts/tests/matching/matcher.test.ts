import { PersonMatcher } from '../../src/matching/matcher';
import type { PeopleModule } from '../../src/modules/people';
import type { PersonResource, PersonAttributes } from '../../src/types';

// Mock the PeopleModule
const mockPeopleModule: jest.Mocked<Pick<PeopleModule, 'search' | 'getEmails' | 'getPhoneNumbers' | 'create' | 'addEmail' | 'addPhoneNumber' | 'setPrimaryCampus' | 'getById'>> = {
  search: jest.fn(),
  getEmails: jest.fn(),
  getPhoneNumbers: jest.fn(),
  create: jest.fn(),
  addEmail: jest.fn(),
  addPhoneNumber: jest.fn(),
  setPrimaryCampus: jest.fn(),
  getById: jest.fn(),
};

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
      const mockPerson: PersonResource = {
        id: '1',
        type: 'Person',
        attributes: {
          first_name: 'John',
          last_name: 'Doe',
        },
        relationships: {},
      };

      mockPeopleModule.search.mockResolvedValue({ data: [] });
      mockPeopleModule.getEmails.mockResolvedValue({ data: [] });
      mockPeopleModule.getPhoneNumbers.mockResolvedValue({ data: [] });
      mockPeopleModule.create.mockResolvedValueOnce(mockPerson);
      mockPeopleModule.getById.mockResolvedValue({
        id: '1',
        type: 'Person',
        first_name: 'John',
        last_name: 'Doe',
      });

      const result = await matcher.findOrCreate({
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(mockPeopleModule.create).toHaveBeenCalled();
      expect(result.id).toBe('1');
    });
  });

  describe('findMatch', () => {
    it('should return null when no candidates match', async () => {
      mockPeopleModule.search.mockResolvedValue({ data: [] });
      mockPeopleModule.getEmails.mockResolvedValue({ data: [] });
      mockPeopleModule.getPhoneNumbers.mockResolvedValue({ data: [] });

      const result = await matcher.findMatch({ firstName: 'No', lastName: 'Match' });

      expect(result).toBeNull();
    });
  });
});