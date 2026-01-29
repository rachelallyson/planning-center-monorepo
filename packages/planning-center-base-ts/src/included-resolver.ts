/**
 * JSON:API Included Resources Resolver
 * 
 * Automatically maps included resources to their relationships in JSON:API responses.
 */

import type { ResourceObject, ResourceIdentifier } from './types/json-api';
import type { FlattenedResource } from './types/flattened-resource';

/**
 * Create a lookup map for included resources by type and id
 * 
 * This is more efficient than searching the array multiple times.
 */
function createIncludedLookup(
    included: ResourceObject<string, any, any>[] | undefined
): Map<string, ResourceObject<string, any, any>> {
    const lookup = new Map<string, ResourceObject<string, any, any>>();
    
    if (!included || !Array.isArray(included)) {
        return lookup;
    }
    
    for (const resource of included) {
        const key = `${resource.type}:${resource.id}`;
        lookup.set(key, resource);
    }
    
    return lookup;
}

/**
 * Flatten a single resource object by moving attributes and relationships to the top level
 * 
 * Transforms: { type, id, attributes: { name: 'John' }, relationships: { emails: {...} } }
 * Into: { type, id, name: 'John', emails: [...] }
 */
function flattenResource(resource: ResourceObject<string, any, any>): any {
    const flattened: any = {
        type: resource.type,
        id: resource.id,
    };
    
    // Flatten attributes to top level
    if (resource.attributes) {
        Object.assign(flattened, resource.attributes);
    }
    
    // Flatten relationships to top level (and recursively flatten included resources)
    if (resource.relationships) {
        for (const [key, relationship] of Object.entries(resource.relationships)) {
            if (relationship && typeof relationship === 'object' && 'data' in relationship) {
                const relationshipData = relationship.data;
                
                if (relationshipData) {
                    if (Array.isArray(relationshipData)) {
                        // To-many: flatten each resource in the array
                        flattened[key] = relationshipData.map((item) => {
                            if (item && typeof item === 'object' && 'type' in item && 'id' in item && !('attributes' in item)) {
                                // It's just an identifier, return as-is
                                return item;
                            }
                            // It's a full resource object, flatten it
                            return flattenResource(item as ResourceObject<string, any, any>);
                        });
                    } else if (relationshipData && typeof relationshipData === 'object') {
                        if ('type' in relationshipData && 'id' in relationshipData) {
                            if ('attributes' in relationshipData) {
                                // It's a full resource object, flatten it
                                flattened[key] = flattenResource(relationshipData as ResourceObject<string, any, any>);
                            } else {
                                // It's just an identifier
                                flattened[key] = relationshipData;
                            }
                        }
                    }
                } else {
                    flattened[key] = null;
                }
            }
        }
    }
    
    // Preserve links and meta if they exist
    if (resource.links) {
        flattened.links = resource.links;
    }
    if (resource.meta) {
        flattened.meta = resource.meta;
    }
    
    return flattened;
}

/**
 * Automatically map included resources to their relationships and flatten the structure
 * 
 * This transforms JSON:API responses to a flatter, more convenient structure:
 * - Relationships are moved to the top level (person.emails instead of personemails)
 * - Attributes are moved to the top level (email.address instead of email.attributes.address)
 * - Included resources are automatically resolved and flattened
 * 
 * @param data - Array of resource objects with relationships
 * @param included - Array of included resources from JSON:API response
 * @returns The data array with relationships resolved and structure flattened
 * 
 * @example
 * ```typescript
 * // Before: personemails.data[0].attributes.address
 * // After: person.emails[0].address
 * const mapped = mapIncludedToRelationships(response.data, response.included);
 * ```
 */
export function mapIncludedToRelationships<T extends ResourceObject<string, any, any>>(
    data: T[],
    included: ResourceObject<string, any, any>[] | undefined
): FlattenedResource<
    T['type'],
    T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
    T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
>[] {
    // Create lookup map for efficient resolution
    const lookup = included && included.length > 0 
        ? createIncludedLookup(included)
        : new Map<string, ResourceObject<string, any, any>>();
    
    // Always flatten resources, even if no included data (for consistent return type)
    return data.map((resource) => {
        // First, resolve relationships with included resources
        const resolved: any = { ...resource };
        
        if (resource.relationships) {
            resolved.relationships = { ...resource.relationships };
            
            // For each relationship, resolve identifiers to full resources
            for (const [key, relationship] of Object.entries(resource.relationships)) {
                if (relationship && typeof relationship === 'object' && 'data' in relationship) {
                    const relationshipData = relationship.data;
                    
                    if (relationshipData) {
                        if (Array.isArray(relationshipData)) {
                            // To-many relationship: resolve each identifier
                            const resolvedArray = relationshipData.map((ref) => {
                                if (ref && typeof ref === 'object' && 'type' in ref && 'id' in ref) {
                                    const lookupKey = `${ref.type}:${ref.id}`;
                                    return lookup.get(lookupKey) || ref;
                                }
                                return ref;
                            });
                            resolved.relationships[key] = resolvedArray;
                        } else if (relationshipData && typeof relationshipData === 'object' && 'type' in relationshipData && 'id' in relationshipData) {
                            // To-one relationship: resolve single identifier
                            const lookupKey = `${relationshipData.type}:${relationshipData.id}`;
                            const resolvedResource = lookup.get(lookupKey);
                            resolved.relationships[key] = resolvedResource || relationshipData;
                        }
                    } else {
                        resolved.relationships[key] = null;
                    }
                }
            }
        }
        
        // Now flatten the entire resource (attributes + relationships to top level)
        return flattenResource(resolved) as FlattenedResource<
            T['type'],
            T extends ResourceObject<string, infer TAttrs, any> ? TAttrs : never,
            T extends ResourceObject<any, any, infer TRelMap> ? TRelMap : never
        >;
    });
}
