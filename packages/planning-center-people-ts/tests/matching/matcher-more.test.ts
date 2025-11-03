import { PersonMatcher } from '../../src/matching/matcher';
import { PeopleModule } from '../../src/modules/people';

const makePerson = (id: string, attrs: any = {}) => ({ id, type: 'Person', attributes: attrs }) as any;

const pm = {
  search: jest.fn(),
  getEmails: jest.fn(),
  getPhoneNumbers: jest.fn(),
  create: jest.fn(),
  addEmail: jest.fn(),
  addPhoneNumber: jest.fn(),
  setPrimaryCampus: jest.fn(),
  getById: jest.fn(),
} as unknown as PeopleModule;

describe('PersonMatcher additional coverage', () => {
  let matcher: PersonMatcher;

  beforeEach(() => {
    jest.clearAllMocks();
    matcher = new PersonMatcher(pm);
  });

  it('findMatch with name-only search when no contact info', async () => {
    const p1 = makePerson('n1', { first_name: 'Anna', last_name: 'Lee' });
    const p2 = makePerson('n2', { first_name: 'Anna', last_name: 'Li' });
    (pm.search as any).mockResolvedValueOnce({ data: [p1, p2] });

    const result = await matcher.findMatch({ firstName: 'Anna', lastName: 'Lee' } as any);

    expect(result?.person?.id).toBeDefined();
  });

  it('de-duplicates candidates from multiple searches', async () => {
    const dup = makePerson('d1', { first_name: 'Dup', last_name: 'User' });
    (pm.search as any)
      .mockResolvedValueOnce({ data: [dup, dup] }) // email search returns dup twice
      .mockResolvedValue({ data: [] }); // name fallback
    (pm.getEmails as any).mockResolvedValue({ data: [{ attributes: { address: 'dup@example.com' } }] });

    const result = await matcher.findMatch({ email: 'dup@example.com' } as any);
    expect(result?.person?.id).toBe('d1');
  });

  it('filters out candidates not matching age criteria', async () => {
    const tooYoung = makePerson('y1', { birthdate: new Date(new Date().setFullYear(new Date().getFullYear() - 10)).toISOString() });
    (pm.search as any).mockResolvedValueOnce({ data: [tooYoung] });
    (pm.getEmails as any).mockResolvedValue({ data: [] });
    (pm.getPhoneNumbers as any).mockResolvedValue({ data: [] });

    const result = await matcher.findMatch({ firstName: 'Kid', lastName: 'User', minAge: 18 } as any);
    expect(result).toBeNull();
  });

  it('addMissingContactInfo adds phone when verified email matches', async () => {
    const person = makePerson('c1', { first_name: 'Cara', last_name: 'One' });
    (pm.search as any).mockResolvedValueOnce({ data: [person] }); // email search
    (pm.getEmails as any).mockResolvedValue({ data: [{ attributes: { address: 'cara@x.com' } }] });
    (pm.getPhoneNumbers as any).mockResolvedValue({ data: [] });

    await matcher.findOrCreate({ email: 'cara@x.com', phone: '555-222-3333', addMissingContactInfo: true } as any);
    expect(pm.addPhoneNumber).toHaveBeenCalledWith('c1', expect.objectContaining({ number: '555-222-3333' }));
  });

  it('create path sets campus when campusId provided', async () => {
    (pm.search as any).mockResolvedValue({ data: [] });
    (pm.getEmails as any).mockResolvedValue({ data: [] });
    (pm.getPhoneNumbers as any).mockResolvedValue({ data: [] });

    const created = makePerson('new1', { first_name: 'New', last_name: 'User' });
    (pm.create as any).mockResolvedValue(created);

    await matcher.findOrCreate({ firstName: 'New', lastName: 'User', campusId: 'camp-123' } as any);

    expect(pm.setPrimaryCampus).toHaveBeenCalledWith('new1', 'camp-123');
  });

  it('getAllMatches sorts verified contact matches first', async () => {
    const p1 = makePerson('m1', {});
    const p2 = makePerson('m2', {});

    (pm.search as any)
      .mockResolvedValueOnce({ data: [p1, p2] }) // email search
      .mockResolvedValue({ data: [] }); // name fallback

    // p1 has matching email, p2 does not
    (pm.getEmails as any)
      .mockResolvedValueOnce({ data: [{ attributes: { address: 'v@x.com' } }] })
      .mockResolvedValue({ data: [] });

    const results = await matcher.getAllMatches({ email: 'v@x.com' } as any);
    expect(results[0].person.id).toBe('m1');
    expect(results[0].isVerifiedContactMatch).toBe(true);
  });
});
