/**
 * Type utilities for flattened resource structures
 * 
 * These types transform JSON:API ResourceObject structures into flattened forms
 * where attributes and relationships are at the top level.
 */

import type { ResourceObject, ResourceIdentifier, Relationship } from './json-api';

/**
 * Flatten a single resource object type
 * 
 * Transforms ResourceObject<TType, TAttrs, TRelMap> into a flat structure where:
 * - Attributes are at the top level
 * - Relationships are at the top level (as arrays or single objects)
 * - Relationships are typed as the actual resource types, not Relationship wrappers
 * - type, id, links, meta are preserved
 * 
 * @template TRelResourceMap - Optional mapping of relationship keys to their resource types
 *   If provided, relationships will be typed as the specific resource types.
 *   If not provided, relationships will be typed as FlattenedResource<any> or ResourceIdentifier.
 * 
 * @example
 * ```typescript
 * // With mapping:
 * type PersonWithRelationships = FlattenedResource<
 *   'Person',
 *   PersonAttributes,
 *   PersonRelationships,
 *   { emails: EmailResource; phone_numbers: PhoneNumberResource[]; household: HouseholdResource }
 * >;
 * // Result: { emails?: EmailResource[]; phone_numbers?: PhoneNumberResource[]; household?: HouseholdResource }
 * ```
 */
/** Lookup type: get the relationship map for a resource type when building nested FlattenedResource */
type NestedRelMap<TResourceTypeToRelMap extends Record<string, object>, TType extends string> =
    TType extends keyof TResourceTypeToRelMap ? TResourceTypeToRelMap[TType] : Record<string, never>;

export type FlattenedResource<
    TType extends string = string,
    TAttrs extends Record<string, any> = Record<string, any>,
    TRelMap extends Record<string, any> = Record<string, any>,
    TRelResourceMap extends object = Record<string, never>,
    TResourceTypeToRelMap extends Record<string, object> = Record<string, never>
> = {
    type: TType;
    id: string;
} & TAttrs & {
    // Flatten relationships - convert Relationship objects to their data directly
    // When TRelResourceMap is provided, use it first (so generic Relationship with data?: Identifier|Identifier[]|null still gets specific types)
    // Use NonNullable so optional relationships (Relationship | undefined) are handled
    [K in keyof TRelMap]?: NonNullable<TRelMap[K]> extends Relationship
        ? K extends keyof TRelResourceMap
            ? TRelResourceMap[K] extends ResourceObject<string, any, any>[]
                ? FlattenedResource<
                    TRelResourceMap[K][number]['type'],
                    TRelResourceMap[K][number] extends ResourceObject<string, infer A, any> ? A : never,
                    TRelResourceMap[K][number] extends ResourceObject<any, any, infer R> ? (R extends Record<string, any> ? R : Record<string, any>) : never,
                    NestedRelMap<TResourceTypeToRelMap, TRelResourceMap[K][number]['type']>,
                    TResourceTypeToRelMap
                >[]
                : TRelResourceMap[K] extends ResourceObject<string, any, any>
                    ? FlattenedResource<
                        TRelResourceMap[K]['type'],
                        TRelResourceMap[K] extends ResourceObject<string, infer A, any> ? A : never,
                        TRelResourceMap[K] extends ResourceObject<any, any, infer R> ? (R extends Record<string, any> ? R : Record<string, any>) : never,
                        NestedRelMap<TResourceTypeToRelMap, TRelResourceMap[K]['type']>,
                        TResourceTypeToRelMap
                    > | null
                    : NonNullable<TRelMap[K]>['data'] extends ResourceIdentifier[]
                        ? (FlattenedResource<string, any, any> | ResourceIdentifier)[]
                        : NonNullable<TRelMap[K]>['data'] extends ResourceIdentifier
                            ? FlattenedResource<string, any, any> | ResourceIdentifier | null
                            : (FlattenedResource<string, any, any> | ResourceIdentifier)[] | (FlattenedResource<string, any, any> | ResourceIdentifier | null)
            : NonNullable<TRelMap[K]>['data'] extends ResourceIdentifier[]
                ? (FlattenedResource<string, any, any> | ResourceIdentifier)[]
                : NonNullable<TRelMap[K]>['data'] extends ResourceIdentifier
                    ? FlattenedResource<string, any, any> | ResourceIdentifier | null
                    : (FlattenedResource<string, any, any> | ResourceIdentifier)[] | (FlattenedResource<string, any, any> | ResourceIdentifier | null)
        : TRelMap[K];
} & {
    links?: Record<string, any>;
    meta?: Record<string, any>;
};

/**
 * Helper type to flatten an array of resources
 */
export type FlattenedResourceArray<T extends ResourceObject<string, any, any>> = FlattenedResource<
    T['type'],
    T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
    T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
>[];
