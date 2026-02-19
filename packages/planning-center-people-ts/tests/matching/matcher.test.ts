import { PersonMatcher } from '../../src/matching/matcher';
import type { PersonMatcherDeps } from '../../src/modules/people';
import type { PersonResource } from '../../src/types';

const mockPeopleModule: jest.Mocked<PersonMatcherDeps> = {
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
        first_name: 'John',
        last_name: 'Doe',
      };

      mockPeopleModule.search.mockResolvedValue({ data: [] });
      mockPeopleModule.getEmails.mockResolvedValue({ data: [] });
      mockPeopleModule.getPhoneNumbers.mockResolvedValue({ data: [] });
      mockPeopleModule.create.mockResolvedValueOnce({ data: mockPerson });
      mockPeopleModule.getById.mockResolvedValue(mockPerson);

      const result = await matcher.findOrCreate({
        first_name: 'John',
        last_name: 'Doe',
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

      const result = await matcher.findMatch({ first_name: 'No', last_name: 'Match' });

      expect(result).toBeNull();
    });
  });
});