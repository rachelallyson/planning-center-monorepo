/**
 * Type utilities for flattened resource structures
 * 
 * These types transform JSON:API ResourceObject structures into flattened forms
 * where attributes and relationships are at the top level.
 */

import type { ResourceObject, ResourceIdentifier, Relationship } from './json-api';

/**
 * Extract the resource type from a Relationship's data field
 */
type ExtractRelationshipResourceType<T> = T extends Relationship
    ? T['data'] extends ResourceIdentifier[]
        ? ResourceIdentifier[] // To-many: array of identifiers (will be resolved to full resources)
        : T['data'] extends ResourceIdentifier
            ? ResourceIdentifier | null // To-one: single identifier (will be resolved to full resource)
            : never
    : T;

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
export type FlattenedResource<
    TType extends string = string,
    TAttrs extends Record<string, any> = Record<string, any>,
    TRelMap extends Record<string, any> = Record<string, any>,
    TRelResourceMap extends Record<string, ResourceObject<string, any, any> | ResourceObject<string, any, any>[]> = Record<string, never>
> = {
    type: TType;
    id: string;
} & TAttrs & {
    // Flatten relationships - convert Relationship objects to their data directly
    // If TRelResourceMap provides specific types, use those; otherwise infer from Relationship
    [K in keyof TRelMap]?: TRelMap[K] extends Relationship
        ? TRelMap[K]['data'] extends ResourceIdentifier[]
            ? K extends keyof TRelResourceMap
                ? TRelResourceMap[K] extends ResourceObject<string, any, any>[]
                    ? FlattenedResource<
                        TRelResourceMap[K][number]['type'],
                        TRelResourceMap[K][number] extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
                        TRelResourceMap[K][number] extends ResourceObject<any, any, infer TRelMap> ? (TRelMap extends Record<string, any> ? TRelMap : Record<string, any>) : never
                    >[] | ResourceIdentifier[]
                    : FlattenedResource<string, any, any>[] | ResourceIdentifier[]
                : FlattenedResource<string, any, any>[] | ResourceIdentifier[] // To-many: array of flattened resources or identifiers
            : TRelMap[K]['data'] extends ResourceIdentifier
                ? K extends keyof TRelResourceMap
                    ? TRelResourceMap[K] extends ResourceObject<string, any, any>
                        ? FlattenedResource<
                            TRelResourceMap[K]['type'],
                            TRelResourceMap[K] extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
                            TRelResourceMap[K] extends ResourceObject<any, any, infer TRelMap> ? (TRelMap extends Record<string, any> ? TRelMap : Record<string, any>) : never
                        > | ResourceIdentifier | null
                        : FlattenedResource<string, any, any> | ResourceIdentifier | null
                    : FlattenedResource<string, any, any> | ResourceIdentifier | null // To-one: single flattened resource or identifier
                : never
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
