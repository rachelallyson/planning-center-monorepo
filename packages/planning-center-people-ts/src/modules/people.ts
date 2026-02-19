/**
 * People API module: getById, getAll, getPage, create, update, delete, findOrCreatePerson,
 * and relationship helpers (primary campus, household). All methods return flattened resources.
 */

import { BaseModule, singleFromCreateResponse } from '@rachelallyson/planning-center-base-ts';
import type {
    PcoHttpClient,
    PaginationHelper,
    PcoClientConfig,
    ResourceObject,
    Relationship,
    Attributes,
} from '@rachelallyson/planning-center-base-ts';
import type * as Types from '../types';
import { PersonMatcher } from '../matching/matcher';
import { getStatusFromError, getStringId } from '../internal/type-guards';

import type {
    PersonGetPageOptions,
    PersonGetAllOptions,
    PersonGetByIdOptions,
    PersonWhereClause,
    NoteGetPageOptions,
    FieldDataGetPageOptions,
    WorkflowCardGetPageOptions,
    SocialProfileGetPageOptions,
    PersonVerifyExistsOptions,
} from '../types/api-options';

/**
 * Options for finding or creating a person with smart matching
 */
export interface PersonMatchOptions {
    /** Person's first name */
    first_name?: string;
    /** Person's last name */
    last_name?: string;
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
     * Requires both first_name and last_name to be provided.
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
        getConfig?: () => PcoClientConfig
    ) {
        super(httpClient, paginationHelper, getConfig);
        this.personMatcher = new PersonMatcher(this, getConfig);
    }

    /**
     * Get all people across all pages with optional filtering
     */
    async getAll(options?: PersonGetAllOptions) {
        return this.getAllPages<Types.PersonResource>('/people', options);
    }

    /**
     * Get a single page of people with optional filtering and pagination control
     */
    async getPage(options?: PersonGetPageOptions) {
        return this.getList<Types.PersonResource, PersonGetPageOptions>('/people', options);
    }

    /**
     * Get a single person by ID
     */
    async getById(id: string, options?: PersonGetByIdOptions) {
        return this.getSingle<Types.PersonResource>(`/people/${id}`, options);
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
        options?: PersonVerifyExistsOptions
    ) {
        const timeout = options?.timeout ?? 30000;

        const verificationPromise = this.getById(personId)
            .then(() => true)
            .catch((error) => {
                const status = getStatusFromError(error);
                if (status === 404) return false;
                throw error;
            });

        const timeoutPromise = new Promise<never>((resolve, reject) => {
            void resolve;
            setTimeout(() => {
                reject(new Error(`Person verification timed out after ${timeout}ms`));
            }, timeout);
        });

        return Promise.race([verificationPromise, timeoutPromise]);
    }

    /**
     * Create a new person
     * Accepts both camelCase (PersonCreateOptions) and snake_case (PersonAttributes) fields
     */
    async create(data: Partial<Types.PersonAttributes>) {
        return this.createResource<Types.PersonResource>('/people', data);
    }

    /**
     * Update a person
     * Accepts both camelCase (PersonCreateOptions) and snake_case (PersonAttributes) fields
     */
    async update(id: string, data: Partial<Types.PersonAttributes>) {
        return this.updateResource<Types.PersonResource>(`/people/${id}`, data);
    }

    /**
     * Delete a person
     */
    async delete(id: string) {
        return this.deleteResource(`/people/${id}`);
    }

    // ===== Relationship Management =====

    /**
     * Get a person's primary campus
     */
    async getPrimaryCampus(personId: string) {
        const person = await this.getById(personId, { include: ['primary_campus'] });
        const campusData = person.primary_campus;

        // campusData can be CampusResource, ResourceIdentifier, or null
        if (!campusData || Array.isArray(campusData)) {
            return null;
        }

        // Check if it's a ResourceIdentifier (has id but might not have full attributes)
        if ('id' in campusData && 'type' in campusData) {
            // Get the full campus resource
            return this.getSingle<Types.CampusResource>(`/campuses/${campusData.id}`);
        }

        // If it's already a full resource, return it
        return campusData;
    }

    /**
     * Set a person's primary campus
     */
    async setPrimaryCampus(personId: string, campusId: string) {
        return this.updateResource<Types.PersonResource>(`/people/${personId}`, { primary_campus_id: campusId });
    }

    /**
     * Remove a person's primary campus
     */
    async removePrimaryCampus(personId: string) {
        return this.updateResource<Types.PersonResource>(`/people/${personId}`, { primary_campus_id: null });
    }

    /**
     * Get a person's household
     */
    async getHousehold(personId: string) {
        const person = await this.getById(personId, { include: ['household'] });
        const householdData = person.household;

        // householdData can be HouseholdResource, ResourceIdentifier, or null
        if (!householdData || Array.isArray(householdData)) {
            return null;
        }

        // Check if it's a ResourceIdentifier (has id but might not have full attributes)
        if ('id' in householdData && 'type' in householdData) {
            // Get the full household resource
            return this.getSingle<Types.HouseholdResource>(`/households/${householdData.id}`);
        }

        // If it's already a full resource, return it
        return householdData
    }

    /**
     * Set a person's household
     * Uses the household_memberships endpoint to create a membership record
     */
    async setHousehold(personId: string, householdId: string) {
        await this.createResource(
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
            }
        );

        // Return the updated person
        return this.getById(personId);
    }

    /**
     * Remove a person from their household
     * Uses the household_memberships endpoint to delete the membership record
     */
    async removeFromHousehold(personId: string) {
        type HouseholdMembershipResource = ResourceObject<'HouseholdMembership', Attributes, { household?: Relationship; person?: Relationship }>;
        type HouseholdMembershipResponse = { data: HouseholdMembershipResource[] };

        const res = await this.httpClient.request<HouseholdMembershipResponse>({
            method: 'GET',
            endpoint: `/people/${personId}/household_memberships`,
        });
        if (!res.data?.data?.length) throw new Error(`Person ${personId} is not in a household`);

        const membership = res.data.data[0];
        const membershipId = membership.id;
        const householdId = await this.getHouseholdIdFromMembership(personId, membershipId, membership);
        await this.deleteResource(`/households/${householdId}/household_memberships/${membershipId}`);
        return this.getById(personId);
    }

    private getHouseholdIdFromRelationship(
        householdData: Relationship['data']
    ): string | undefined {
        if (!householdData || Array.isArray(householdData) || typeof householdData !== 'object') return undefined;
        return getStringId(householdData);
    }

    private async fetchHouseholdIdFromMembershipEndpoint(
        personId: string,
        membershipId: string
    ): Promise<string> {
        type MembershipWithHousehold = { id: string; household?: Types.HouseholdResource | null };
        const details = await this.getSingle<MembershipWithHousehold>(
            `/people/${personId}/household_memberships/${membershipId}`,
            { include: ['household'] }
        );
        const householdId = details.household?.id;
        if (!householdId) throw new Error(`Could not determine household ID for membership ${membershipId}`);
        return householdId;
    }

    private async getHouseholdIdFromMembership(
        personId: string,
        membershipId: string,
        membership: ResourceObject<'HouseholdMembership', Attributes, { household?: Relationship; person?: Relationship }>
    ): Promise<string> {
        const fromRel = this.getHouseholdIdFromRelationship(membership.relationships?.household?.data);
        if (fromRel) return fromRel;
        return this.fetchHouseholdIdFromMembershipEndpoint(personId, membershipId);
    }

    /**
     * Get people in a specific household (GET /households/:id/people).
     * Returns a single page; use per_page and page for pagination.
     */
    async getHouseholdMembers(householdId: string, options?: PersonGetPageOptions) {
        return this.getList<Types.PersonResource, PersonGetPageOptions>(`/households/${householdId}/people`, options);
    }

    /**
     * Get people by campus
     * Note: This uses getList() internally, so it returns a single page. Use getAll() with where[primary_campus_id] for all pages.
     */
    async getByCampus(campusId: string, options?: PersonGetPageOptions) {
        return this.getList<Types.PersonResource, PersonGetPageOptions>('/people', {
            ...(options ?? {}),
            where: { ...options?.where, primary_campus_id: campusId },
        });
    }

    /**
     * Get a person's workflow cards
     */
    async getWorkflowCards(personId: string, options?: WorkflowCardGetPageOptions) {
        return this.getList<Types.WorkflowCardResource>(`/people/${personId}/workflow_cards`, options);
    }

    /**
     * Get a person's notes
     */
    async getNotes(personId: string, options?: NoteGetPageOptions) {
        return this.getList<Types.NoteResource>(`/people/${personId}/notes`, options);
    }

    /**
     * Get a person's field data
     */
    async getFieldData(personId: string, options?: FieldDataGetPageOptions) {
        return this.getList<Types.FieldDatumResource, FieldDataGetPageOptions>(`/people/${personId}/field_data`, options);
    }

    /**
     * Get a person's social profiles
     */
    async getSocialProfiles(personId: string, options?: SocialProfileGetPageOptions) {
        return this.getList<Types.SocialProfileResource>(`/people/${personId}/social_profiles`, options);
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
     *   first_name: 'John',
     *   last_name: 'Doe',
     *   email: 'john@gmail.com',
     *   phone: '+1234567890'
     * });
     * 
     * // Find and add missing contact info if match found
     * const person = await client.people.findOrCreate({
     *   first_name: 'Jane',
     *   last_name: 'Smith',
     *   email: 'jane@gmail.com',
     *   phone: '+1987654321',
     *   addMissingContactInfo: true  // Will add phone if person only has email
     * });
     * ```
     * 
     * @returns The found or newly created person
     */
    async findOrCreate(options: PersonMatchOptions) {
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
        per_page?: number;
        page?: number;
    }) {
        const where = this.buildSearchWhere(criteria);
        const hasPagination = criteria.per_page !== undefined || criteria.page !== undefined;
        if (hasPagination) {
            return this.getPage({ where, per_page: criteria.per_page, page: criteria.page });
        }
        return this.getAll({ where });
    }

    private buildSearchWhere(criteria: { name?: string; email?: string; phone?: string; status?: string }): PersonWhereClause {
        const where: PersonWhereClause = {};
        if (criteria.email) where.search_name_or_email_or_phone_number = criteria.email;
        else if (criteria.phone) where.search_name_or_email_or_phone_number = criteria.phone;
        else if (criteria.name) where.search_name = criteria.name;
        if (criteria.status) where.status = criteria.status;
        return where;
    }

    // Contact methods

    /**
     * Get person's emails
     */
    async getEmails(personId: string) {
        return this.getList<Types.EmailResource>(`/people/${personId}/emails`);
    }

    /**
     * Add an email to a person
     */
    async addEmail(personId: string, data: Types.EmailAttributes) {
        return this.createResource<Types.EmailResource>(`/people/${personId}/emails`, data);
    }

    /**
     * Update a person's email
     */
    async updateEmail(personId: string, emailId: string, data: Partial<Types.EmailAttributes>) {
        return this.updateResource<Types.EmailResource>(`/people/${personId}/emails/${emailId}`, data);
    }

    /**
     * Delete a person's email
     */
    async deleteEmail(personId: string, emailId: string) {
        return this.deleteResource(`/people/${personId}/emails/${emailId}`);
    }

    /**
     * Get person's phone numbers
     */
    async getPhoneNumbers(personId: string) {
        return this.getList<Types.PhoneNumberResource>(`/people/${personId}/phone_numbers`);
    }

    /**
     * Add a phone number to a person
     */
    async addPhoneNumber(personId: string, data: Types.PhoneNumberAttributes) {
        return this.createResource<Types.PhoneNumberResource>(`/people/${personId}/phone_numbers`, data);
    }

    /**
     * Update a person's phone number
     */
    async updatePhoneNumber(personId: string, phoneId: string, data: Partial<Types.PhoneNumberAttributes>) {
        return this.updateResource<Types.PhoneNumberResource>(`/people/${personId}/phone_numbers/${phoneId}`, data);
    }

    /**
     * Delete a person's phone number
     */
    async deletePhoneNumber(personId: string, phoneId: string) {
        return this.deleteResource(`/people/${personId}/phone_numbers/${phoneId}`);
    }

    /**
     * Get person's addresses
     */
    async getAddresses(personId: string) {
        return this.getList<Types.AddressResource>(`/people/${personId}/addresses`);
    }

    /**
     * Add an address to a person
     */
    async addAddress(personId: string, data: Types.AddressAttributes) {
        return this.createResource<Types.AddressResource>(`/people/${personId}/addresses`, data);
    }

    /**
     * Update a person's address
     */
    async updateAddress(personId: string, addressId: string, data: Partial<Types.AddressAttributes>) {
        return this.updateResource<Types.AddressResource>(`/people/${personId}/addresses/${addressId}`, data);
    }

    /**
     * Delete a person's address
     */
    async deleteAddress(personId: string, addressId: string) {
        return this.deleteResource(`/people/${personId}/addresses/${addressId}`);
    }


    /**
     * Add a social profile to a person
     */
    async addSocialProfile(personId: string, data: Types.SocialProfileAttributes) {
        return this.createResource<Types.SocialProfileResource>(`/people/${personId}/social_profiles`, data);
    }

    /**
     * Update a person's social profile
     */
    async updateSocialProfile(personId: string, profileId: string, data: Partial<Types.SocialProfileAttributes>) {
        return this.updateResource<Types.SocialProfileResource>(`/people/${personId}/social_profiles/${profileId}`, data);
    }

    /**
     * Delete a person's social profile
     */
    async deleteSocialProfile(personId: string, profileId: string) {
        return this.deleteResource(`/people/${personId}/social_profiles/${profileId}`);
    }

    private async addContactsToResult(
        personId: string,
        contacts: { email?: Types.EmailAttributes; phone?: Types.PhoneNumberAttributes; address?: Types.AddressAttributes },
        result: { person: Types.PersonResource; email?: Types.EmailResource; phone?: Types.PhoneNumberResource; address?: Types.AddressResource }
    ) {
        if (contacts.email) result.email = singleFromCreateResponse(await this.addEmail(personId, contacts.email));
        if (contacts.phone) result.phone = singleFromCreateResponse(await this.addPhoneNumber(personId, contacts.phone));
        if (contacts.address) result.address = singleFromCreateResponse(await this.addAddress(personId, contacts.address));
    }

    /**
     * Create a person with contact information
     */
    async createWithContacts(
        personData: Partial<Types.PersonAttributes>,
        contacts?: {
            email?: Types.EmailAttributes;
            phone?: Types.PhoneNumberAttributes;
            address?: Types.AddressAttributes;
        }
    ) {
        const createRes = await this.create(personData);
        const person = singleFromCreateResponse(createRes);
        if (!person) throw new Error('Create person did not return a resource');
        const result: {
            person: Types.PersonResource;
            email?: Types.EmailResource;
            phone?: Types.PhoneNumberResource;
            address?: Types.AddressResource;
        } = { person };
        if (contacts) await this.addContactsToResult(person.id, contacts, result);
        return result;
    }
}

/** Minimal deps for PersonMatcher/MatchScorer so tests can pass a partial mock without casting. */
export type PersonMatcherDeps = Pick<
    PeopleModule,
    'search' | 'getEmails' | 'getPhoneNumbers' | 'create' | 'addEmail' | 'addPhoneNumber' | 'setPrimaryCampus' | 'getById'
>;
