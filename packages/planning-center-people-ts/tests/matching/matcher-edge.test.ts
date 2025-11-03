import { PersonMatcher } from '../../src/matching/matcher';
import { MatchScorer } from '../../src/matching/scoring';
import type { PeopleModule } from '../../src/modules/people';

function mkPerson(id: string, attrs: any = {}) {
  return { id, type: 'Person', attributes: attrs } as any;
}

describe('PersonMatcher edge cases', () => {
  let people: jest.Mocked<PeopleModule>;

  beforeEach(() => {
    people = {
      search: jest.fn(),
      getById: jest.fn(),
      getEmails: jest.fn(),
      getPhoneNumbers: jest.fn(),
      addEmail: jest.fn(),
      addPhoneNumber: jest.fn(),
      create: jest.fn(),
      setPrimaryCampus: jest.fn(),
    } as unknown as jest.Mocked<PeopleModule>;
  });

  it('returns null for exact strategy when no verified contact match', async () => {
    const matcher = new PersonMatcher(people as any);
    people.search.mockResolvedValueOnce({ data: [mkPerson('1')] } as any);
    // No emails/phones verified
    people.getEmails.mockResolvedValue({ data: [] } as any);
    people.getPhoneNumbers.mockResolvedValue({ data: [] } as any);

    const res = await matcher.findMatch({ matchStrategy: 'exact', email: 'a@b.com' });
    expect(res).toBeNull();
  });

  it('prefers verified contact matches over name-only matches', async () => {
    const matcher = new PersonMatcher(people as any);
    // Email search finds two candidates
    people.search
      .mockResolvedValueOnce({ data: [mkPerson('1'), mkPerson('2')] } as any) // email search
      .mockResolvedValueOnce({ data: [mkPerson('3')] } as any); // name search

    // Verify only person 2 matches by email
    people.getEmails.mockImplementation(async (id: any) =>
      id === '2' ? ({ data: [{ attributes: { address: 'x@y.com' } }] } as any) : ({ data: [] } as any)
    );

    const res = await matcher.findMatch({ email: 'x@y.com', firstName: 'A', lastName: 'B', matchStrategy: 'fuzzy' });
    expect(res?.person.id).toBe('2');
    expect(res?.isVerifiedContactMatch).toBe(true);
  });

  it('filters by age preferences and returns null if none match', async () => {
    const matcher = new PersonMatcher(people as any);
    people.search.mockResolvedValue({ data: [mkPerson('1', { birthdate: '2015-01-01' })] } as any);
    // Verified by skipping contact verification (no email/phone provided)
    const res = await matcher.findMatch({ agePreference: 'adults' });
    expect(res).toBeNull();
  });
});



