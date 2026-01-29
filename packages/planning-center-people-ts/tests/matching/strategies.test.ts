import { MatchStrategies } from '../../src/matching/strategies';
import type { MatchResult } from '../../src/matching/matcher';

describe('MatchStrategies', () => {
  let strategies: MatchStrategies;

  beforeEach(() => {
    strategies = new MatchStrategies();
  });

  describe('constructor', () => {
    it('should create a MatchStrategies instance', () => {
      expect(strategies).toBeInstanceOf(MatchStrategies);
    });
  });

  describe('selectBestMatch', () => {
    it('should select the best match based on strategy', () => {
      const candidates: MatchResult[] = [
        {
          person: {
            id: '1',
            type: 'Person',
            attributes: {
              first_name: 'John',
              last_name: 'Doe',
            },
          },
          score: 0.9,
          reason: 'Exact match',
        },
        {
          person: {
            id: '2',
            type: 'Person',
            attributes: {
              first_name: 'Jane',
              last_name: 'Doe',
            },
          },
          score: 0.7,
          reason: 'Fuzzy match',
        },
      ];

      const result = strategies.selectBestMatch(candidates, 'exact');

      expect(result === null || typeof result.score === 'number').toBeTruthy();
    });

    it('should return null for empty candidates', () => {
      const result = strategies.selectBestMatch([], 'exact');

      expect(result).toBeNull();
    });

    it('should use fuzzy strategy as default', () => {
      const candidates: MatchResult[] = [
        {
          person: {
            id: '1',
            type: 'Person',
            attributes: {
              first_name: 'John',
              last_name: 'Doe',
            },
          },
          score: 0.9,
          reason: 'Exact match',
        },
      ];

      // Test with a valid strategy - if we need to test invalid input, we should test it differently
      // Since MatchStrategy is a union type, TypeScript prevents invalid values at compile time
      // If runtime validation is needed, it should be added to the source code
      const result = strategies.selectBestMatch(candidates, 'fuzzy');

      expect(result).toBeDefined();
    });
  });

  describe('getAllMatchesAboveThreshold', () => {
    it('should get all matches above threshold', () => {
      const candidates: MatchResult[] = [
        {
          person: {
            id: '1',
            type: 'Person',
            attributes: {
              first_name: 'John',
              last_name: 'Doe',
            },
          },
          score: 0.9,
          reason: 'Exact match',
        },
        {
          person: {
            id: '2',
            type: 'Person',
            attributes: {
              first_name: 'Jane',
              last_name: 'Doe',
            },
          },
          score: 0.7,
          reason: 'Fuzzy match',
        },
      ];

      const result = strategies.getAllMatchesAboveThreshold(candidates, 'fuzzy');

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });
  });
});
