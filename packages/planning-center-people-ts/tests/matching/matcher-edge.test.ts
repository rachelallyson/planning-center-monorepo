import { PersonMatcher } from '../../src/matching/matcher';
import type { PeopleModule } from '../../src/modules/people';
import type { PersonAttributes, PersonResource } from '../../src/types';

function mkPerson(id: string, attrs: Partial<PersonAttributes> = {}): PersonResource {
  return {
    id,
    type: 'Person',
    ...attrs,
  };
}

describe('PersonMatcher edge cases', () => {
  let people: jest.Mocked<Pick<PeopleModule, 'search' | 'getById' | 'getEmails' | 'getPhoneNumbers' | 'addEmail' | 'addPhoneNumber' | 'create' | 'setPrimaryCampus'>>;

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
    };
  });

  it('returns null for exact strategy when no verified contact match', async () => {
    const matcher = new PersonMatcher(people);
    people.search.mockResolvedValueOnce({ data: [mkPerson('1')] });
    // No emails/phones verified
    people.getEmails.mockResolvedValue({ data: [] });
    people.getPhoneNumbers.mockResolvedValue({ data: [] });

    const res = await matcher.findMatch({ matchStrategy: 'exact', email: 'a@b.com' });
    expect(res).toBeNull();
  });

  it('prefers verified contact matches over name-only matches', async () => {
    const matcher = new PersonMatcher(people);
    // Email search finds two candidates
    people.search
      .mockResolvedValueOnce({ data: [mkPerson('1'), mkPerson('2')] }) // email search
      .mockResolvedValueOnce({ data: [mkPerson('3')] }); // name search

    // Verify only person 2 matches by email
    people.getEmails.mockImplementation(async (id: string) =>
      id === '2' ? ({
        data: [{
          id: 'e1',
          type: 'Email',
          address: 'x@y.com',
          location: 'Home',
          primary: true,
        }]
      }) : ({ data: [] })
    );
    people.getPhoneNumbers.mockResolvedValue({ data: [] });

    const res = await matcher.findMatch({ email: 'x@y.com', first_name: 'A', last_name: 'B', matchStrategy: 'fuzzy' });
    expect(res?.person.id).toBe('2');
    expect(res?.isVerifiedContactMatch).toBe(true);
  });

  it('filters by age preferences and returns null if none match', async () => {
    const matcher = new PersonMatcher(people);
    people.search.mockResolvedValue({ data: [mkPerson('1', { birthdate: '2015-01-01' })] });
    people.getEmails.mockResolvedValue({ data: [] });
    people.getPhoneNumbers.mockResolvedValue({ data: [] });
    // Verified by skipping contact verification (no email/phone provided)
    const res = await matcher.findMatch({ agePreference: 'adults' });
    expect(res).toBeNull();
  });
});



