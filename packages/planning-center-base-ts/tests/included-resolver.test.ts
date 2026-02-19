import {
  resolveIncluded,
  flattenResource,
  mapIncludedToRelationships,
} from '../src/included-resolver';

function toObjectOrUndefined(value: object | string | number | boolean | null | undefined): object | undefined {
  return typeof value === 'object' && value !== null ? value : undefined;
}

function getDataFromRel(rel: object | undefined): object | undefined {
  if (!rel || typeof rel !== 'object') return undefined;
  const value = Object.getOwnPropertyDescriptor(rel, 'data')?.value;
  return toObjectOrUndefined(value);
}

function getRelationshipData(resource: { relationships?: object }, key: string): object | undefined {
  const rels = resource.relationships;
  if (!rels || typeof rels !== 'object') return undefined;
  const rel = toObjectOrUndefined(Object.getOwnPropertyDescriptor(rels, key)?.value);
  return rel !== undefined ? getDataFromRel(rel) : undefined;
}

describe('resolveIncluded', () => {
  it('returns data unchanged when included is empty', () => {
    const data = [{ id: '1', type: 'people', attributes: { first_name: 'Jane' } }];
    expect(resolveIncluded(data, undefined)).toEqual(data);
    expect(resolveIncluded(data, [])).toEqual(data);
  });

  it('inlines relationship data from included when relationship is identifier', () => {
    const person = {
      id: '1',
      type: 'people',
      attributes: { first_name: 'Jane' },
      relationships: {
        household: { data: { type: 'households', id: '10' } },
      },
    };
    const household = {
      id: '10',
      type: 'households',
      attributes: { name: 'Smith' },
    };
    const resolved = resolveIncluded([person], [household]);
    expect(resolved).toHaveLength(1);
    const first = resolved[0];
    expect(first).toBeDefined();
    expect(getRelationshipData(first!, 'household')).toEqual(household);
  });

  it('keeps identifier when not found in included', () => {
    const person = {
      id: '1',
      type: 'people',
      relationships: { household: { data: { type: 'households', id: '99' } } },
    };
    const resolved = resolveIncluded([person], []);
    const first = resolved[0];
    expect(first).toBeDefined();
    expect(getRelationshipData(first!, 'household')).toEqual({ type: 'households', id: '99' });
  });
});

describe('flattenResource', () => {
  it('flattens attributes and type/id to top level', () => {
    const resource = {
      id: '1',
      type: 'people',
      attributes: { first_name: 'Jane', last_name: 'Doe' },
    };
    const flat = flattenResource(resource);
    expect(flat.type).toBe('people');
    expect(flat.id).toBe('1');
    expect(flat.first_name).toBe('Jane');
    expect(flat.last_name).toBe('Doe');
  });

  it('includes relationships as top-level keys', () => {
    const resource = {
      id: '1',
      type: 'people',
      attributes: {},
      relationships: {
        household: { data: { type: 'households', id: '10' } },
      },
    };
    const flat = flattenResource(resource);
    expect(flat.household).toEqual({ type: 'households', id: '10' });
  });

  it('includes links and meta when present', () => {
    const resource = {
      id: '1',
      type: 'people',
      attributes: {},
      links: { self: 'https://example.com/people/1' },
      meta: { count: 1 },
    };
    const flat = flattenResource(resource);
    expect(flat.links).toEqual({ self: 'https://example.com/people/1' });
    expect(flat.meta).toEqual({ count: 1 });
  });
});

describe('mapIncludedToRelationships', () => {
  it('resolves and flattens in one step', () => {
    const person = {
      id: '1',
      type: 'people',
      attributes: { first_name: 'Jane' },
      relationships: { household: { data: { type: 'households', id: '10' } } },
    };
    const household = {
      id: '10',
      type: 'households',
      attributes: { name: 'Smith' },
    };
    const result = mapIncludedToRelationships([person], [household]);
    expect(result).toHaveLength(1);
    const first = result[0];
    expect(first).toBeDefined();
    expect(first!.type).toBe('people');
    expect(first!.id).toBe('1');
    expect(first!.first_name).toBe('Jane');
    expect(first && 'household' in first && first.household).toMatchObject({ id: '10', type: 'households', name: 'Smith' });
  });

  it('returns empty array when data is empty', () => {
    expect(mapIncludedToRelationships([], [])).toEqual([]);
  });
});
