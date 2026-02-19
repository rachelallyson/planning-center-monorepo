import { PersonMatcher } from '../../src/matching/matcher';
import type { PersonMatcherDeps } from '../../src/modules/people';
import type { PersonResource, PersonAttributes } from '../../src/types';

function isPersonResource(o: object): o is PersonResource {
  const id = Object.getOwnPropertyDescriptor(o, 'id')?.value;
  const type = Object.getOwnPropertyDescriptor(o, 'type')?.value;
  return typeof id === 'string' && type === 'Person';
}

const makePerson = (id: string, attrs: Partial<PersonAttributes> = {}): PersonResource => {
  const obj = { id, type: 'Person', ...attrs };
  if (!isPersonResource(obj)) throw new Error('Invalid person shape');
  return obj;
};

const peopleModule: jest.Mocked<PersonMatcherDeps> = {
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
      first_name: 'John',
      last_name: 'Doe',
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
      first_name: 'Jane',
      last_name: 'Doe',
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
      matcher.findOrCreate({ first_name: 'No', last_name: 'Match', createIfNotFound: false })
    ).rejects.toThrow('No matching person found and creation is disabled');
  });

  it('isMatch returns a match when score exceeds threshold', async () => {
    const person = makePerson('p3', { first_name: 'John', last_name: 'Smith' });
    peopleModule.getById.mockResolvedValue(person);

    const result = await matcher.isMatch('p3', { first_name: 'John', last_name: 'Smith' });

    expect(result?.person?.id).toBe('p3');
    expect((result?.score ?? 0)).toBeGreaterThan(0.5);
  });
});
