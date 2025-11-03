import { PersonMatcher } from '../../src/matching/matcher';
import { PeopleModule } from '../../src/modules/people';

const makePerson = (id: string, attrs: any = {}) => ({ id, type: 'Person', attributes: attrs }) as any;

const peopleModule = {
  search: jest.fn(),
  getEmails: jest.fn(),
  getPhoneNumbers: jest.fn(),
  create: jest.fn(),
  addEmail: jest.fn(),
  addPhoneNumber: jest.fn(),
  setPrimaryCampus: jest.fn(),
  getById: jest.fn(),
} as unknown as PeopleModule;

describe('PersonMatcher branches', () => {
  let matcher: PersonMatcher;

  beforeEach(() => {
    jest.clearAllMocks();
    matcher = new PersonMatcher(peopleModule);
  });

  it('findMatch returns verified email match and respects exact strategy', async () => {
    const candidate = makePerson('p1', { first_name: 'John', last_name: 'Doe' });

    (peopleModule.search as any)
      .mockResolvedValueOnce({ data: [candidate] }) // email search
      .mockResolvedValue({ data: [] }); // name search fallback

    (peopleModule.getEmails as any).mockResolvedValue({
      data: [{ attributes: { address: 'test@example.com' } }],
    });
    (peopleModule.getPhoneNumbers as any).mockResolvedValue({ data: [] });

    const exact = await matcher.findMatch({
      email: 'test@example.com',
      matchStrategy: 'exact',
      firstName: 'John',
      lastName: 'Doe',
    } as any);

    expect(exact?.person?.id).toBe('p1');
    expect(exact?.isVerifiedContactMatch).toBe(true);
  });

  it('findOrCreate adds missing email when phone verified and addMissingContactInfo=true', async () => {
    const candidate = makePerson('p2', { first_name: 'Jane', last_name: 'Doe' });

    // phone search succeeds -> candidate
    (peopleModule.search as any)
      .mockResolvedValueOnce({ data: [candidate] }) // phone search
      .mockResolvedValue({ data: [] }); // name fallback

    // email missing so it should add
    (peopleModule.getEmails as any).mockResolvedValue({ data: [] });

    // phone verified
    (peopleModule.getPhoneNumbers as any).mockResolvedValue({
      data: [{ attributes: { number: '+1 (555) 000-1111' } }],
    });

    // Should not create since a match is found
    (peopleModule.create as any).mockResolvedValue(null);

    const result = await matcher.findOrCreate({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '555-000-1111',
      addMissingContactInfo: true,
      matchStrategy: 'fuzzy',
    } as any);

    expect(result?.id).toBe('p2');
    expect(peopleModule.addEmail).toHaveBeenCalledWith('p2', expect.objectContaining({ address: 'jane@example.com' }));
  });

  it('findOrCreate throws when no match and createIfNotFound=false', async () => {
    (peopleModule.search as any).mockResolvedValue({ data: [] });
    (peopleModule.getEmails as any).mockResolvedValue({ data: [] });
    (peopleModule.getPhoneNumbers as any).mockResolvedValue({ data: [] });

    await expect(
      matcher.findOrCreate({ firstName: 'No', lastName: 'Match', createIfNotFound: false } as any)
    ).rejects.toThrow('No matching person found and creation is disabled');
  });

  it('isMatch returns a match when score exceeds threshold', async () => {
    const person = makePerson('p3', { first_name: 'John', last_name: 'Smith' });
    (peopleModule.getById as any).mockResolvedValue(person);

    const result = await matcher.isMatch('p3', { firstName: 'John', lastName: 'Smith' } as any);

    expect(result?.person?.id).toBe('p3');
    expect((result?.score ?? 0)).toBeGreaterThan(0.5);
  });
});
