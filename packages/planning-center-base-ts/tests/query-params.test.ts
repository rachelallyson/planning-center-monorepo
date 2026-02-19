import { buildQueryParams } from '../src/query-params';

/** Call buildQueryParams with an object that may not match QueryOptions (tests passthrough/wrong types). */
function buildQueryParamsForTest(opts: object): ReturnType<typeof buildQueryParams> {
  /* eslint-disable-next-line no-restricted-syntax -- test: intentional wrong or partial type */
  return buildQueryParams(opts as Parameters<typeof buildQueryParams>[0]);
}

describe('buildQueryParams', () => {
  it('returns empty object when params is undefined', () => {
    expect(buildQueryParams()).toEqual({});
  });

  it('returns empty object when params is empty object', () => {
    expect(buildQueryParams({})).toEqual({});
  });

  it('adds where clauses as where[key]', () => {
    expect(buildQueryParams({ where: { name: 'test', id: 5 } })).toEqual({
      'where[name]': 'test',
      'where[id]': 5,
    });
  });

  it('omits undefined and null where values', () => {
    expect(buildQueryParams({ where: { a: undefined, b: null, c: 'x' } })).toEqual({
      'where[c]': 'x',
    });
  });

  it('includes boolean where values', () => {
    expect(buildQueryParams({ where: { active: true } })).toEqual({
      'where[active]': true,
    });
  });

  it('omits array where values (not serialized as scalar)', () => {
    expect(buildQueryParams({ where: { ids: ['a', 'b'] } })).toEqual({});
  });

  it('joins include array with comma', () => {
    expect(buildQueryParams({ include: ['households', 'emails'] })).toEqual({
      include: 'households,emails',
    });
  });

  it('omits include when empty array', () => {
    expect(buildQueryParams({ include: [] })).toEqual({});
  });

  it('omits include when undefined', () => {
    expect(buildQueryParams({ per_page: 10 })).not.toHaveProperty('include');
  });

  it('sets per_page', () => {
    expect(buildQueryParams({ per_page: 50 })).toEqual({ per_page: 50 });
  });

  it('sets page and offset from page number', () => {
    expect(buildQueryParams({ page: 1, per_page: 25 })).toEqual({
      per_page: 25,
      offset: 0,
      page: 1,
    });
    expect(buildQueryParams({ page: 2, per_page: 10 })).toEqual({
      per_page: 10,
      offset: 10,
      page: 2,
    });
  });

  it('computes offset from page using default per_page 25 when per_page not given', () => {
    const out = buildQueryParams({ page: 2 });
    expect(out.offset).toBe(25);
    expect(out.page).toBe(2);
    expect(out.per_page).toBeUndefined();
  });

  it('sets order', () => {
    expect(buildQueryParams({ order: '-created_at' })).toEqual({
      order: '-created_at',
    });
  });

  it('omits order when undefined', () => {
    expect(buildQueryParams({})).not.toHaveProperty('order');
  });

  it('adds filter array as boolean params', () => {
    expect(buildQueryParams({ filter: ['active', 'has_email'] })).toEqual({
      active: true,
      has_email: true,
    });
  });

  it('ignores non-string filter entries', () => {
    expect(buildQueryParamsForTest({ filter: ['a', 1, 'b'] })).toEqual({ a: true, b: true });
  });

  it('passthrough: adds primitive top-level keys not in known set', () => {
    expect(buildQueryParamsForTest({ custom_key: 'value', another: 42 })).toEqual({
      custom_key: 'value',
      another: 42,
    });
  });

  it('passthrough: omits undefined values', () => {
    expect(buildQueryParamsForTest({ custom_key: undefined })).toEqual({});
  });

  it('combines where, include, per_page, page, order, filter, and passthrough', () => {
    const out = buildQueryParamsForTest({
      where: { active: true },
      include: ['households'],
      per_page: 10,
      page: 2,
      order: 'name',
      filter: ['verified'],
      extra: 'yes',
    });
    expect(out).toEqual({
      'where[active]': true,
      include: 'households',
      per_page: 10,
      offset: 10,
      page: 2,
      order: 'name',
      verified: true,
      extra: 'yes',
    });
  });
});
