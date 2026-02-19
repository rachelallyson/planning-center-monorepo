import {
  isRecord,
  ensureRecord,
  isErrorArray,
  getOptionalString,
  getRequestUrl,
  setAt,
  hasDataArray,
  isResourceLike,
  isTopLevelLinks,
  type JsonOrUndefined,
} from '../src/typed';

describe('isRecord', () => {
  it('returns true for plain object', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('returns false for null and undefined', () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });

  it('returns false for array', () => {
    expect(isRecord([])).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isRecord('x')).toBe(false);
    expect(isRecord(1)).toBe(false);
    expect(isRecord(true)).toBe(false);
  });
});

describe('ensureRecord', () => {
  it('returns same object when it is a record', () => {
    const o = { a: 1 };
    expect(ensureRecord(o)).toBe(o);
  });

  it('throws when value is null', () => {
    expect(() => ensureRecord(null)).toThrow('Expected JSON object');
  });

  it('throws when value is undefined', () => {
    expect(() => ensureRecord(undefined)).toThrow('Expected JSON object');
  });

  it('throws when value is array', () => {
    expect(() => ensureRecord([])).toThrow('Expected JSON object');
  });
});

describe('isErrorArray', () => {
  it('returns true for array of objects', () => {
    expect(isErrorArray([{}])).toBe(true);
    expect(isErrorArray([{ title: 'x' }, { detail: 'y' }])).toBe(true);
  });

  it('returns false for empty array', () => {
    expect(isErrorArray([])).toBe(true);
  });

  it('returns false for non-array', () => {
    expect(isErrorArray({})).toBe(false);
    expect(isErrorArray(null)).toBe(false);
  });

  it('returns false when array contains non-object', () => {
    expect(isErrorArray([1])).toBe(false);
    expect(isErrorArray([null])).toBe(false);
  });
});

describe('getOptionalString', () => {
  it('returns string value when present', () => {
    expect(getOptionalString({ name: 'test' }, 'name')).toBe('test');
  });

  it('returns undefined when key missing', () => {
    expect(getOptionalString({}, 'name')).toBeUndefined();
  });

  it('returns undefined when value is not string', () => {
    expect(getOptionalString({ name: 123 }, 'name')).toBeUndefined();
    expect(getOptionalString({ name: null }, 'name')).toBeUndefined();
  });
});

describe('getRequestUrl', () => {
  it('returns string when input is string', () => {
    expect(getRequestUrl('https://api.example.com')).toBe('https://api.example.com');
  });

  it('returns url when input is URL', () => {
    expect(getRequestUrl(new URL('https://api.example.com/path'))).toBe('https://api.example.com/path');
  });

  it('returns url from object with url property', () => {
    expect(getRequestUrl({ url: 'https://example.com' })).toBe('https://example.com');
  });

  it('returns empty string when object has no url or non-string url', () => {
    expect(getRequestUrl({})).toBe('');
    expect(getRequestUrl({ url: 123 })).toBe('');
  });
});

describe('setAt', () => {
  it('sets key on record', () => {
    const r: Record<string, JsonOrUndefined> = {};
    setAt(r, 'a', 1);
    expect(r.a).toBe(1);
  });

  it('does nothing when record is null or undefined', () => {
    const r: Record<string, JsonOrUndefined> | null = null;
    setAt(r, 'a', 1);
    setAt(undefined, 'a', 1);
  });
});

describe('hasDataArray', () => {
  it('returns true when data is array', () => {
    expect(hasDataArray({ data: [] })).toBe(true);
    expect(hasDataArray({ data: [{ id: '1', type: 'x' }] })).toBe(true);
  });

  it('returns false when data is not array', () => {
    expect(hasDataArray({})).toBe(false);
    expect(hasDataArray({ data: null })).toBe(false);
    expect(hasDataArray({ data: {} })).toBe(false);
  });
});

describe('isResourceLike', () => {
  it('returns true for object with id and type strings', () => {
    expect(isResourceLike({ id: '1', type: 'people' })).toBe(true);
    expect(isResourceLike({ id: '1', type: 'people', attributes: {} })).toBe(true);
  });

  it('returns false when id or type missing', () => {
    expect(isResourceLike({ type: 'people' })).toBe(false);
    expect(isResourceLike({ id: '1' })).toBe(false);
  });

  it('returns false when id or type not string', () => {
    expect(isResourceLike({ id: 1, type: 'people' })).toBe(false);
    expect(isResourceLike({ id: '1', type: 123 })).toBe(false);
  });

  it('returns false for null, undefined, array, primitives', () => {
    expect(isResourceLike(null)).toBe(false);
    expect(isResourceLike(undefined)).toBe(false);
    expect(isResourceLike([])).toBe(false);
    expect(isResourceLike('x')).toBe(false);
  });
});

describe('isTopLevelLinks', () => {
  it('returns true for record (links object)', () => {
    expect(isTopLevelLinks({ self: 'x', next: 'y' })).toBe(true);
    expect(isTopLevelLinks({})).toBe(true);
  });

  it('returns false for non-object', () => {
    expect(isTopLevelLinks(null)).toBe(false);
    expect(isTopLevelLinks('x')).toBe(false);
  });
});
