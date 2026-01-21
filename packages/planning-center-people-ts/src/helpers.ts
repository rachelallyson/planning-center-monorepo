import type { PcoClientState } from './core';
import type { ErrorContext } from './error-handling';
import {
    getPeople,
    getPerson,
    createPerson,
    createPersonEmail,
    createPersonPhoneNumber,
    createPersonAddress,
    getPersonEmails,
    getPersonPhoneNumbers,
    getPersonAddresses,
    getPersonFieldData,
    getWorkflowCards,
    createWorkflowCard,
    getWorkflowCardNotes,
    createWorkflowCardNote,
    getLists,
    getListCategories,
    getOrganization,
    getHouseholds,
} from './people';
import type {
    PersonAttributes,
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
} from './types';

/**
 * Transform complex params object into flat query params for API calls
 */
export function buildQueryParams(params?: {
    where?: Record<string, any>;
    include?: string[];
    per_page?: number;
    page?: number;
    filter?: string;
}): Record<string, any> {
    const queryParams: Record<string, any> = {};

    if (params?.where) {
        Object.entries(params.where).forEach(([key, value]) => {
            queryParams[`where[${key}]`] = value;
        });
    }

    if (params?.include) {
        queryParams.include = params.include.join(',');
    }

    if (params?.per_page) {
        queryParams.per_page = params.per_page;
    }

    if (params?.page) {
        queryParams.page = params.page;
    }

    if (params?.filter) {
        queryParams.filter = params.filter;
    }

    return queryParams;
}

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
 * @example
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
    client: PcoClientState,
    personId: string,
    context?: Partial<ErrorContext>
): Promise<{
    email?: string;
    phone?: string;
    address?: string;
}> {
    const [emails, phones, addresses] = await Promise.all([
        getPersonEmails(client, personId, context),
        getPersonPhoneNumbers(client, personId, context),
        getPersonAddresses(client, personId, context)
    ]);

    const primaryEmail = emails.data.find((e: any) => e.attributes.primary);
    const primaryPhone = phones.data.find((p: any) => p.attributes.primary);
    const primaryAddress = addresses.data.find((a: any) => a.attributes.primary);

    return {
        email: primaryEmail?.attributes?.address || emails.data[0]?.attributes?.address,
        phone: primaryPhone?.attributes?.number || phones.data[0]?.attributes?.number,
        address: (primaryAddress?.attributes?.street || addresses.data[0]?.attributes?.street) as string | undefined
    };
}

/**
 * Create a person with contact information
 */
export async function createPersonWithContact(
    client: PcoClientState,
    personData: Partial<PersonAttributes>,
    contactData?: {
        email?: Partial<EmailAttributes>;
        phone?: Partial<PhoneNumberAttributes>;
        address?: Partial<AddressAttributes>;
    },
    context?: Partial<ErrorContext>
): Promise<{
    person: PersonSingle;
    email?: EmailSingle;
    phone?: PhoneNumberSingle;
    address?: AddressSingle;
}> {
    const person = await createPerson(client, personData, context);

    const results: any = { person };

    if (contactData?.email) {
        results.email = await createPersonEmail(client, person.data!.id, contactData.email, context);
    }

    if (contactData?.phone) {
        results.phone = await createPersonPhoneNumber(client, person.data!.id, contactData.phone, context);
    }

    if (contactData?.address) {
        results.address = await createPersonAddress(client, person.data!.id, contactData.address, context);
    }

    return results;
}

/**
 * Search people by multiple criteria
 */
export async function searchPeople(
    client: PcoClientState,
    criteria: {
        status?: string;
        name?: string;
        email?: string;
        per_page?: number;
    },
    context?: Partial<ErrorContext>
): Promise<PeopleList> {
    const where: Record<string, any> = {};

    if (criteria.status) {
        where.status = criteria.status;
    }

    // Use flexible search when we have email, otherwise use specific name search
    if (criteria.email) {
        where.search_name_or_email_or_phone_number = criteria.email;
    } else if (criteria.name) {
        where.search_name = criteria.name;
    }

    return getPeople(client, {
        where,
        per_page: criteria.per_page || 25
    }, context);
}

/**
 * Get people by household
 */
export async function getPeopleByHousehold(
    client: PcoClientState,
    householdId: string,
    context?: Partial<ErrorContext>
): Promise<PeopleList> {
    return getPeople(client, {
        where: { household_id: householdId },
        include: ['household']
    }, context);
}

/**
 * Get complete person profile with all related data
 */
export async function getCompletePersonProfile(
    client: PcoClientState,
    personId: string,
    context?: Partial<ErrorContext>
): Promise<{
    person: PersonSingle;
    emails: any;
    phones: any;
    addresses: any;
    fieldData: any;
    workflowCards: any;
}> {
    const [person, emails, phones, addresses, fieldData, workflowCards] = await Promise.all([
        getPerson(client, personId, ['household'], context),
        getPersonEmails(client, personId, context),
        getPersonPhoneNumbers(client, personId, context),
        getPersonAddresses(client, personId, context),
        getPersonFieldData(client, personId, context),
        getWorkflowCards(client, personId, context)
    ]);

    return {
        person,
        emails,
        phones,
        addresses,
        fieldData,
        workflowCards
    };
}

/**
 * Get organization info with statistics
 */
export async function getOrganizationInfo(
    client: PcoClientState,
    context?: Partial<ErrorContext>
): Promise<{
    organization: OrganizationSingle;
    stats: {
        totalPeople: number;
        totalHouseholds: number;
        totalLists: number;
    };
}> {
    const [organization, people, households, lists] = await Promise.all([
        getOrganization(client, undefined, context),
        getPeople(client, { per_page: 1 }, context),
        getHouseholds(client, { per_page: 1 }, context),
        getLists(client, { per_page: 1 }, context)
    ]);

    return {
        organization,
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
    client: PcoClientState,
    context?: Partial<ErrorContext>
): Promise<{
    lists: ListsList;
    categories: ListCategoriesList;
}> {
    const [lists, categories] = await Promise.all([
        getLists(client, { include: ['list_category'] }, context),
        getListCategories(client, undefined, context)
    ]);

    return { lists, categories };
}

/**
 * Get workflow cards with notes for a person
 */
export async function getPersonWorkflowCardsWithNotes(
    client: PcoClientState,
    personId: string,
    context?: Partial<ErrorContext>
): Promise<{
    workflowCards: any;
    notes: { [cardId: string]: any };
}> {
    const workflowCards = await getWorkflowCards(client, personId, context);

    const notes: { [cardId: string]: any } = {};

    for (const card of workflowCards.data) {
        try {
            notes[card.id] = await getWorkflowCardNotes(client, personId, card.id, context);
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
    client: PcoClientState,
    workflowId: string,
    personId: string,
    noteData: Partial<WorkflowCardNoteAttributes>,
    context?: Partial<ErrorContext>
): Promise<{
    workflowCard: WorkflowCardSingle;
    note: WorkflowCardNoteSingle;
}> {
    const workflowCard = await createWorkflowCard(client, workflowId, personId, context);

    const note = await createWorkflowCardNote(
        client,
        personId,
        workflowCard.data!.id,
        noteData,
        context
    );

    return { workflowCard, note };
}

/**
 * Export all people data in a structured format
 */
export async function exportAllPeopleData(
    client: PcoClientState,
    options: {
        includeInactive?: boolean;
        includeFieldData?: boolean;
        includeWorkflowCards?: boolean;
        perPage?: number;
    } = {},
    context?: Partial<ErrorContext>
): Promise<{
    people: any[];
    households: any[];
    lists: any[];
    organization: any;
    exportDate: string;
    totalCount: number;
}> {
    const { includeInactive = false, includeFieldData = false, includeWorkflowCards = false, perPage = 100 } = options;

    const where: Record<string, any> = {};
    if (!includeInactive) {
        where.status = 'active';
    }

    const include: string[] = ['household'];
    if (includeFieldData) {
        include.push('field_data');
    }
    if (includeWorkflowCards) {
        include.push('workflow_cards');
    }

    const [people, households, lists, organization] = await Promise.all([
        getPeople(client, { where, include, per_page: perPage }, context),
        getHouseholds(client, { per_page: perPage }, context),
        getLists(client, { per_page: perPage }, context),
        getOrganization(client, undefined, context)
    ]);

    return {
        people: people.data,
        households: households.data,
        lists: lists.data,
        organization: organization.data,
        exportDate: new Date().toISOString(),
        totalCount: Number(people.meta?.total_count) || 0
    };
}

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

