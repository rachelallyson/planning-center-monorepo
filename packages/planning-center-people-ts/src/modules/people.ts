/**
 * v2.0.0 People Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoEventEmitter,
    PcoClientConfig,
} from '@rachelallyson/planning-center-base-ts';
import type {
    PersonResource,
    PersonAttributes,
    PersonRelationshipMap,
    EmailResource,
    EmailAttributes,
    PhoneNumberResource,
    PhoneNumberAttributes,
    AddressResource,
    AddressAttributes,
    SocialProfileResource,
    SocialProfileAttributes,
    CampusResource,
    HouseholdResource,
    WorkflowCardResource,
    NoteResource,
    FieldDatumResource,
    PeopleIncluded,
    FlattenedPersonResource
} from '../types';
import type { Meta, TopLevelLinks } from '../types/json-api';
import type { ResourceObject, Attributes, Relationship } from '../types/json-api';
import { PersonMatcher } from '../matching/matcher';

import type { PersonListOptions, PersonPageOptions, PersonWhereClause } from '../types/api-options';

// Re-export for backward compatibility
export type PeopleListOptions = PersonListOptions;

export interface PersonCreateOptions {
    firstName?: string;
    lastName?: string;
    givenName?: string;
    middleName?: string;
    nickname?: string;
    birthdate?: string;
    anniversary?: string;
    gender?: string;
    grade?: string;
    child?: boolean;
    status?: string;
    medicalNotes?: string;
    jobTitle?: string;
    employer?: string;
    school?: string;
    graduationYear?: string;
    avatar?: string;
    siteAdministrator?: boolean;
    accountingAdministrator?: boolean;
    peoplePermissions?: string;
    directoryStatus?: string;
    loginIdentifier?: string;
    membership?: string;
    remoteId?: string;
    demographicAvatarUrl?: string;
    inactivatedAt?: string;
    resourcePermissionFlags?: Record<string, boolean>;
}

/**
 * Options for finding or creating a person with smart matching
 */
export interface PersonMatchOptions {
    /** Person's first name */
    firstName?: string;
    /** Person's last name */
    lastName?: string;
    /** Person's email address */
    email?: string;
    /** Person's phone number */
    phone?: string;
    /** 
     * Matching strategy to use:
     * - 'exact': Only return matches with verified email/phone matches (high confidence)
     * - 'fuzzy': Return best match above threshold (default)
     * - 'aggressive': Return best match with lower threshold
     */
    matchStrategy?: 'exact' | 'fuzzy' | 'aggressive';
    /**
     * Search strategy for finding matches:
     * - 'single': Use only the specified matchStrategy (default)
     * - 'multi-step': Try multiple strategies in order until a match is found:
     *   1. Fuzzy with age preference
     *   2. Fuzzy without age preference
     *   3. Exact with age preference
     *   4. Exact without age preference
     */
    searchStrategy?: 'single' | 'multi-step';
    /** Campus ID to associate with the person */
    campusId?: string;
    /** If true, create a new person if no match is found (default: true) */
    createIfNotFound?: boolean;
    /** 
     * If true, automatically add missing email/phone contact information to a person's profile 
     * when a match is found. Missing contacts are added as non-primary to avoid overriding 
     * existing primary contacts. (default: false)
     */
    addMissingContactInfo?: boolean;
    /** Age preference filter: 'adults' (18+), 'children' (<18), or 'any' */
    agePreference?: 'adults' | 'children' | 'any';
    /**
     * When true, age preference filters only apply to profiles with birthdates.
     * Profiles without birthdates are included regardless of agePreference.
     * When false (default), profiles without birthdates only match when agePreference is 'any'.
     */
    agePreferenceLenient?: boolean;
    /** Minimum age filter */
    minAge?: number;
    /** Maximum age filter */
    maxAge?: number;
    /** Birth year filter (exact match) */
    birthYear?: number;
    /**
     * Retry configuration for handling PCO contact verification delays.
     * When a person is created, PCO needs time (30-90+ seconds) to verify/index contacts
     * before they become searchable. This retry logic helps prevent duplicate person creation.
     */
    retryConfig?: RetryConfig;
    /**
     * Phase-specific retry configurations for advanced control.
     * When both retryConfig and retryConfigs are provided, retryConfigs takes precedence.
     */
    retryConfigs?: {
        /** Configuration for initial/quick search phase (default: 30s max wait) */
        initial?: RetryConfig;
        /** Configuration for aggressive search before creating (default: 60s max wait) */
        aggressive?: RetryConfig;
    };
    /**
     * If true, fall back to name-based search when email/phone search fails.
     * Requires both firstName and lastName to be provided.
     * Uses contact validation to avoid wrong-person matches. (default: false)
     */
    fallbackToNameSearch?: boolean;
    /**
     * Contact validation strategy for name-based search fallback:
     * - 'strict': Requires exact email or phone match
     * - 'domain': Requires matching email domain or similar phone
     * - 'similarity': Uses domain matching for email, similarity for phone (default)
     */
    contactValidation?: 'strict' | 'domain' | 'similarity';
}

/**
 * Retry configuration for handling PCO contact verification delays
 */
export interface RetryConfig {
    /** Maximum number of retry attempts (default: 5) */
    maxRetries?: number;
    /** Maximum total wait time in milliseconds (default: 120000 = 120 seconds) */
    maxWaitTime?: number;
    /** Initial delay in milliseconds before first retry (default: 10000 = 10 seconds) */
    initialDelay?: number;
    /** Multiplier for exponential backoff (default: 1.5) */
    backoffMultiplier?: number;
    /** Whether to enable retry logic (default: true when email/phone provided and createIfNotFound: false) */
    enabled?: boolean;
}

/**
 * Default retry configuration for initial search phase
 */
export const DEFAULT_INITIAL_RETRY_CONFIG: Required<Omit<RetryConfig, 'enabled'>> = {
    maxRetries: 3,
    maxWaitTime: 30000, // 30 seconds
    initialDelay: 3000,
    backoffMultiplier: 2,
};

/**
 * Default retry configuration for aggressive search phase (before creating)
 */
export const DEFAULT_AGGRESSIVE_RETRY_CONFIG: Required<Omit<RetryConfig, 'enabled'>> = {
    maxRetries: 6,
    maxWaitTime: 60000, // 60 seconds
    initialDelay: 5000,
    backoffMultiplier: 2,
};

export class PeopleModule extends BaseModule {
    private personMatcher: PersonMatcher;

    constructor(
        httpClient: PcoHttpClient,
        paginationHelper: PaginationHelper,
        eventEmitter: PcoEventEmitter,
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, eventEmitter, getConfig);
        this.personMatcher = new PersonMatcher(this, getConfig);
    }

    /**
     * Get all people across all pages with optional filtering
     */
    async getAll(options: PersonListOptions = {}) {
        this.debugLog('people.getAll', { options });
        return await this.getAllPages<PersonResource, PeopleIncluded, PersonRelationshipMap>('/people', {
            where: options.where,
            include: options.include,
            order: options.order
        });
    }

    /**
     * Get a single page of people with optional filtering and pagination control
     * Use this when you need a specific page or want to limit the number of results
     * @param options - List options including where, include, perPage, page, and order
     * @returns A single page of results with meta and links for pagination
     */
    async getPage(options: PersonPageOptions = {}): Promise<{ 
        data: FlattenedPersonResource[]; 
        meta?: Meta; 
        links?: TopLevelLinks 
    }> {
        this.debugLog('people.getPage', { options });
        return this.getList<PersonResource>('/people', {
            where: options.where,
            include: options.include,
            per_page: options.perPage,
            page: options.page,
            order: options.order
        });
    }

    /**
     * Get a single person by ID
     */
    async getById(id: string, include?: string[]) {
        this.debugLog('people.getById', { id, include });
        return this.getSingle<PersonResource>(`/people/${id}`, include);
    }

    /**
     * Verify that a person exists in PCO
     * 
     * This is useful for validating cached person IDs before use,
     * especially when person records may have been merged or deleted.
     * 
     * @param personId - The person ID to verify
     * @param options - Optional configuration
     * @param options.timeout - Timeout in milliseconds (default: 30000)
     * @returns True if person exists, false if not found
     * @throws Error if request times out or other error occurs (except 404)
     * 
     * @gmail.com
     * ```typescript
     * const exists = await client.people.verifyPersonExists(cachedPersonId);
     * if (!exists) {
     *   // Person was merged or deleted, need to search again
     *   const person = await client.people.findOrCreate(options);
     * }
     * ```
     */
    async verifyPersonExists(
        personId: string,
        options?: { timeout?: number }
    ) {
        this.debugLog('people.verifyPersonExists', { personId, options });
        const timeout = options?.timeout ?? 30000;
        
        const verificationPromise = this.getById(personId)
            .then(() => true)
            .catch((error: unknown) => {
                // 404 means person doesn't exist (merged or deleted)
                const status = (error as { status?: number; response?: { status?: number } })?.status 
                    ?? (error as { response?: { status?: number } })?.response?.status;
                if (status === 404) {
                    return false;
                }
                // Re-throw other errors
                throw error;
            });
        
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`Person verification timed out after ${timeout}ms`));
            }, timeout);
        });
        
        return Promise.race([verificationPromise, timeoutPromise]);
    }

    /**
     * Transform PersonCreateOptions (camelCase) to API format (snake_case)
     * Also handles snake_case input directly (passes through)
     */
    private transformPersonData(data: PersonCreateOptions | Partial<PersonCreateOptions> | Partial<PersonAttributes>) {
        const transformed: Partial<PersonAttributes> = {};
        const dataObj = data as Record<string, any>;
        
        // If data is already in snake_case format, copy those fields directly
        if (dataObj.first_name !== undefined) transformed.first_name = dataObj.first_name;
        if (dataObj.last_name !== undefined) transformed.last_name = dataObj.last_name;
        if (dataObj.given_name !== undefined) transformed.given_name = dataObj.given_name;
        if (dataObj.middle_name !== undefined) transformed.middle_name = dataObj.middle_name;
        if (dataObj.nickname !== undefined) transformed.nickname = dataObj.nickname;
        if (dataObj.birthdate !== undefined) transformed.birthdate = dataObj.birthdate;
        if (dataObj.anniversary !== undefined) transformed.anniversary = dataObj.anniversary;
        if (dataObj.gender !== undefined) transformed.gender = dataObj.gender;
        if (dataObj.grade !== undefined) transformed.grade = dataObj.grade;
        if (dataObj.child !== undefined) transformed.child = dataObj.child;
        if (dataObj.status !== undefined) transformed.status = dataObj.status;
        if (dataObj.medical_notes !== undefined) transformed.medical_notes = dataObj.medical_notes;
        if (dataObj.job_title !== undefined) transformed.job_title = dataObj.job_title;
        if (dataObj.employer !== undefined) transformed.employer = dataObj.employer;
        if (dataObj.school !== undefined) transformed.school = dataObj.school;
        if (dataObj.graduation_year !== undefined) transformed.graduation_year = dataObj.graduation_year;
        if (dataObj.avatar !== undefined) transformed.avatar = dataObj.avatar;
        if (dataObj.site_administrator !== undefined) transformed.site_administrator = dataObj.site_administrator;
        if (dataObj.accounting_administrator !== undefined) transformed.accounting_administrator = dataObj.accounting_administrator;
        if (dataObj.people_permissions !== undefined) transformed.people_permissions = dataObj.people_permissions;
        if (dataObj.directory_status !== undefined) transformed.directory_status = dataObj.directory_status;
        if (dataObj.login_identifier !== undefined) transformed.login_identifier = dataObj.login_identifier;
        if (dataObj.membership !== undefined) transformed.membership = dataObj.membership;
        if (dataObj.remote_id !== undefined) transformed.remote_id = dataObj.remote_id;
        if (dataObj.demographic_avatar_url !== undefined) transformed.demographic_avatar_url = dataObj.demographic_avatar_url;
        if (dataObj.inactivated_at !== undefined) transformed.inactivated_at = dataObj.inactivated_at;
        if (dataObj.resource_permission_flags !== undefined) transformed.resource_permission_flags = dataObj.resource_permission_flags;
        if (dataObj.primary_campus_id !== undefined) transformed.primary_campus_id = dataObj.primary_campus_id;
        if (dataObj.household_id !== undefined) transformed.household_id = dataObj.household_id;
        
        // Handle PersonCreateOptions fields (camelCase)
        if (dataObj.firstName !== undefined) transformed.first_name = dataObj.firstName;
        if (dataObj.lastName !== undefined) transformed.last_name = dataObj.lastName;
        if (dataObj.givenName !== undefined) transformed.given_name = dataObj.givenName;
        if (dataObj.middleName !== undefined) transformed.middle_name = dataObj.middleName;
        if (dataObj.nickname !== undefined) transformed.nickname = dataObj.nickname;
        if (dataObj.birthdate !== undefined) transformed.birthdate = dataObj.birthdate;
        if (dataObj.anniversary !== undefined) transformed.anniversary = dataObj.anniversary;
        if (dataObj.gender !== undefined) transformed.gender = dataObj.gender;
        if (dataObj.grade !== undefined) transformed.grade = dataObj.grade;
        if (dataObj.child !== undefined) transformed.child = dataObj.child;
        if (dataObj.status !== undefined) transformed.status = dataObj.status;
        if (dataObj.medicalNotes !== undefined) transformed.medical_notes = dataObj.medicalNotes;
        if (dataObj.jobTitle !== undefined) transformed.job_title = dataObj.jobTitle;
        if (dataObj.employer !== undefined) transformed.employer = dataObj.employer;
        if (dataObj.school !== undefined) transformed.school = dataObj.school;
        if (dataObj.graduationYear !== undefined) transformed.graduation_year = dataObj.graduationYear;
        if (dataObj.avatar !== undefined) transformed.avatar = dataObj.avatar;
        if (dataObj.siteAdministrator !== undefined) transformed.site_administrator = dataObj.siteAdministrator;
        if (dataObj.accountingAdministrator !== undefined) transformed.accounting_administrator = dataObj.accountingAdministrator;
        if (dataObj.peoplePermissions !== undefined) transformed.people_permissions = dataObj.peoplePermissions;
        if (dataObj.directoryStatus !== undefined) transformed.directory_status = dataObj.directoryStatus;
        if (dataObj.loginIdentifier !== undefined) transformed.login_identifier = dataObj.loginIdentifier;
        if (dataObj.membership !== undefined) transformed.membership = dataObj.membership;
        if (dataObj.remoteId !== undefined) transformed.remote_id = dataObj.remoteId;
        if (dataObj.demographicAvatarUrl !== undefined) transformed.demographic_avatar_url = dataObj.demographicAvatarUrl;
        if (dataObj.inactivatedAt !== undefined) transformed.inactivated_at = dataObj.inactivatedAt;
        if (dataObj.resourcePermissionFlags !== undefined) transformed.resource_permission_flags = dataObj.resourcePermissionFlags;
        
        // Handle relationship fields
        if (dataObj.primaryCampusId !== undefined) transformed.primary_campus_id = dataObj.primaryCampusId;
        if (dataObj.householdId !== undefined) transformed.household_id = dataObj.householdId;
        
        return transformed;
    }

    /**
     * Create a new person
     * Accepts both camelCase (PersonCreateOptions) and snake_case (PersonAttributes) fields
     */
    async create(data: PersonCreateOptions | Partial<PersonAttributes>) {
        this.debugLog('people.create', { data });
        // Check if data is already in snake_case format (has first_name, last_name, etc.)
        const hasSnakeCase = Object.keys(data).some(key => key.includes('_'));
        
        // If it's already in snake_case, use it directly; otherwise transform
        const transformedData = hasSnakeCase 
            ? (data as Partial<PersonAttributes>)
            : this.transformPersonData(data as Partial<PersonCreateOptions>);
        
        return this.createResource<PersonResource>('/people', transformedData);
    }

    /**
     * Update a person
     * Accepts both camelCase (PersonCreateOptions) and snake_case (PersonAttributes) fields
     */
    async update(id: string, data: Partial<PersonCreateOptions> | Partial<PersonAttributes>) {
        this.debugLog('people.update', { id, data });
        // Check if data is already in snake_case format (has first_name, last_name, etc.)
        const hasSnakeCase = Object.keys(data).some(key => key.includes('_'));
        
        // If it's already in snake_case, use it directly; otherwise transform
        const transformedData = hasSnakeCase 
            ? (data as Partial<PersonAttributes>)
            : this.transformPersonData(data as Partial<PersonCreateOptions>);
        
        return this.updateResource<PersonResource>(`/people/${id}`, transformedData);
    }

    /**
     * Delete a person
     */
    async delete(id: string) {
        this.debugLog('people.delete', { id });
        return this.deleteResource(`/people/${id}`);
    }

    // ===== Relationship Management =====

    /**
     * Get a person's primary campus
     */
    async getPrimaryCampus(personId: string) {
        this.debugLog('people.getPrimaryCampus', { personId });
        const person = await this.getById(personId, ['primary_campus']);
        const campusData = person.primary_campus;
        
        // campusData can be CampusResource, ResourceIdentifier, or null
        if (!campusData || Array.isArray(campusData)) {
            return null;
        }
        
        // Check if it's a ResourceIdentifier (has id but might not have full attributes)
        if ('id' in campusData && 'type' in campusData) {
            // Get the full campus resource
            return this.getSingle<CampusResource>(`/campuses/${(campusData as { id: string }).id}`);
        }
        
        // If it's already a full resource, return it
        return campusData as CampusResource;
    }

    /**
     * Set a person's primary campus
     */
    async setPrimaryCampus(personId: string, campusId: string) {
        this.debugLog('people.setPrimaryCampus', { personId, campusId });
        const transformedData = this.transformPersonData({ primaryCampusId: campusId });
        return this.updateResource<PersonResource>(`/people/${personId}`, transformedData);
    }

    /**
     * Remove a person's primary campus
     */
    async removePrimaryCampus(personId: string) {
        this.debugLog('people.removePrimaryCampus', { personId });
        const transformedData = this.transformPersonData({ primaryCampusId: null });
        return this.updateResource<PersonResource>(`/people/${personId}`, transformedData);
    }

    /**
     * Get a person's household
     */
    async getHousehold(personId: string) {
        this.debugLog('people.getHousehold', { personId });
        const person = await this.getById(personId, ['household']);
        const householdData = person.household;
        
        // householdData can be HouseholdResource, ResourceIdentifier, or null
        if (!householdData || Array.isArray(householdData)) {
            return null;
        }
        
        // Check if it's a ResourceIdentifier (has id but might not have full attributes)
        if ('id' in householdData && 'type' in householdData) {
            // Get the full household resource
            return this.getSingle<HouseholdResource>(`/households/${(householdData as { id: string }).id}`);
        }
        
        // If it's already a full resource, return it
        return householdData as HouseholdResource;
    }

    /**
     * Set a person's household
     * Uses the household_memberships endpoint to create a membership record
     */
    async setHousehold(personId: string, householdId: string) {
        this.debugLog('people.setHousehold', { personId, householdId });
        // Create a household membership using the household_memberships endpoint
        interface HouseholdMembershipCreateData {
            relationships: {
                person: {
                    data: {
                        type: 'Person';
                        id: string;
                    };
                };
            };
        }
        await this.createResource<ResourceObject<'HouseholdMembership', Attributes, { household?: Relationship; person?: Relationship }>>(
            `/households/${householdId}/household_memberships`, 
            {
                relationships: {
                    person: {
                        data: {
                            type: 'Person',
                            id: personId
                        }
                    }
                }
            } as HouseholdMembershipCreateData
        );
        
        // Return the updated person
        return this.getById(personId);
    }

    /**
     * Remove a person from their household
     * Uses the household_memberships endpoint to delete the membership record
     */
    async removeFromHousehold(personId: string) {
        this.debugLog('people.removeFromHousehold', { personId });
        // Get the person's household memberships to find the membership ID
        // Use the person's household_memberships endpoint
        type HouseholdMembershipResource = ResourceObject<'HouseholdMembership', Attributes, { household?: Relationship; person?: Relationship }>;
        
        type HouseholdMembershipResponse = {
            data: HouseholdMembershipResource[];
        };
        
        const membershipsResponse = await this.httpClient.request<HouseholdMembershipResponse>({
            method: 'GET',
            endpoint: `/people/${personId}/household_memberships`
        });
        
        if (!membershipsResponse.data.data || membershipsResponse.data.data.length === 0) {
            throw new Error(`Person ${personId} is not in a household`);
        }
        
        // Get the first membership (a person can only be in one household)
        const membership = membershipsResponse.data.data[0];
        const membershipId = membership.id;
        
        // Get the household ID from the membership relationship
        const membershipHousehold = membership.relationships?.household?.data;
        if (!membershipHousehold || Array.isArray(membershipHousehold) || !membershipHousehold.id) {
            // If household relationship is not included, get it from the membership
            interface HouseholdMembershipDetailResponse {
                data: HouseholdMembershipResource;
            }
            const membershipDetails = await this.httpClient.request<HouseholdMembershipDetailResponse>({
                method: 'GET',
                endpoint: `/people/${personId}/household_memberships/${membershipId}`,
                params: {
                    include: 'household'
                }
            });
            const householdData = membershipDetails.data.data.relationships?.household?.data;
            if (!householdData || Array.isArray(householdData) || !householdData.id) {
                throw new Error(`Could not determine household ID for membership ${membershipId}`);
            }
            const householdId = householdData.id;
            await this.deleteResource(`/households/${householdId}/household_memberships/${membershipId}`);
        } else {
            const householdId = membershipHousehold.id;
            await this.deleteResource(`/households/${householdId}/household_memberships/${membershipId}`);
        }
        
        // Return the updated person
        return this.getById(personId);
    }

    /**
     * Get all people in a specific household
     * Note: This uses getList() internally, so it returns a single page. Use getAll() with where[household_id] for all pages.
     */
    async getHouseholdMembers(householdId: string, options: PersonPageOptions = {}) {
        this.debugLog('people.getHouseholdMembers', { householdId, options });
        // household_id is not in PersonWhereClause, so we need to use flat params
        // Build the where clause manually and merge with other options
        const params: Record<string, any> = {};
        if (options.include) params.include = options.include.join(',');
        if (options.perPage) params.per_page = options.perPage;
        if (options.page) params.page = options.page;
        params['where[household_id]'] = householdId;

        return this.getList<PersonResource>('/people', params);
    }

    /**
     * Get people by campus
     * Note: This uses getList() internally, so it returns a single page. Use getAll() with where[primary_campus_id] for all pages.
     */
    async getByCampus(campusId: string, options: PersonPageOptions = {}) {
        this.debugLog('people.getByCampus', { campusId, options });
        const campusIdNum = Number(campusId);
        if (isNaN(campusIdNum)) {
            throw new Error(`Invalid campus ID: ${campusId}`);
        }
        return this.getList<PersonResource>('/people', {
            where: { primary_campus_id: campusIdNum } as PersonWhereClause,
            include: options.include,
            per_page: options.perPage,
            page: options.page
        });
    }

    /**
     * Get a person's workflow cards
     */
    async getWorkflowCards(personId: string, options: {
        include?: string[];
        perPage?: number;
        page?: number;
    } = {}) {
        this.debugLog('people.getWorkflowCards', { personId, options });
        return this.getList<WorkflowCardResource>(`/people/${personId}/workflow_cards`, {
            include: options.include,
            per_page: options.perPage,
            page: options.page
        });
    }

    /**
     * Get a person's notes
     */
    async getNotes(personId: string, options: {
        include?: string[];
        perPage?: number;
        page?: number;
    } = {}) {
        this.debugLog('people.getNotes', { personId, options });
        return this.getList<NoteResource>(`/people/${personId}/notes`, {
            include: options.include,
            per_page: options.perPage,
            page: options.page
        });
    }

    /**
     * Get a person's field data
     */
    async getFieldData(personId: string, options: {
        include?: string[];
        perPage?: number;
        page?: number;
    } = {}) {
        this.debugLog('people.getFieldData', { personId, options });
        return this.getList<FieldDatumResource>(`/people/${personId}/field_data`, {
            include: options.include,
            per_page: options.perPage,
            page: options.page
        });
    }

    /**
     * Get a person's social profiles
     */
    async getSocialProfiles(personId: string, options: {
        include?: string[];
        perPage?: number;
        page?: number;
    } = {}) {
        this.debugLog('people.getSocialProfiles', { personId, options });
        return this.getList<SocialProfileResource>(`/people/${personId}/social_profiles`, {
            include: options.include,
            per_page: options.perPage,
            page: options.page
        });
    }

    /**
     * Find or create a person with smart matching
     * 
     * This method uses intelligent matching logic to find existing people or create new ones.
     * It verifies email/phone matches and only uses name matching when appropriate.
     * 
     * @param options - Matching options including name, contact info, and matching preferences
     * @param options.addMissingContactInfo - If true, automatically adds missing email/phone 
     *   to a person's profile when a match is found. The contacts are added as non-primary 
     *   to preserve existing primary contacts.
     * 
     * @gmail.com
     * ```typescript
     * // Basic find or create
     * const person = await client.people.findOrCreate({
     *   firstName: 'John',
     *   lastName: 'Doe',
     *   email: 'john@gmail.com',
     *   phone: '+1234567890'
     * });
     * 
     * // Find and add missing contact info if match found
     * const person = await client.people.findOrCreate({
     *   firstName: 'Jane',
     *   lastName: 'Smith',
     *   email: 'jane@gmail.com',
     *   phone: '+1987654321',
     *   addMissingContactInfo: true  // Will add phone if person only has email
     * });
     * ```
     * 
     * @returns The found or newly created person
     */
    async findOrCreate(options: PersonMatchOptions) {
        this.debugLog('people.findOrCreate', { options });
        return this.personMatcher.findOrCreate(options);
    }

    /**
     * Search people by multiple criteria
     */
    async search(criteria: {
        name?: string;
        email?: string;
        phone?: string;
        status?: string;
        perPage?: number;
        page?: number;
    }) {
        this.debugLog('people.search', { criteria });
        const where: PersonWhereClause = {};

        // Use flexible search when we have multiple criteria or want broader matching
        if (criteria.email || criteria.phone) {
            // Use the powerful flexible search parameter
            if (criteria.email) {
                where.search_name_or_email_or_phone_number = criteria.email;
            } else if (criteria.phone) {
                where.search_name_or_email_or_phone_number = criteria.phone;
            }
        } else if (criteria.name) {
            // Use specific name search when only name is provided
            where.search_name = criteria.name;
        }

        if (criteria.status) {
            where.status = criteria.status;
        }

        // If pagination options are provided, use getPage instead of getAll
        if (criteria.perPage !== undefined || criteria.page !== undefined) {
            return this.getPage({
                where,
                perPage: criteria.perPage,
                page: criteria.page,
            });
        }

        return this.getAll({
            where,
        });
    }

    // Contact methods

    /**
     * Get person's emails
     */
    async getEmails(personId: string) {
        this.debugLog('people.getEmails', { personId });
        return this.getList<EmailResource>(`/people/${personId}/emails`);
    }

    /**
     * Add an email to a person
     */
    async addEmail(personId: string, data: EmailAttributes) {
        this.debugLog('people.addEmail', { personId, data });
        return this.createResource<EmailResource>(`/people/${personId}/emails`, data);
    }

    /**
     * Update a person's email
     */
    async updateEmail(personId: string, emailId: string, data: Partial<EmailAttributes>) {
        this.debugLog('people.updateEmail', { personId, emailId, data });
        return this.updateResource<EmailResource>(`/people/${personId}/emails/${emailId}`, data);
    }

    /**
     * Delete a person's email
     */
    async deleteEmail(personId: string, emailId: string) {
        this.debugLog('people.deleteEmail', { personId, emailId });
        return this.deleteResource(`/people/${personId}/emails/${emailId}`);
    }

    /**
     * Get person's phone numbers
     */
    async getPhoneNumbers(personId: string) {
        this.debugLog('people.getPhoneNumbers', { personId });
        return this.getList<PhoneNumberResource>(`/people/${personId}/phone_numbers`);
    }

    /**
     * Add a phone number to a person
     */
    async addPhoneNumber(personId: string, data: PhoneNumberAttributes) {
        this.debugLog('people.addPhoneNumber', { personId, data });
        return this.createResource<PhoneNumberResource>(`/people/${personId}/phone_numbers`, data);
    }

    /**
     * Update a person's phone number
     */
    async updatePhoneNumber(personId: string, phoneId: string, data: Partial<PhoneNumberAttributes>) {
        this.debugLog('people.updatePhoneNumber', { personId, phoneId, data });
        return this.updateResource<PhoneNumberResource>(`/people/${personId}/phone_numbers/${phoneId}`, data);
    }

    /**
     * Delete a person's phone number
     */
    async deletePhoneNumber(personId: string, phoneId: string) {
        this.debugLog('people.deletePhoneNumber', { personId, phoneId });
        return this.deleteResource(`/people/${personId}/phone_numbers/${phoneId}`);
    }

    /**
     * Get person's addresses
     */
    async getAddresses(personId: string) {
        this.debugLog('people.getAddresses', { personId });
        return this.getList<AddressResource>(`/people/${personId}/addresses`);
    }

    /**
     * Add an address to a person
     */
    async addAddress(personId: string, data: AddressAttributes) {
        this.debugLog('people.addAddress', { personId, data });
        return this.createResource<AddressResource>(`/people/${personId}/addresses`, data);
    }

    /**
     * Update a person's address
     */
    async updateAddress(personId: string, addressId: string, data: Partial<AddressAttributes>) {
        this.debugLog('people.updateAddress', { personId, addressId, data });
        return this.updateResource<AddressResource>(`/people/${personId}/addresses/${addressId}`, data);
    }

    /**
     * Delete a person's address
     */
    async deleteAddress(personId: string, addressId: string) {
        this.debugLog('people.deleteAddress', { personId, addressId });
        return this.deleteResource(`/people/${personId}/addresses/${addressId}`);
    }


    /**
     * Add a social profile to a person
     */
    async addSocialProfile(personId: string, data: SocialProfileAttributes) {
        this.debugLog('people.addSocialProfile', { personId, data });
        return this.createResource<SocialProfileResource>(`/people/${personId}/social_profiles`, data);
    }

    /**
     * Update a person's social profile
     */
    async updateSocialProfile(personId: string, profileId: string, data: Partial<SocialProfileAttributes>) {
        this.debugLog('people.updateSocialProfile', { personId, profileId, data });
        return this.updateResource<SocialProfileResource>(`/people/${personId}/social_profiles/${profileId}`, data);
    }

    /**
     * Delete a person's social profile
     */
    async deleteSocialProfile(personId: string, profileId: string) {
        this.debugLog('people.deleteSocialProfile', { personId, profileId });
        return this.deleteResource(`/people/${personId}/social_profiles/${profileId}`);
    }

    /**
     * Create a person with contact information
     */
    async createWithContacts(
        personData: PersonCreateOptions,
        contacts?: {
            email?: EmailAttributes;
            phone?: PhoneNumberAttributes;
            address?: AddressAttributes;
        }
    ): Promise<{
        person: PersonResource;
        email?: EmailResource;
        phone?: PhoneNumberResource;
        address?: AddressResource;
    }> {
        this.debugLog('people.createWithContacts', { personData, contacts });
        const person = await this.create(personData);
        const result: {
            person: PersonResource;
            email?: EmailResource;
            phone?: PhoneNumberResource;
            address?: AddressResource;
        } = { person };

        if (contacts?.email) {
            result.email = await this.addEmail(person.id, contacts.email);
        }

        if (contacts?.phone) {
            result.phone = await this.addPhoneNumber(person.id, contacts.phone);
        }

        if (contacts?.address) {
            result.address = await this.addAddress(person.id, contacts.address);
        }

        return result;
    }
}
