/**
 * Query parameter building utilities for Planning Center API
 * 
 * These functions transform complex parameter objects into flat query parameters
 * that can be used in API requests.
 */

/**
 * Transform complex params object into flat query params for API calls
 * Supports both typed where clauses and generic Record types
 * 
 * @param params - Query parameters including where clause, include, pagination, and ordering
 * @returns Flat object with query parameters ready for URL encoding
 * 
 * @example
 * ```typescript
 * const params = buildQueryParams({
 *   where: { status: 'active', first_name: 'John' },
 *   include: ['emails', 'phone_numbers'],
 *   per_page: 25,
 *   page: 1,
 *   order: 'first_name'
 * });
 * // Returns: {
 * //   'where[status]': 'active',
 * //   'where[first_name]': 'John',
 * //   include: 'emails,phone_numbers',
 * //   per_page: 25,
 * //   offset: 0,
 * //   page: 1,
 * //   order: 'first_name'
 * // }
 * ```
 */
export function buildQueryParams(params?: {
    where?: Record<string, string | number | boolean | undefined>;
    include?: string[];
    per_page?: number;
    page?: number;
    order?: string;
}): Record<string, string | number | boolean | undefined> {
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (params?.where) {
        Object.entries(params.where).forEach(([key, value]) => {
            queryParams[`where[${key}]`] = value as string | number | boolean | undefined;
        });
    }

    if (params?.include) {
        queryParams.include = params.include.join(',');
    }

    if (params?.per_page) {
        queryParams.per_page = params.per_page;
    }

    if (params?.page) {
        // Planning Center API uses offset-based pagination
        // Convert page number to offset: offset = (page - 1) * per_page
        const perPage = params.per_page || 25; // Default per_page if not specified
        const offset = (params.page - 1) * perPage;
        queryParams.offset = offset;
        // Also include page parameter for API compatibility (some endpoints may use it)
        queryParams.page = params.page;
    }

    if (params?.order) {
        queryParams.order = params.order;
    }

    return queryParams;
}

/**
 * Build simple query params for include-only requests (like getById)
 * 
 * @param include - Array of resource types to include
 * @returns Object with include parameter, or empty object if no includes
 * 
 * @example
 * ```typescript
 * const params = buildIncludeParams(['emails', 'phone_numbers']);
 * // Returns: { include: 'emails,phone_numbers' }
 * 
 * const emptyParams = buildIncludeParams();
 * // Returns: {}
 * ```
 */
export function buildIncludeParams(include?: string[]): Record<string, string | undefined> {
    if (!include || include.length === 0) {
        return {};
    }
    return { include: include.join(',') };
}
