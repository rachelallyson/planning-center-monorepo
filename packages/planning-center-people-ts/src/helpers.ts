import { createDebugLogger } from '@rachelallyson/planning-center-base-ts';
import type { PcoDebugOptions } from '@rachelallyson/planning-center-base-ts';
import type { PcoClient } from './client';
import type { ErrorContext } from './error-handling';

type ConfigWithDebug = { debug?: boolean | PcoDebugOptions } | null | undefined;

/** Log to debug stream when client has debug enabled; no-op otherwise */
function debugLogIfEnabled(client: PcoClient, message: string, data?: unknown): void {
    const config: ConfigWithDebug =
        'getConfig' in client && typeof (client as { getConfig: () => ConfigWithDebug }).getConfig === 'function'
            ? (client as { getConfig: () => ConfigWithDebug }).getConfig()
            : undefined;
    const logger = createDebugLogger(config);
    if (logger.enabled) logger.log(message, data);
}
import type { ResourceObject, ResourceIdentifier } from './types/json-api';
import { mapIncludedToRelationships as baseMapIncludedToRelationships } from '@rachelallyson/planning-center-base-ts';
import type { PersonWhereClause } from './types/api-options';
import type {
    PersonAttributes,
    PersonResource,
    EmailAttributes,
    PhoneNumberAttributes,
    AddressAttributes,
    WorkflowCardNoteAttributes,
    PeopleList,
    PersonSingle,
    EmailSingle,
    PhoneNumberSingle,
    AddressSingle,
    WorkflowCardSingle,
    WorkflowCardNoteSingle,
    ListsList,
    ListCategoriesList,
    OrganizationSingle,
    HouseholdsList,
    EmailResource,
    PhoneNumberResource,
    AddressResource,
    FieldDatumResource,
    WorkflowCardResource,
    NoteResource,
    EmailsList,
    PhoneNumbersList,
    AddressesList,
    OrganizationResource,
    WorkflowCardNoteResource,
    Meta,
    TopLevelLinks,
    ListResource,
    HouseholdResource,
} from './types';
import type { PersonCreateOptions } from './modules/people';

/**
 * Calculate age from birthdate string
 */
export function calculateAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

/**
 * Calculate age from birthdate string, handling invalid dates
 */
export function calculateAgeSafe(birthdate: string | undefined): number | null {
    if (!birthdate) return null;

    try {
        const birth = new Date(birthdate);
        if (isNaN(birth.getTime())) return null;

        return calculateAge(birthdate);
    } catch {
        return null;
    }
}

/**
 * Check if a person is an adult (18+ years old)
 */
export function isAdult(birthdate: string | undefined): boolean {
    const age = calculateAgeSafe(birthdate);
    return age !== null && age >= 18;
}

/**
 * Check if a person is a child (under 18 years old)
 */
export function isChild(birthdate: string | undefined): boolean {
    const age = calculateAgeSafe(birthdate);
    return age !== null && age < 18;
}

/**
 * Check if a person's age matches the given criteria
 */
export function matchesAgeCriteria(
    birthdate: string | undefined,
    criteria: {
        agePreference?: 'adults' | 'children' | 'any';
        minAge?: number;
        maxAge?: number;
        birthYear?: number;
        agePreferenceLenient?: boolean;
    }
): boolean {
    const age = calculateAgeSafe(birthdate);

    // If no birthdate, match based on lenient setting
    if (age === null) {
        if (criteria.agePreferenceLenient) {
            // Lenient mode: include profiles without birthdates regardless of agePreference
            return true;
        }
        // Strict mode (default): only match if preference is 'any'
        return criteria.agePreference === 'any' || criteria.agePreference === undefined;
    }

    // Check age preference
    if (criteria.agePreference === 'adults' && age < 18) return false;
    if (criteria.agePreference === 'children' && age >= 18) return false;

    // Check age range
    if (criteria.minAge !== undefined && age < criteria.minAge) return false;
    if (criteria.maxAge !== undefined && age > criteria.maxAge) return false;

    // Check birth year
    if (criteria.birthYear !== undefined) {
        const birthYear = new Date(birthdate!).getFullYear();
        if (birthYear !== criteria.birthYear) return false;
    }

    return true;
}

/**
 * Calculate birth year from age
 */
export function calculateBirthYearFromAge(age: number): number {
    const currentYear = new Date().getFullYear();
    return currentYear - age;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Normalize email address (lowercase and trim)
 */
export function normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

/**
 * Validate phone number format (basic validation)
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{6,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Normalize phone number to +1XXXXXXXXXX format
 * - 10 digits: adds +1 prefix
 * - 11 digits starting with 1: adds + prefix
 * - Other lengths: adds + prefix to all digits
 */
export function normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+${digits}`;
    }
    return `+${digits}`;
}

// ===== Contact Validation Helpers =====

/**
 * Extract domain from email address
 */
export function extractEmailDomain(email: string): string {
    const normalized = normalizeEmail(email);
    const atIndex = normalized.indexOf('@');
    return atIndex >= 0 ? normalized.substring(atIndex + 1) : '';
}

/**
 * Common email domain aliases (e.g., gmail.com and googlemail.com are the same)
 */
const EMAIL_DOMAIN_ALIASES: Record<string, string> = {
    'googlemail.com': 'gmail.com',
    'google.com': 'gmail.com',
};

/**
 * Normalize email domain to handle common aliases
 */
function normalizeEmailDomain(domain: string): string {
    const lowerDomain = domain.toLowerCase();
    return EMAIL_DOMAIN_ALIASES[lowerDomain] || lowerDomain;
}

/**
 * Check if two email domains match or are similar
 * Handles:
 * - Exact domain matches
 * - Common aliases (gmail.com vs googlemail.com)
 * - Prefix matching for similar domains (first 3+ characters)
 * 
 * @param email1 - First email address
 * @param email2 - Second email address
 * @returns True if domains match or are similar
 */
export function emailDomainsMatch(email1: string, email2: string): boolean {
    const domain1 = normalizeEmailDomain(extractEmailDomain(email1));
    const domain2 = normalizeEmailDomain(extractEmailDomain(email2));
    
    if (!domain1 || !domain2) {
        return false;
    }
    
    // Exact match after normalization
    if (domain1 === domain2) {
        return true;
    }
    
    // Check if domains share a common prefix (at least 3 characters)
    // This helps catch typos like "gmial.com" vs "gmail.com"
    const minPrefixLength = 3;
    if (domain1.length >= minPrefixLength && domain2.length >= minPrefixLength) {
        const prefix1 = domain1.substring(0, minPrefixLength);
        const prefix2 = domain2.substring(0, minPrefixLength);
        if (prefix1 === prefix2) {
            return true;
        }
    }
    
    return false;
}

/**
 * Normalize phone number to digits only, stripping country code if present
 */
function normalizePhoneDigits(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    // Strip leading 1 for US numbers (11 digits starting with 1)
    if (digits.length === 11 && digits.startsWith('1')) {
        return digits.substring(1);
    }
    return digits;
}

/**
 * Check if two phone numbers are similar
 * Handles:
 * - Different formats (+1, 1, or just 10 digits)
 * - Country code variations
 * 
 * @param phone1 - First phone number
 * @param phone2 - Second phone number
 * @returns True if phone numbers are similar
 */
export function phoneNumbersSimilar(phone1: string, phone2: string): boolean {
    if (!phone1 || !phone2) {
        return false;
    }
    
    const normalized1 = normalizePhoneDigits(phone1);
    const normalized2 = normalizePhoneDigits(phone2);
    
    // Empty after normalization
    if (!normalized1 || !normalized2) {
        return false;
    }
    
    // Exact match after normalization
    if (normalized1 === normalized2) {
        return true;
    }
    
    // Also check raw digits (handles international numbers)
    const digits1 = phone1.replace(/\D/g, '');
    const digits2 = phone2.replace(/\D/g, '');
    
    return digits1 === digits2;
}

/**
 * Validate contact info similarity for name-based matches
 * 
 * This is useful when falling back to name-based search to ensure
 * we don't match the wrong person with the same name.
 * 
 * @param searchEmail - Email being searched for
 * @param searchPhone - Phone being searched for
 * @param personEmails - Array of email addresses from the person's profile
 * @param personPhones - Array of phone numbers from the person's profile
 * @returns Object with match results and overall validity
 */
export function validateContactSimilarity(
    searchEmail: string | undefined,
    searchPhone: string | undefined,
    personEmails: string[],
    personPhones: string[]
): { emailMatch: boolean; phoneMatch: boolean; isValid: boolean } {
    let emailMatch = false;
    let phoneMatch = false;
    
    // Check email domain match
    if (searchEmail) {
        emailMatch = personEmails.some(personEmail => 
            emailDomainsMatch(searchEmail, personEmail)
        );
    }
    
    // Check phone similarity
    if (searchPhone) {
        phoneMatch = personPhones.some(personPhone => 
            phoneNumbersSimilar(searchPhone, personPhone)
        );
    }
    
    // Valid if either email domain matches or phone is similar
    // (or if we didn't have search criteria to check)
    const hasSearchCriteria = !!(searchEmail || searchPhone);
    const isValid = !hasSearchCriteria || emailMatch || phoneMatch;
    
    return { emailMatch, phoneMatch, isValid };
}

// ===== Person ID Trust Calculation =====

/**
 * Default trust window for person IDs (1 hour in milliseconds)
 * If a personId was saved within this time, it can be trusted without verification
 */
export const DEFAULT_TRUST_WINDOW = 60 * 60 * 1000; // 1 hour

/**
 * Result of trust calculation for a person ID
 */
export interface TrustResult {
    /** Whether the person ID should be trusted without verification */
    shouldTrust: boolean;
    /** Age of the person ID in milliseconds (null if no timestamp) */
    age: number | null;
    /** Human-readable reason for the trust decision */
    reason: string;
}

/**
 * Calculate whether a person ID can be trusted based on when it was created/verified
 * 
 * This is useful for caching person IDs to avoid unnecessary API calls.
 * PCO takes 15-30 minutes to index new contacts, so recently created person IDs
 * should be trusted without re-verification to avoid race conditions.
 * 
 * @param createdAt - ISO timestamp when the person ID was created/saved
 * @param trustWindow - Trust window in milliseconds (default: 1 hour)
 * @returns Object with trust decision, age, and reason
 * 
 * @gmail.com
 * ```typescript
 * const trust = calculateTrust(pcoInfo.personIdCreatedAt);
 * if (trust.shouldTrust) {
 *   // Use cached personId without verification
 *   return cachedPersonId;
 * } else {
 *   // Verify personId still exists in PCO
 *   await client.people.getById(cachedPersonId);
 * }
 * ```
 */
export function calculateTrust(
    createdAt: string | undefined,
    trustWindow: number = DEFAULT_TRUST_WINDOW
): TrustResult {
    if (!createdAt) {
        return {
            shouldTrust: false,
            age: null,
            reason: 'No timestamp (legacy data or never saved)',
        };
    }
    
    const createdDate = new Date(createdAt);
    if (isNaN(createdDate.getTime())) {
        return {
            shouldTrust: false,
            age: null,
            reason: 'Invalid timestamp format',
        };
    }
    
    const age = Date.now() - createdDate.getTime();
    
    if (age < 0) {
        return {
            shouldTrust: false,
            age,
            reason: 'Timestamp is in the future (clock skew)',
        };
    }
    
    if (age < trustWindow) {
        const ageSeconds = Math.round(age / 1000);
        const trustWindowMinutes = Math.round(trustWindow / 1000 / 60);
        return {
            shouldTrust: true,
            age,
            reason: `Fresh personId (${ageSeconds}s old, within ${trustWindowMinutes}min trust window)`,
        };
    }
    
    const ageMinutes = Math.round(age / 1000 / 60);
    return {
        shouldTrust: false,
        age,
        reason: `Old personId (${ageMinutes}min old, needs verification)`,
    };
}

/**
 * Format person name from attributes
 */
export function formatPersonName(person: { first_name?: string; last_name?: string; nickname?: string }): string {
    const firstName = person.nickname || person.first_name || '';
    const lastName = person.last_name || '';

    if (firstName && lastName) {
        return `${firstName} ${lastName}`;
    } else if (firstName) {
        return firstName;
    } else if (lastName) {
        return lastName;
    }

    return 'Unknown';
}

/**
 * Format date string in various formats
 */
export function formatDate(dateString: string, format: 'short' | 'long' | 'iso' = 'short'): string {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }

    switch (format) {
        case 'short':
            return date.toLocaleDateString();
        case 'long':
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        case 'iso':
            return date.toISOString().split('T')[0];
        default:
            return date.toLocaleDateString();
    }
}

/**
 * Validate person data
 */
export function validatePersonData(data: Partial<PersonAttributes>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.email && typeof data.email === 'string' && !isValidEmail(data.email)) {
        errors.push('Invalid email format');
    }

    if (data.phone && typeof data.phone === 'string' && !isValidPhone(data.phone)) {
        errors.push('Invalid phone format');
    }

    if (data.birthdate) {
        const birthDate = new Date(data.birthdate);
        if (isNaN(birthDate.getTime())) {
            errors.push('Invalid birthdate format');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Get primary contact information for a person
 */
export async function getPrimaryContact(
    client: PcoClient,
    personId: string
): Promise<{
    email?: string;
    phone?: string;
    address?: string;
}> {
    debugLogIfEnabled(client, 'helpers  getPrimaryContact', { personId });
    const [emails, phones, addresses] = await Promise.all([
        client.people.getEmails(personId),
        client.people.getPhoneNumbers(personId),
        client.people.getAddresses(personId)
    ]);

    const primaryEmail = emails.data.find((e) => e.primary);
    const primaryPhone = phones.data.find((p) => p.primary);
    const primaryAddress = addresses.data.find((a) => a.primary);

    const addressValue = primaryAddress?.street_line_1 ?? addresses.data[0]?.street_line_1;
    const addressString = typeof addressValue === 'string' ? addressValue : undefined;

    return {
        email: primaryEmail?.address ?? emails.data[0]?.address,
        phone: primaryPhone?.number ?? phones.data[0]?.number,
        address: addressString
    };
}

/**
 * Create a person with contact information
 */
export async function createPersonWithContact(
    client: PcoClient,
    personData: Partial<PersonAttributes>,
    contactData?: {
        email?: Partial<EmailAttributes>;
        phone?: Partial<PhoneNumberAttributes>;
        address?: Partial<AddressAttributes>;
    }
): Promise<{
    person: PersonResource;
    email?: EmailResource;
    phone?: PhoneNumberResource;
    address?: AddressResource;
}> {
    debugLogIfEnabled(client, 'helpers  createPersonWithContact', { firstName: personData.first_name, lastName: personData.last_name });
    const createData: Partial<PersonCreateOptions> = {};
    if (personData.first_name) createData.firstName = personData.first_name;
    if (personData.last_name) createData.lastName = personData.last_name;
    if (personData.nickname !== null && personData.nickname !== undefined) {
        createData.nickname = personData.nickname;
    }

    const person = await client.people.create(createData);

    const results: {
        person: PersonResource;
        email?: EmailResource;
        phone?: PhoneNumberResource;
        address?: AddressResource;
    } = { person };

    if (contactData?.email) {
        // Ensure required fields are present
        if (contactData.email.address && contactData.email.location) {
            results.email = await client.people.addEmail(person.id, {
                address: contactData.email.address,
                location: contactData.email.location,
                primary: contactData.email.primary,
            });
        }
    }

    if (contactData?.phone) {
        // Ensure required fields are present
        if (contactData.phone.number && contactData.phone.location) {
            results.phone = await client.people.addPhoneNumber(person.id, {
                number: contactData.phone.number,
                location: contactData.phone.location,
                primary: contactData.phone.primary,
            });
        }
    }

    if (contactData?.address) {
        results.address = await client.people.addAddress(person.id, contactData.address);
    }

    return results;
}

/**
 * Search people by multiple criteria
 */
export async function searchPeople(
    client: PcoClient,
    criteria: {
        status?: string;
        name?: string;
        email?: string;
        perPage?: number;
        page?: number;
    }
): Promise<PeopleList> {
    debugLogIfEnabled(client, 'helpers  searchPeople', { criteria });
    const where: PersonWhereClause = {};

    if (criteria.status) {
        where.status = criteria.status;
    }

    // Use flexible search when we have email, otherwise use specific name search
    if (criteria.email) {
        where.search_name_or_email_or_phone_number = criteria.email;
    } else if (criteria.name) {
        where.search_name = criteria.name;
    }

    // If pagination options are provided, use getPage instead of getAll
    if (criteria.perPage !== undefined ||  criteria.page !== undefined) {
        const result = await client.people.getPage({
            where,
            perPage: criteria.perPage,
            page: criteria.page,
        });
        return result as PeopleList;
    }

    const result = await client.people.getAll({ where });
    return result as PeopleList;
}

/**
 * Get people by household
 */
export async function getPeopleByHousehold(
    client: PcoClient,
    householdId: string
) {
    debugLogIfEnabled(client, 'helpers  getPeopleByHousehold', { householdId });
    const result = await client.people.getAll({
        include: ['households']
    });
    // Filter by household_id manually since it's not in the where clause
    // getAll returns PaginationResult with FlattenedPersonResource[], so return the same type
    const filtered = {
        ...result,
        data: result.data.filter((p) => {
            const household = p.household;
            if (!household) return false;
            // household can be a HouseholdResource or ResourceIdentifier (both have id)
            if (Array.isArray(household)) {
                return household.some((h) => h && 'id' in h && h.id === householdId);
            }
            // Check if it has an id property (both ResourceIdentifier and HouseholdResource have it)
            return 'id' in household && household.id === householdId;
        })
    };
    return filtered;
}

/**
 * Get complete person profile with all related data
 */
export async function getCompletePersonProfile(
    client: PcoClient,
    personId: string
): Promise<{
    person: PersonResource;
    emails: EmailsList;
    phones: PhoneNumbersList;
    addresses: AddressesList;
    fieldData: { data: FieldDatumResource[]; meta?: Meta; links?: TopLevelLinks };
    workflowCards: { data: WorkflowCardResource[]; meta?: Meta; links?: TopLevelLinks };
}> {
    debugLogIfEnabled(client, 'helpers  getCompletePersonProfile', { personId });
    const [person, emails, phones, addresses, fieldData, workflowCards] = await Promise.all([
        client.people.getById(personId, ['households']),
        client.people.getEmails(personId),
        client.people.getPhoneNumbers(personId),
        client.people.getAddresses(personId),
        client.people.getFieldData(personId),
        client.people.getWorkflowCards(personId)
    ]);

    return {
        person,
        emails: emails as EmailsList,
        phones: phones as PhoneNumbersList,
        addresses: addresses as AddressesList,
        fieldData,
        workflowCards
    };
}

/**
 * Get organization info with statistics
 */
export async function getOrganizationInfo(
    client: PcoClient
): Promise<{
    organization: OrganizationResource | null;
    stats: {
        totalPeople: number;
        totalHouseholds: number;
        totalLists: number;
    };
}> {
    debugLogIfEnabled(client, 'helpers  getOrganizationInfo', {});
    const [people, households, lists] = await Promise.all([
        client.people.getPage({ perPage: 1 }),
        client.households.getPage({ perPage: 1 }),
        client.lists.getPage({ perPage: 1 })
    ]);

    return {
        organization: null,
        stats: {
            totalPeople: Number(people.meta?.total_count) || 0,
            totalHouseholds: Number(households.meta?.total_count) || 0,
            totalLists: Number(lists.meta?.total_count) || 0
        }
    };
}

/**
 * Get lists with their categories
 */
export async function getListsWithCategories(
    client: PcoClient
): Promise<{
    lists: ListsList;
    categories: ListCategoriesList;
}> {
    debugLogIfEnabled(client, 'helpers  getListsWithCategories', {});
    const [lists, categories] = await Promise.all([
        client.lists.getAll(),
        client.lists.getListCategories()
    ]);

    return { 
        lists: lists as ListsList, 
        categories: categories as ListCategoriesList
    };
}

/**
 * Get workflow cards with notes for a person
 */
export async function getPersonWorkflowCardsWithNotes(
    client: PcoClient,
    personId: string
): Promise<{
    workflowCards: { data: WorkflowCardResource[]; meta?: Meta; links?: TopLevelLinks };
    notes: { [cardId: string]: { data: WorkflowCardNoteResource[]; meta?: Meta; links?: TopLevelLinks } };
}> {
    debugLogIfEnabled(client, 'helpers  getPersonWorkflowCardsWithNotes', { personId });
    const workflowCards = await client.people.getWorkflowCards(personId);

    const notes: { [cardId: string]: { data: WorkflowCardNoteResource[]; meta?: Meta; links?: TopLevelLinks } } = {};

    for (const card of workflowCards.data) {
        try {
            notes[card.id] = await client.workflows.getWorkflowCardNotes(personId, card.id);
        } catch (error) {
            notes[card.id] = { data: [], meta: { total_count: 0 } };
        }
    }

    return { workflowCards, notes };
}

/**
 * Create a workflow card with a note
 */
export async function createWorkflowCardWithNote(
    client: PcoClient,
    workflowId: string,
    personId: string,
    noteData: Partial<WorkflowCardNoteAttributes>
): Promise<{
    workflowCard: WorkflowCardResource;
    note: WorkflowCardNoteResource;
}> {
    debugLogIfEnabled(client, 'helpers  createWorkflowCardWithNote', { workflowId, personId });
    const workflowCard = await client.workflows.createWorkflowCard(workflowId, personId);

    const note = await client.workflows.createWorkflowCardNote(
        personId,
        workflowCard.id,
        noteData
    );

    return { 
        workflowCard,
        note
    };
}

/**
 * Export all people data in a structured format
 */
export async function exportAllPeopleData(
    client: PcoClient,
    options: {
        includeInactive?: boolean;
        includeFieldData?: boolean;
        includeWorkflowCards?: boolean;
    } = {}
): Promise<{
    people: PersonResource[];
    households: HouseholdResource[];
    lists: ListResource[];
    organization: OrganizationResource | null;
    exportDate: string;
    totalCount: number;
}> {
    debugLogIfEnabled(client, 'helpers  exportAllPeopleData', options);
    const { includeInactive = false, includeFieldData = false, includeWorkflowCards = false } = options;

    const where: PersonWhereClause = {};
    if (!includeInactive) {
        where.status = 'active';
    }

    const include: ('households' | 'field_data')[] = ['households'];
    if (includeFieldData) {
        include.push('field_data');
    }
    // Note: workflow_cards is not a valid PersonInclude, so we'll fetch it separately if needed

    const [people, households, lists] = await Promise.all([
        client.people.getAll({ where, include }),
        client.households.getAll(),
        client.lists.getAll()
    ]);

    // Try to get organization info, but it may not be available
    let organization: OrganizationResource | null = null;
    try {
        const orgInfo = await getOrganizationInfo(client);
        organization = orgInfo.organization;
    } catch {
        // Organization endpoint may not be available
        organization = null;
    }

    return {
        people: people.data,
        households: households.data,
        lists: lists.data,
        organization,
        exportDate: new Date().toISOString(),
        totalCount: Number(people.meta?.total_count) || 0
    };
}

// ===== JSON:API Included Resources Helpers =====

/**
 * Find an included resource by type and id
 * 
 * In JSON:API, relationships contain resource identifiers like { type: 'Email', id: '456' }
 * This helper finds the full resource object from the included array.
 * 
 * @param included - Array of included resources from JSON:API response
 * @param type - Resource type to find
 * @param id - Resource id to find
 * @returns The matching resource object, or undefined if not found
 * 
 * @example
 * ```typescript
 * const person = await client.people.getPage({ include: ['emails'] });
 * // Data is flattened: person.data[0].emails is the resolved array
 * const email = person.data[0].emails?.[0];
 * console.log(email?.address); // 'john@gmail.com'
 * ```
 */
export function findIncluded<T extends ResourceObject<string, any, any> = ResourceObject<string, any, any>>(
    included: ResourceObject<string, any, any>[] | undefined,
    type: string,
    id: string
): T | undefined {
    if (!included || !Array.isArray(included)) {
        return undefined;
    }
    return included.find(
        (resource) => resource.type === type && resource.id === id
    ) as T | undefined;
}

/**
 * Resolve all resources from a relationship to their full included objects
 * 
 * Takes a relationship's data array (which contains resource identifiers)
 * and resolves them to full resource objects from the included array.
 * 
 * @param included - Array of included resources from JSON:API response
 * @param relationshipData - Relationship data array (from relationships.xxx.data)
 * @returns Array of full resource objects, or empty array if none found
 * 
 * @example
 * ```typescript
 * const person = await client.people.getPage({ include: ['emails', 'phone_numbers'] });
 * // Data is flattened: person.data[0].emails is the resolved array
 * const emails = person.data[0].emails ?? [];
 * emails.forEach(email => console.log(email.address));
 * ```
 */
export function resolveIncluded<T extends ResourceObject<string, any, any> = ResourceObject<string, any, any>>(
    included: ResourceObject<string, any, any>[] | undefined,
    relationshipData: ResourceIdentifier | ResourceIdentifier[] | null | undefined
): T[] {
    if (!included || !Array.isArray(included) || !relationshipData) {
        return [];
    }
    
    const identifiers = Array.isArray(relationshipData) ? relationshipData : [relationshipData];
    
    return identifiers
        .map((ref) => findIncluded<T>(included, ref.type, ref.id))
        .filter((resource): resource is T => resource !== undefined);
}

/**
 * Create a lookup map for included resources by type and id
 * 
 * This is more efficient than calling findIncluded() multiple times.
 * 
 * @param included - Array of included resources from JSON:API response
 * @returns Map with key format "type:id" -> resource object
 * 
 * @gmail.com
 * ```typescript
 * const person = await client.people.getPage({ include: ['emails', 'phone_numbers'] });
 * const lookup = createIncludedLookup(person.included);
 * const email = lookup.get('Email:456'); // Fast lookup
 * ```
 */
export function createIncludedLookup(
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
 * Automatically map included resources to their relationships
 * 
 * Re-exported from @rachelallyson/planning-center-base-ts for convenience.
 * The mapping is now automatically applied in getList()/getPage() methods.
 */
export const mapIncludedToRelationships = baseMapIncludedToRelationships;

// ===== File Handling Utilities =====

/**
 * Extracts clean URL from HTML markup that contains file links
 * Handles cases like: <a href="https://onark.s3.us-east-1.amazonaws.com/file.pdf" download>View File: https://onark.s3.us-east-1.amazonaws.com/file.pdf</a>
 */
export function extractFileUrl(value: string): string {
    // If it's already a clean URL, return it
    if (value.startsWith('http') && !value.includes('<')) {
        return value;
    }

    // Extract URL from HTML anchor tag
    const hrefMatch = /href=["']([^"']+)["']/.exec(value);

    if (hrefMatch) {
        return hrefMatch[1];
    }

    // Extract URL from text content (fallback)
    const urlMatch = /(https?:\/\/[^\s<>"']+)/.exec(value);

    if (urlMatch) {
        return urlMatch[1];
    }

    // If no URL found, return original value
    return value;
}

/**
 * Determines if a value contains a file URL
 */
export function isFileUrl(value: string): boolean {
    const cleanUrl = extractFileUrl(value);

    return (
        cleanUrl.includes('s3.') ||
        cleanUrl.includes('amazonaws.com') ||
        cleanUrl.includes('onark.s3.')
    );
}

/**
 * Gets file extension from URL
 */
export function getFileExtension(url: string): string {
    const cleanUrl = extractFileUrl(url);
    const match = /\.([a-zA-Z0-9]+)(?:[?#]|$)/.exec(cleanUrl);

    return match ? match[1].toLowerCase() : '';
}

/**
 * Gets filename from URL
 */
export function getFilename(url: string): string {
    const cleanUrl = extractFileUrl(url);
    const urlParts = cleanUrl.split('/');

    return urlParts[urlParts.length - 1] || 'file';
}

/**
 * Determines if a field value represents a file upload
 */
export function isFileUpload(value: string): boolean {
    return isFileUrl(value) || value.includes('<a href=');
}

/**
 * Gets MIME type from file extension
 */
function getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
        csv: 'text/csv',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        gif: 'image/gif',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        pdf: 'application/pdf',
        png: 'image/png',
        txt: 'text/plain',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Processes file upload value for PCO field
 * Returns clean URL for text fields, or file data for file fields
 */
export function processFileValue(
    value: string,
    fieldType: 'text' | 'file' = 'text'
): string | { url: string; filename: string; contentType: string } {
    const cleanUrl = extractFileUrl(value);

    if (fieldType === 'text') {
        return cleanUrl;
    }

    // For file fields, return metadata object
    const extension = getFileExtension(cleanUrl);
    const filename = getFilename(cleanUrl);
    const contentType = getMimeType(extension);

    return {
        contentType,
        filename,
        url: cleanUrl,
    };
}

