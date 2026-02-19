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

const makePersonResource = (id: string, attrs: Partial<PersonAttributes> = {}): PersonResource => {
  const obj = { id, type: 'Person', ...attrs };
  if (!isPersonResource(obj)) throw new Error('Invalid person shape');
  return obj;
};

const pm: jest.Mocked<PersonMatcherDeps> = {
  search: jest.fn(),
  getEmails: jest.fn(),
  getPhoneNumbers: jest.fn(),
  create: jest.fn(),
  addEmail: jest.fn(),
  addPhoneNumber: jest.fn(),
  setPrimaryCampus: jest.fn(),
  getById: jest.fn(),
};

describe('PersonMatcher additional coverage', () => {
  let matcher: PersonMatcher;

  beforeEach(() => {
    jest.clearAllMocks();
    matcher = new PersonMatcher(pm);
  });

  it('findMatch with name-only search when no contact info', async () => {
    const p1 = makePerson('n1', { first_name: 'Anna', last_name: 'Lee' });
    const p2 = makePerson('n2', { first_name: 'Anna', last_name: 'Li' });
    pm.search.mockResolvedValueOnce({ data: [p1, p2] });
    pm.getEmails.mockResolvedValue({ data: [] });
    pm.getPhoneNumbers.mockResolvedValue({ data: [] });

    const result = await matcher.findMatch({ first_name: 'Anna', last_name: 'Lee' });

    expect(result?.person?.id).toBeDefined();
  });

  it('de-duplicates candidates from multiple searches', async () => {
    const dup = makePerson('d1', { first_name: 'Dup', last_name: 'User' });
    pm.search
      .mockResolvedValueOnce({ data: [dup, dup] }) // email search returns dup twice
      .mockResolvedValue({ data: [] }); // name fallback
    pm.getEmails.mockResolvedValue({
      data: [{
        id: 'e1',
        type: 'Email',
        address: 'dup@example.com',
        location: 'Home',
        primary: true,
      }]
    });
    pm.getPhoneNumbers.mockResolvedValue({ data: [] });

    const result = await matcher.findMatch({ email: 'dup@example.com' });
    expect(result?.person?.id).toBe('d1');
  });

  it('filters out candidates not matching age criteria', async () => {
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    const tooYoung = makePerson('y1', { birthdate: tenYearsAgo.toISOString().split('T')[0] });
    pm.search.mockResolvedValueOnce({ data: [tooYoung] });
    pm.getEmails.mockResolvedValue({ data: [] });
    pm.getPhoneNumbers.mockResolvedValue({ data: [] });

    const result = await matcher.findMatch({ first_name: 'Kid', last_name: 'User', minAge: 18 });
    expect(result).toBeNull();
  });

  it('addMissingContactInfo adds phone when verified email matches', async () => {
    const person = makePerson('c1', { first_name: 'Cara', last_name: 'One' });
    pm.search.mockResolvedValueOnce({ data: [person] }); // email search
    pm.getEmails.mockResolvedValue({
      data: [{
        id: 'e1',
        type: 'Email',
        address: 'cara@x.com',
        location: 'Home',
        primary: true,
      }]
    });
    pm.getPhoneNumbers.mockResolvedValue({ data: [] });
    pm.getById.mockResolvedValue(person);

    await matcher.findOrCreate({ email: 'cara@x.com', phone: '555-222-3333', addMissingContactInfo: true });
    expect(pm.addPhoneNumber).toHaveBeenCalledWith('c1', expect.objectContaining({ number: '555-222-3333' }));
  });

  it('create path sets campus when campusId provided', async () => {
    pm.search.mockResolvedValue({ data: [] });
    pm.getEmails.mockResolvedValue({ data: [] });
    pm.getPhoneNumbers.mockResolvedValue({ data: [] });

    const created = makePersonResource('new1', { first_name: 'New', last_name: 'User' });
    pm.create.mockResolvedValue({ data: created });
    pm.getById.mockResolvedValue(makePerson('new1', { first_name: 'New', last_name: 'User' }));

    await matcher.findOrCreate({ first_name: 'New', last_name: 'User', campusId: 'camp-123' });

    expect(pm.setPrimaryCampus).toHaveBeenCalledWith('new1', 'camp-123');
  });

  it('getAllMatches sorts verified contact matches first', async () => {
    const p1 = makePerson('m1', {});
    const p2 = makePerson('m2', {});

    pm.search
      .mockResolvedValueOnce({ data: [p1, p2] }) // email search
      .mockResolvedValue({ data: [] }); // name fallback

    // p1 has matching email, p2 does not
    pm.getEmails
      .mockResolvedValueOnce({
        data: [{
          id: 'e1',
          type: 'Email',
          address: 'v@x.com',
          location: 'Home',
          primary: true,
        }]
      })
      .mockResolvedValue({ data: [] });
    pm.getPhoneNumbers.mockResolvedValue({ data: [] });

    const results = await matcher.getAllMatches({ email: 'v@x.com' });
    expect(results[0]?.person.id).toBe('m1');
    expect(results[0]?.isVerifiedContactMatch).toBe(true);
  });
});
