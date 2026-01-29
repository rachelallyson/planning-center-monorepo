import { PersonMatcher } from '../../src/matching/matcher';
import type { PeopleModule } from '../../src/modules/people';
import type { FlattenedPersonResource, PersonResource, PersonAttributes } from '../../src/types';

const makePerson = (id: string, attrs: Partial<PersonAttributes> = {}): FlattenedPersonResource => {
  return {
    id,
    type: 'Person',
    ...attrs,
  } as FlattenedPersonResource;
};

const makePersonResource = (id: string, attrs: Partial<PersonAttributes> = {}): PersonResource => {
  return {
    id,
    type: 'Person',
    attributes: attrs as PersonAttributes,
    relationships: {},
  };
};

const peopleModule: jest.Mocked<Pick<PeopleModule, 'search' | 'getEmails' | 'getPhoneNumbers' | 'create' | 'addEmail' | 'addPhoneNumber' | 'setPrimaryCampus' | 'getById'>> = {
  search: jest.fn(),
  getEmails: jest.fn(),
  getPhoneNumbers: jest.fn(),
  create: jest.fn(),
  addEmail: jest.fn(),
  addPhoneNumber: jest.fn(),
  setPrimaryCampus: jest.fn(),
  getById: jest.fn(),
};

describe('PersonMatcher branches', () => {
  let matcher: PersonMatcher;

  beforeEach(() => {
    jest.clearAllMocks();
    matcher = new PersonMatcher(peopleModule);
  });

  it('findMatch returns verified email match and respects exact strategy', async () => {
    const candidate = makePerson('p1', { first_name: 'John', last_name: 'Doe' });

    peopleModule.search
      .mockResolvedValueOnce({ data: [candidate] }) // email search
      .mockResolvedValue({ data: [] }); // name search fallback

    peopleModule.getEmails.mockResolvedValue({
      data: [{ 
        id: 'e1', 
        type: 'Email', 
        address: 'test@example.com',
        location: 'Home',
        primary: true,
      }],
    });
    peopleModule.getPhoneNumbers.mockResolvedValue({ data: [] });

    const exact = await matcher.findMatch({
      email: 'test@example.com',
      matchStrategy: 'exact',
      firstName: 'John',
      lastName: 'Doe',
    });

    expect(exact?.person?.id).toBe('p1');
    expect(exact?.isVerifiedContactMatch).toBe(true);
  });

  it('findOrCreate adds missing email when phone verified and addMissingContactInfo=true', async () => {
    const candidate = makePerson('p2', { first_name: 'Jane', last_name: 'Doe' });

    // phone search succeeds -> candidate
    peopleModule.search
      .mockResolvedValueOnce({ data: [candidate] }) // phone search
      .mockResolvedValue({ data: [] }); // name fallback

    // email missing so it should add
    peopleModule.getEmails.mockResolvedValue({ data: [] });

    // phone verified
    peopleModule.getPhoneNumbers.mockResolvedValue({
      data: [{ 
        id: 'p1', 
        type: 'PhoneNumber', 
        number: '+1 (555) 000-1111',
        location: 'Home',
        primary: true,
      }],
    });

    // Should not create since a match is found
    peopleModule.getById.mockResolvedValue(candidate);

    const result = await matcher.findOrCreate({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '555-000-1111',
      addMissingContactInfo: true,
      matchStrategy: 'fuzzy',
    });

    expect(result?.id).toBe('p2');
    expect(peopleModule.addEmail).toHaveBeenCalledWith('p2', expect.objectContaining({ address: 'jane@example.com' }));
  });

  it('findOrCreate throws when no match and createIfNotFound=false', async () => {
    peopleModule.search.mockResolvedValue({ data: [] });
    peopleModule.getEmails.mockResolvedValue({ data: [] });
    peopleModule.getPhoneNumbers.mockResolvedValue({ data: [] });

    await expect(
      matcher.findOrCreate({ firstName: 'No', lastName: 'Match', createIfNotFound: false })
    ).rejects.toThrow('No matching person found and creation is disabled');
  });

  it('isMatch returns a match when score exceeds threshold', async () => {
    const person = makePerson('p3', { first_name: 'John', last_name: 'Smith' });
    peopleModule.getById.mockResolvedValue(person);

    const result = await matcher.isMatch('p3', { firstName: 'John', lastName: 'Smith' });

    expect(result?.person?.id).toBe('p3');
    expect((result?.score ?? 0)).toBeGreaterThan(0.5);
  });
});
