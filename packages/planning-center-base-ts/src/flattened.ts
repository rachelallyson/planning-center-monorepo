/**
 * Flattened resource types: attributes and relationships at top level.
 * Packages define FlattenedResource<Type, Attrs, Rels> per resource for strict return types.
 */

import type { ResourceObject, Links, Meta } from './json-api';

/** Resource with attributes and relationship outputs at top level (no nested attributes/relationships). */
export type FlattenedResource<
  TType extends string = string,
  TAttrs extends object = Record<string, object>,
  TRelOutputs extends object = Record<string, object>,
> = {
  type: TType;
  id: string;
  links?: Links;
  meta?: Meta;
} & TAttrs &
  TRelOutputs;

/** Extract attributes type from a ResourceObject. */
export type AttrsOf<R> = R extends ResourceObject<string, infer A, object> ? A : never;
/** Extract relationships type from a ResourceObject. */
export type RelMapOf<R> = R extends ResourceObject<string, object, infer RMap> ? RMap : never;

/** Runtime shape of a flattened resource (used when no generic TOut is provided). */
export type FlattenedResourceResult = Record<
  string,
  object | string | number | null | boolean | object[]
> & { type: string; id: string; attributes: never; relationships: never; included: never };

/** Infer flattened type from a ResourceObject (for use when caller does not pass explicit TOut). */
export type DefaultFlattenedFor<
  Resource extends ResourceObject<string, object, object>,
> = FlattenedResource<Resource['type'], AttrsOf<Resource>, Record<string, object>>;

/**
 * View a flattened result as a package's refined type (e.g. PersonResource).
 * Use only at the package boundary; runtime shape is FlattenedResourceResult.
 */
export function asFlattened<T>(result: FlattenedResourceResult): T {
  /* eslint-disable-next-line no-restricted-syntax -- single boundary: FlattenedResourceResult to caller's T */
  return result as T;
}

/** Same as asFlattened for arrays (e.g. getList/getAllPages). */
export function asFlattenedArray<T>(results: FlattenedResourceResult[]): T[] {
  /* eslint-disable-next-line no-restricted-syntax -- single boundary: FlattenedResourceResult[] to caller's T[] */
  return results as T[];
}
