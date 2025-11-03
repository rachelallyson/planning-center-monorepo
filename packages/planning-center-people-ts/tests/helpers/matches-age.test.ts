import { matchesAgeCriteria, calculateBirthYearFromAge, isValidEmail, isValidPhone, extractFileUrl, isFileUrl, getFileExtension, getFilename, processFileValue } from '../../src/helpers';

describe('helpers: age and file utilities', () => {
  it('matchesAgeCriteria handles adults, children, any and ranges', () => {
    const adultBirth = new Date();
    adultBirth.setFullYear(adultBirth.getFullYear() - 30);

    const childBirth = new Date();
    childBirth.setFullYear(childBirth.getFullYear() - 10);

    expect(matchesAgeCriteria(adultBirth.toISOString(), { agePreference: 'adults' })).toBe(true);
    expect(matchesAgeCriteria(childBirth.toISOString(), { agePreference: 'adults' })).toBe(false);
    expect(matchesAgeCriteria(childBirth.toISOString(), { agePreference: 'children' })).toBe(true);

    expect(matchesAgeCriteria(undefined, { agePreference: 'any' })).toBe(true);
    expect(matchesAgeCriteria(undefined, {} as any)).toBe(true);

    expect(matchesAgeCriteria(adultBirth.toISOString(), { minAge: 20, maxAge: 40 })).toBe(true);
    expect(matchesAgeCriteria(adultBirth.toISOString(), { minAge: 40, maxAge: 50 })).toBe(false);

    const birthYear = new Date(adultBirth.toISOString()).getFullYear();
    expect(matchesAgeCriteria(adultBirth.toISOString(), { birthYear })).toBe(true);
    expect(matchesAgeCriteria(adultBirth.toISOString(), { birthYear: birthYear - 1 })).toBe(false);
  });

  it('calculateBirthYearFromAge returns currentYear - age', () => {
    const currentYear = new Date().getFullYear();
    expect(calculateBirthYearFromAge(10)).toBe(currentYear - 10);
  });

  it('validates email and phone', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('bad@@example')).toBe(false);

    expect(isValidPhone('+15551234567')).toBe(true);
    expect(isValidPhone('abc')).toBe(false);
  });

  it('file URL utilities extract and detect', () => {
    const html = '<a href="https://onark.s3.us-east-1.amazonaws.com/file.pdf" download>View</a>';
    expect(extractFileUrl(html)).toBe('https://onark.s3.us-east-1.amazonaws.com/file.pdf');
    expect(isFileUrl(html)).toBe(true);
    expect(getFileExtension(html)).toBe('pdf');
    expect(getFilename(html)).toBe('file.pdf');

    const processed = processFileValue(html, 'file') as any;
    expect(processed.filename).toBe('file.pdf');
    expect(processed.contentType).toBe('application/pdf');
  });
});
