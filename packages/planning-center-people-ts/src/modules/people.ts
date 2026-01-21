/**
 * v2.0.0 People Module
 */

import { BaseModule } from '@rachelallyson/planning-center-base-ts';
import type { 
    PcoHttpClient, 
    PaginationHelper, 
    PcoEventEmitter,
    PaginationOptions,
    PaginationResult
} from '@rachelallyson/planning-center-base-ts';
import type {
    PersonResource,
    PersonAttributes,
    EmailResource,
    EmailAttributes,
    PhoneNumberResource,
    PhoneNumberAttributes,
    AddressResource,
    AddressAttributes,
    SocialProfileResource,
    SocialProfileAttributes,
    CampusResource,
    HouseholdResource
} from '../types';
import { PersonMatcher } from '../matching/matcher';

export interface PeopleListOptions {
    where?: Record<string, any>;
    include?: string[];
    perPage?: number;
    page?: number;
}

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
        eventEmitter: PcoEventEmitter
    ) {
        super(httpClient, paginationHelper, eventEmitter);
        this.personMatcher = new PersonMatcher(this);
    }

    /**
     * Get all people with optional filtering
     */
    async getAll(options: PeopleListOptions = {}): Promise<{ data: PersonResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<PersonResource>('/people', params);
    }

    /**
     * Get all people across all pages
     */
    async getAllPagesPaginated(options: PeopleListOptions = {}, paginationOptions?: PaginationOptions): Promise<PaginationResult<PersonResource>> {
        const params: Record<string, any> = {};

        if (options.where) {
            Object.entries(options.where).forEach(([key, value]) => {
                params[`where[${key}]`] = value;
            });
        }

        if (options.include) {
            params.include = options.include.join(',');
        }

        return this.getAllPages<PersonResource>('/people', params, paginationOptions);
    }

    /**
     * Get a single person by ID
     */
    async getById(id: string, include?: string[]): Promise<PersonResource> {
        const params: Record<string, any> = {};
        if (include) {
            params.include = include.join(',');
        }

        return this.getSingle<PersonResource>(`/people/${id}`, params);
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
     * @example
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
    ): Promise<boolean> {
        const timeout = options?.timeout ?? 30000;
        
        const verificationPromise = this.getById(personId)
            .then(() => true)
            .catch((error: any) => {
                // 404 means person doesn't exist (merged or deleted)
                if (error?.status === 404 || error?.response?.status === 404) {
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
     * Create a new person
     */
    async create(data: PersonCreateOptions): Promise<PersonResource> {
        return this.createResource<PersonResource>('/people', data);
    }

    /**
     * Update a person
     */
    async update(id: string, data: Partial<PersonCreateOptions>): Promise<PersonResource> {
        return this.updateResource<PersonResource>(`/people/${id}`, data);
    }

    /**
     * Delete a person
     */
    async delete(id: string): Promise<void> {
        return this.deleteResource(`/people/${id}`);
    }

    // ===== Relationship Management =====

    /**
     * Get a person's primary campus
     */
    async getPrimaryCampus(personId: string): Promise<CampusResource | null> {
        const person = await this.getById(personId, ['primary_campus']);
        const campusData = person.relationships?.primary_campus?.data;
        
        if (!campusData || Array.isArray(campusData) || !campusData.id) {
            return null;
        }

        // Get the full campus resource
        return this.httpClient.request<{ data: CampusResource }>({
            method: 'GET',
            endpoint: `/campuses/${campusData.id}`
        }).then(response => response.data.data);
    }

    /**
     * Set a person's primary campus
     */
    async setPrimaryCampus(personId: string, campusId: string): Promise<PersonResource> {
        return this.httpClient.request<{ data: PersonResource }>({
            method: 'PATCH',
            endpoint: `/people/${personId}`,
            data: {
                data: {
                    type: 'Person',
                    id: personId,
                    attributes: {
                        primary_campus_id: campusId
                    }
                }
            }
        }).then(response => response.data.data);
    }

    /**
     * Remove a person's primary campus
     */
    async removePrimaryCampus(personId: string): Promise<PersonResource> {
        return this.httpClient.request<{ data: PersonResource }>({
            method: 'PATCH',
            endpoint: `/people/${personId}`,
            data: {
                data: {
                    type: 'Person',
                    id: personId,
                    attributes: {
                        primary_campus_id: null
                    }
                }
            }
        }).then(response => response.data.data);
    }

    /**
     * Get a person's household
     */
    async getHousehold(personId: string): Promise<HouseholdResource | null> {
        const person = await this.getById(personId, ['household']);
        const householdData = person.relationships?.household?.data;
        
        if (!householdData || Array.isArray(householdData) || !householdData.id) {
            return null;
        }

        // Get the full household resource
        return this.httpClient.request<{ data: HouseholdResource }>({
            method: 'GET',
            endpoint: `/households/${householdData.id}`
        }).then(response => response.data.data);
    }

    /**
     * Set a person's household
     */
    async setHousehold(personId: string, householdId: string): Promise<PersonResource> {
        return this.httpClient.request<{ data: PersonResource }>({
            method: 'PATCH',
            endpoint: `/people/${personId}`,
            data: {
                data: {
                    type: 'Person',
                    id: personId,
                    attributes: {
                        household_id: householdId
                    }
                }
            }
        }).then(response => response.data.data);
    }

    /**
     * Remove a person from their household
     */
    async removeFromHousehold(personId: string): Promise<PersonResource> {
        return this.httpClient.request<{ data: PersonResource }>({
            method: 'PATCH',
            endpoint: `/people/${personId}`,
            data: {
                data: {
                    type: 'Person',
                    id: personId,
                    attributes: {
                        household_id: null
                    }
                }
            }
        }).then(response => response.data.data);
    }

    /**
     * Get all people in a specific household
     */
    async getHouseholdMembers(householdId: string, options: PeopleListOptions = {}): Promise<{ data: PersonResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {
            'where[household_id]': householdId
        };

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<PersonResource>('/people', params);
    }

    /**
     * Get people by campus
     */
    async getByCampus(campusId: string, options: PeopleListOptions = {}): Promise<{ data: PersonResource[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {
            'where[primary_campus_id]': campusId
        };

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList<PersonResource>('/people', params);
    }

    /**
     * Get a person's workflow cards
     */
    async getWorkflowCards(personId: string, options: {
        include?: string[];
        perPage?: number;
        page?: number;
    } = {}): Promise<{ data: any[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList(`/people/${personId}/workflow_cards`, params);
    }

    /**
     * Get a person's notes
     */
    async getNotes(personId: string, options: {
        include?: string[];
        perPage?: number;
        page?: number;
    } = {}): Promise<{ data: any[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList(`/people/${personId}/notes`, params);
    }

    /**
     * Get a person's field data
     */
    async getFieldData(personId: string, options: {
        include?: string[];
        perPage?: number;
        page?: number;
    } = {}): Promise<{ data: any[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList(`/people/${personId}/field_data`, params);
    }

    /**
     * Get a person's social profiles
     */
    async getSocialProfiles(personId: string, options: {
        include?: string[];
        perPage?: number;
        page?: number;
    } = {}): Promise<{ data: any[]; meta?: any; links?: any }> {
        const params: Record<string, any> = {};

        if (options.include) {
            params.include = options.include.join(',');
        }

        if (options.perPage) {
            params.per_page = options.perPage;
        }

        if (options.page) {
            params.page = options.page;
        }

        return this.getList(`/people/${personId}/social_profiles`, params);
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
     * @example
     * ```typescript
     * // Basic find or create
     * const person = await client.people.findOrCreate({
     *   firstName: 'John',
     *   lastName: 'Doe',
     *   email: 'john@example.com',
     *   phone: '+1234567890'
     * });
     * 
     * // Find and add missing contact info if match found
     * const person = await client.people.findOrCreate({
     *   firstName: 'Jane',
     *   lastName: 'Smith',
     *   email: 'jane@example.com',
     *   phone: '+1987654321',
     *   addMissingContactInfo: true  // Will add phone if person only has email
     * });
     * ```
     * 
     * @returns The found or newly created person
     */
    async findOrCreate(options: PersonMatchOptions): Promise<PersonResource> {
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
    }): Promise<{ data: PersonResource[]; meta?: any; links?: any }> {
        const where: Record<string, any> = {};

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

        return this.getAll({
            where,
            perPage: criteria.perPage || 25,
        });
    }

    // Contact methods

    /**
     * Get person's emails
     */
    async getEmails(personId: string): Promise<{ data: EmailResource[]; meta?: any; links?: any }> {
        return this.getList<EmailResource>(`/people/${personId}/emails`);
    }

    /**
     * Add an email to a person
     */
    async addEmail(personId: string, data: EmailAttributes): Promise<EmailResource> {
        return this.createResource<EmailResource>(`/people/${personId}/emails`, data);
    }

    /**
     * Update a person's email
     */
    async updateEmail(personId: string, emailId: string, data: Partial<EmailAttributes>): Promise<EmailResource> {
        return this.updateResource<EmailResource>(`/people/${personId}/emails/${emailId}`, data);
    }

    /**
     * Delete a person's email
     */
    async deleteEmail(personId: string, emailId: string): Promise<void> {
        return this.deleteResource(`/people/${personId}/emails/${emailId}`);
    }

    /**
     * Get person's phone numbers
     */
    async getPhoneNumbers(personId: string): Promise<{ data: PhoneNumberResource[]; meta?: any; links?: any }> {
        return this.getList<PhoneNumberResource>(`/people/${personId}/phone_numbers`);
    }

    /**
     * Add a phone number to a person
     */
    async addPhoneNumber(personId: string, data: PhoneNumberAttributes): Promise<PhoneNumberResource> {
        return this.createResource<PhoneNumberResource>(`/people/${personId}/phone_numbers`, data);
    }

    /**
     * Update a person's phone number
     */
    async updatePhoneNumber(personId: string, phoneId: string, data: Partial<PhoneNumberAttributes>): Promise<PhoneNumberResource> {
        return this.updateResource<PhoneNumberResource>(`/people/${personId}/phone_numbers/${phoneId}`, data);
    }

    /**
     * Delete a person's phone number
     */
    async deletePhoneNumber(personId: string, phoneId: string): Promise<void> {
        return this.deleteResource(`/people/${personId}/phone_numbers/${phoneId}`);
    }

    /**
     * Get person's addresses
     */
    async getAddresses(personId: string): Promise<{ data: AddressResource[]; meta?: any; links?: any }> {
        return this.getList<AddressResource>(`/people/${personId}/addresses`);
    }

    /**
     * Add an address to a person
     */
    async addAddress(personId: string, data: AddressAttributes): Promise<AddressResource> {
        return this.createResource<AddressResource>(`/people/${personId}/addresses`, data);
    }

    /**
     * Update a person's address
     */
    async updateAddress(personId: string, addressId: string, data: Partial<AddressAttributes>): Promise<AddressResource> {
        return this.updateResource<AddressResource>(`/people/${personId}/addresses/${addressId}`, data);
    }

    /**
     * Delete a person's address
     */
    async deleteAddress(personId: string, addressId: string): Promise<void> {
        return this.deleteResource(`/people/${personId}/addresses/${addressId}`);
    }


    /**
     * Add a social profile to a person
     */
    async addSocialProfile(personId: string, data: SocialProfileAttributes): Promise<SocialProfileResource> {
        return this.createResource<SocialProfileResource>(`/people/${personId}/social_profiles`, data);
    }

    /**
     * Update a person's social profile
     */
    async updateSocialProfile(personId: string, profileId: string, data: Partial<SocialProfileAttributes>): Promise<SocialProfileResource> {
        return this.updateResource<SocialProfileResource>(`/people/${personId}/social_profiles/${profileId}`, data);
    }

    /**
     * Delete a person's social profile
     */
    async deleteSocialProfile(personId: string, profileId: string): Promise<void> {
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
        const person = await this.create(personData);
        const result: any = { person };

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
