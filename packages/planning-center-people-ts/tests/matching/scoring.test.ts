import { MatchScorer } from '../../src/matching/scoring';
import { PeopleModule } from '../../src/modules/people';

// Mock the PeopleModule
const mockPeopleModule = {
  findOrCreate: jest.fn(),
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getPrimaryCampus: jest.fn(),
  setPrimaryCampus: jest.fn(),
  removePrimaryCampus: jest.fn(),
  getHousehold: jest.fn(),
  setHousehold: jest.fn(),
  removeFromHousehold: jest.fn(),
  getHouseholdMembers: jest.fn(),
  getByCampus: jest.fn(),
  getWorkflowCards: jest.fn(),
  getNotes: jest.fn(),
  getFieldData: jest.fn(),
  getSocialProfiles: jest.fn(),
  findOrCreate: jest.fn(),
  getAllPagesPaginated: jest.fn(),
} as unknown as PeopleModule;

describe('MatchScorer', () => {
  let scorer: MatchScorer;

  beforeEach(() => {
    jest.clearAllMocks();
    scorer = new MatchScorer(mockPeopleModule);
  });

  describe('constructor', () => {
    it('should create a MatchScorer instance', () => {
      expect(scorer).toBeInstanceOf(MatchScorer);
    });
  });

  describe('scoreMatch', () => {
    it('should score a person match based on various criteria', async () => {
      const mockPerson = {
        id: '1',
        type: 'Person',
        attributes: {
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const options = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      const result = await scorer.scoreMatch(mockPerson, options);

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });
  });

  describe('scoreEmailMatch', () => {
    it('should score email matches', async () => {
      const mockPerson = {
        id: '1',
        type: 'Person',
        attributes: {
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const result = await scorer.scoreEmailMatch(mockPerson, 'john@example.com');

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });
  });

  describe('scorePhoneMatch', () => {
    it('should score phone matches', async () => {
      const mockPerson = {
        id: '1',
        type: 'Person',
        attributes: {
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const result = await scorer.scorePhoneMatch(mockPerson, '555-1234');

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });
  });

  describe('scoreNameMatch', () => {
    it('should score name matches', async () => {
      const mockPerson = {
        id: '1',
        type: 'Person',
        attributes: {
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const result = await scorer.scoreNameMatch(mockPerson, {
        first_name: 'John',
        last_name: 'Doe',
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });
  });

  describe('getMatchReason', () => {
    it('should get match reason', async () => {
      const mockPerson = {
        id: '1',
        type: 'Person',
        attributes: {
          first_name: 'John',
          last_name: 'Doe',
        },
      };

      const options = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };

      const result = await scorer.getMatchReason(mockPerson, options);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('scoreAgeMatch', () => {
    it('should score age matches', async () => {
      const mockPerson = {
        id: '1',
        type: 'Person',
        attributes: {
          first_name: 'John',
          last_name: 'Doe',
          birthdate: '1990-01-01',
        },
      };

      const result = await scorer.scoreAgeMatch(mockPerson, {
        birthdate: '1990-01-01',
      });

      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });
  });
});
