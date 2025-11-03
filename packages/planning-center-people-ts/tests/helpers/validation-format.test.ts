import { validatePersonData, formatDate, formatPersonName } from '../../src/helpers';

describe('helpers: validation and formatting', () => {
  it('validatePersonData flags invalid email, phone, and birthdate', () => {
    const result = validatePersonData({ email: 'bad@@', phone: 'abc', birthdate: 'not-a-date' } as any);
    expect(result.isValid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining(['Invalid email format', 'Invalid phone format', 'Invalid birthdate format']));
  });

  it('validatePersonData passes valid inputs', () => {
    const result = validatePersonData({ email: 'good@example.com', phone: '+15551234567', birthdate: '2000-01-01' } as any);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('formatDate returns iso and invalid date correctly', () => {
    expect(formatDate('2001-02-03T10:00:00.000Z', 'iso')).toBe('2001-02-03');
    expect(formatDate('not-a-date' as any)).toBe('Invalid Date');
  });

  it('formatPersonName builds from nickname, first, last', () => {
    expect(formatPersonName({ nickname: 'Ace', last_name: 'Smith' } as any)).toBe('Ace Smith');
    expect(formatPersonName({ first_name: 'Ada' } as any)).toBe('Ada');
    expect(formatPersonName({ last_name: 'Lovelace' } as any)).toBe('Lovelace');
    expect(formatPersonName({} as any)).toBe('Unknown');
  });
});
