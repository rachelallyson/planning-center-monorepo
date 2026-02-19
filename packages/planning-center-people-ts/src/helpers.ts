import type { PcoClient } from './client';
import {
    mapIncludedToRelationships as coreMapIncludedToRelationships,
    singleFromCreateResponse,
} from '@rachelallyson/planning-center-base-ts';
import type { PersonWhereClause, PersonInclude } from './types/api-options';
import type {
    PersonAttributes,
    EmailAttributes,
    PhoneNumberAttributes,
    AddressAttributes,
    EmailResource,
    PhoneNumberResource,
    AddressResource,
    WorkflowCardNoteAttributes,
    OrganizationResource,
    WorkflowCardNoteResource,
    PersonResource,
    Meta,
    TopLevelLinks,
} from './types';

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
export function calculateAgeSafe(birthdate: string | null | undefined): number | null {
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

function matchesAgeWhenUnknown(
    criteria: { agePreference?: 'adults' | 'children' | 'any'; agePreferenceLenient?: boolean }
): boolean {
    if (criteria.agePreferenceLenient) return true;
    return criteria.agePreference === 'any' || criteria.agePreference === undefined;
}

function matchesAgePreference(age: number, preference?: 'adults' | 'children' | 'any'): boolean {
    if (preference === 'adults' && age < 18) return false;
    if (preference === 'children' && age >= 18) return false;
    return true;
}

function matchesAgeRange(age: number, minAge?: number, maxAge?: number): boolean {
    if (minAge !== undefined && age < minAge) return false;
    if (maxAge !== undefined && age > maxAge) return false;
    return true;
}

/**
 * Check if a person's age matches the given criteria
 */
function matchesBirthYear(birthdate: string, birthYear: number): boolean {
    return new Date(birthdate).getFullYear() === birthYear;
}

function matchesBirthYearCriteria(birthdate: string | null | undefined, birthYear: number | undefined): boolean {
    return birthYear === undefined || !birthdate || matchesBirthYear(birthdate, birthYear);
}

function matchesAgeCriteriaWithAge(age: number, birthdate: string | null | undefined, criteria: { agePreference?: 'adults' | 'children' | 'any'; minAge?: number; maxAge?: number; birthYear?: number }): boolean {
    if (!matchesAgePreference(age, criteria.agePreference)) return false;
    if (!matchesAgeRange(age, criteria.minAge, criteria.maxAge)) return false;
    return matchesBirthYearCriteria(birthdate, criteria.birthYear);
}

export function matchesAgeCriteria(
    birthdate: string | null | undefined,
    criteria: {
        agePreference?: 'adults' | 'children' | 'any';
        minAge?: number;
        maxAge?: number;
        birthYear?: number;
        agePreferenceLenient?: boolean;
    }
): boolean {
    const age = calculateAgeSafe(birthdate);
    if (age === null) return matchesAgeWhenUnknown(criteria);
    return matchesAgeCriteriaWithAge(age, birthdate, criteria);
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
    const phoneRegex = /^[+]?[1-9][\d]{6,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
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

/** Type guard: value has optional id (household relationship can be resource or identifier) */
function hasOptionalId(value: object | null | undefined): value is { id?: string } {
    return value != null && typeof value === 'object' && 'id' in value;
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

    if (domain1 === domain2) return true;
    return domainsSharePrefix(domain1, domain2, 3);
}

function domainsSharePrefix(domain1: string, domain2: string, minLen: number): boolean {
    if (domain1.length < minLen || domain2.length < minLen) return false;
    return domain1.substring(0, minLen) === domain2.substring(0, minLen);
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
function normalizedPhonesMatch(phone1: string, phone2: string): boolean {
    const n1 = normalizePhoneDigits(phone1);
    const n2 = normalizePhoneDigits(phone2);
    return !!n1 && !!n2 && n1 === n2;
}

function rawDigitsMatch(phone1: string, phone2: string): boolean {
    return phone1.replace(/\D/g, '') === phone2.replace(/\D/g, '');
}

export function phoneNumbersSimilar(phone1: string, phone2: string): boolean {
    if (!phone1 || !phone2) return false;
    return normalizedPhonesMatch(phone1, phone2) || rawDigitsMatch(phone1, phone2);
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
function checkEmailMatch(searchEmail: string, personEmails: string[]): boolean {
    return personEmails.some((personEmail) => emailDomainsMatch(searchEmail, personEmail));
}

function checkPhoneMatch(searchPhone: string, personPhones: string[]): boolean {
    return personPhones.some((personPhone) => phoneNumbersSimilar(searchPhone, personPhone));
}

function computeContactValid(hasSearchCriteria: boolean, emailMatch: boolean, phoneMatch: boolean): boolean {
    return !hasSearchCriteria || emailMatch || phoneMatch;
}

export function validateContactSimilarity(
    searchEmail: string | undefined,
    searchPhone: string | undefined,
    personEmails: string[],
    personPhones: string[]
): { emailMatch: boolean; phoneMatch: boolean; isValid: boolean } {
    const emailMatch = searchEmail ? checkEmailMatch(searchEmail, personEmails) : false;
    const phoneMatch = searchPhone ? checkPhoneMatch(searchPhone, personPhones) : false;
    const isValid = computeContactValid(!!(searchEmail || searchPhone), emailMatch, phoneMatch);
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
function trustResult(shouldTrust: boolean, age: number | null, reason: string): TrustResult {
    return { shouldTrust, age, reason };
}

function trustFreshResult(age: number, trustWindow: number): TrustResult {
    const ageSeconds = Math.round(age / 1000);
    const trustWindowMinutes = Math.round(trustWindow / 1000 / 60);
    return trustResult(true, age, `Fresh personId (${ageSeconds}s old, within ${trustWindowMinutes}min trust window)`);
}

function trustStaleResult(age: number): TrustResult {
    const ageMinutes = Math.round(age / 1000 / 60);
    return trustResult(false, age, `Old personId (${ageMinutes}min old, needs verification)`);
}

function parseTrustAge(createdAt: string): { age: number; valid: true } | { valid: false; result: TrustResult } {
    const createdDate = new Date(createdAt);
    if (isNaN(createdDate.getTime())) {
        return { valid: false, result: trustResult(false, null, 'Invalid timestamp format') };
    }
    const age = Date.now() - createdDate.getTime();
    if (age < 0) return { valid: false, result: trustResult(false, age, 'Timestamp is in the future (clock skew)') };
    return { age, valid: true };
}

export function calculateTrust(
    createdAt: string | undefined,
    trustWindow: number = DEFAULT_TRUST_WINDOW
): TrustResult {
    if (!createdAt) return trustResult(false, null, 'No timestamp (legacy data or never saved)');
    const parsed = parseTrustAge(createdAt);
    if (parsed.valid === false) return parsed.result;
    const { age } = parsed;
    if (age < trustWindow) return trustFreshResult(age, trustWindow);
    return trustStaleResult(age);
}

function joinNameParts(first: string, last: string): string {
    if (first && last) return `${first} ${last}`;
    if (first) return first;
    if (last) return last;
    return 'Unknown';
}

/**
 * Format person name from attributes
 */
export function formatPersonName(person: { first_name?: string; last_name?: string; nickname?: string }): string {
    const first = person.nickname || person.first_name || '';
    const last = person.last_name || '';
    return joinNameParts(first, last);
}

const DATE_FORMATTERS: Record<'short' | 'long' | 'iso', (date: Date) => string> = {
    short: (d) => d.toLocaleDateString(),
    long: (d) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    iso: (d) => d.toISOString().split('T')[0],
};

/**
 * Format date string in various formats
 */
export function formatDate(dateString: string, format: 'short' | 'long' | 'iso' = 'short'): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const formatter = DATE_FORMATTERS[format] ?? DATE_FORMATTERS.short;
    return formatter(date);
}

/**
 * Validate person data
 */
/** Person-like data that may include email/phone for validation (e.g. create payloads) */
export type PersonDataForValidation = Partial<PersonAttributes> & { email?: string; phone?: string };

function validateEmailField(data: PersonDataForValidation): string[] {
    if (data.email && typeof data.email === 'string' && !isValidEmail(data.email)) {
        return ['Invalid email format'];
    }
    return [];
}

function validatePhoneField(data: PersonDataForValidation): string[] {
    if (data.phone && typeof data.phone === 'string' && !isValidPhone(data.phone)) {
        return ['Invalid phone format'];
    }
    return [];
}

function validateBirthdateField(data: PersonDataForValidation): string[] {
    if (data.birthdate) {
        const birthDate = new Date(data.birthdate);
        if (isNaN(birthDate.getTime())) return ['Invalid birthdate format'];
    }
    return [];
}

export function validatePersonData(data: PersonDataForValidation): { isValid: boolean; errors: string[] } {
    const errors = [
        ...validateEmailField(data),
        ...validatePhoneField(data),
        ...validateBirthdateField(data),
    ];
    return { isValid: errors.length === 0, errors };
}

function primaryOrFirst<T extends { primary?: boolean }>(items: T[]): T | undefined {
    return items.find((x) => x.primary) ?? items[0];
}

function resolveAddressString(primaryAddress: { street_line_1?: string | null } | undefined, fallbackFirst: { street_line_1?: string | null } | undefined): string | undefined {
    const value = primaryAddress?.street_line_1 ?? fallbackFirst?.street_line_1;
    return typeof value === 'string' ? value : undefined;
}

function pickEmail(emails: { data: Array<{ address?: string | null; primary?: boolean }> }): string | undefined {
    const primary = primaryOrFirst(emails.data);
    const value = primary?.address ?? emails.data[0]?.address;
    return typeof value === 'string' ? value : undefined;
}

function pickPhone(phones: { data: Array<{ number?: string | null; primary?: boolean }> }): string | undefined {
    const primary = primaryOrFirst(phones.data);
    const value = primary?.number ?? phones.data[0]?.number;
    return typeof value === 'string' ? value : undefined;
}

function buildPrimaryContactResult(
    emails: { data: Array<{ address?: string | null; primary?: boolean }> },
    phones: { data: Array<{ number?: string | null; primary?: boolean }> },
    addresses: { data: Array<{ street_line_1?: string | null; primary?: boolean }> }
) {
    const primaryAddress = primaryOrFirst(addresses.data);
    const addressString = resolveAddressString(primaryAddress, addresses.data[0]);
    return {
        email: pickEmail(emails),
        phone: pickPhone(phones),
        address: addressString
    };
}

/**
 * Get primary contact information for a person
 */
export async function getPrimaryContact(
    client: PcoClient,
    personId: string
) {
    const [emails, phones, addresses] = await Promise.all([
        client.people.getEmails(personId),
        client.people.getPhoneNumbers(personId),
        client.people.getAddresses(personId)
    ]);
    return buildPrimaryContactResult(emails, phones, addresses);
}

function buildCreatePersonData(personData: Partial<PersonAttributes>): Partial<PersonAttributes> {
    const createData: Partial<PersonAttributes> = {};
    if (personData.first_name) createData.first_name = personData.first_name;
    if (personData.last_name) createData.last_name = personData.last_name;
    if (personData.nickname !== null && personData.nickname !== undefined) {
        createData.nickname = personData.nickname;
    }
    return createData;
}

async function addEmailIfPresent(
    client: PcoClient,
    personId: string,
    email: Partial<EmailAttributes> | undefined
): Promise<EmailResource | undefined> {
    if (!email?.address || !email?.location) return undefined;
    const res = await client.people.addEmail(personId, {
        address: email.address,
        location: email.location,
        primary: email.primary,
    });
    return singleFromCreateResponse(res);
}

async function addPhoneIfPresent(
    client: PcoClient,
    personId: string,
    phone: Partial<PhoneNumberAttributes> | undefined
): Promise<PhoneNumberResource | undefined> {
    if (!phone?.number || !phone?.location) return undefined;
    const res = await client.people.addPhoneNumber(personId, {
        number: phone.number,
        location: phone.location,
        primary: phone.primary,
    });
    return singleFromCreateResponse(res);
}

async function addContactResults(
    client: PcoClient,
    personId: string,
    contactData: {
        email?: Partial<EmailAttributes>;
        phone?: Partial<PhoneNumberAttributes>;
        address?: Partial<AddressAttributes>;
    }
): Promise<{ email?: EmailResource; phone?: PhoneNumberResource; address?: AddressResource }> {
    const [email, phone, address] = await Promise.all([
        addEmailIfPresent(client, personId, contactData.email),
        addPhoneIfPresent(client, personId, contactData.phone),
        contactData.address
            ? singleFromCreateResponse(await client.people.addAddress(personId, contactData.address))
            : Promise.resolve(undefined),
    ]);
    return { email, phone, address };
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
) {
    const createData = buildCreatePersonData(personData);
    const createRes = await client.people.create(createData);
    const person = singleFromCreateResponse(createRes);
    if (!person) throw new Error('Create person did not return a resource');
    const contact = contactData ? await addContactResults(client, person.id, contactData) : {};
    return { person, ...contact };
}

function buildSearchWhere(criteria: { status?: string; name?: string; email?: string }): PersonWhereClause {
    const where: PersonWhereClause = {};
    if (criteria.status) where.status = criteria.status;
    if (criteria.email) where.search_name_or_email_or_phone_number = criteria.email;
    else if (criteria.name) where.search_name = criteria.name;
    return where;
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
        per_page?: number;
        page?: number;
    }
) {
    const where = buildSearchWhere(criteria);
    const usePagination = criteria.per_page !== undefined || criteria.page !== undefined;

    if (usePagination) {
        return client.people.getPage({ where, per_page: criteria.per_page, page: criteria.page });
    }
    return client.people.getAll({ where });
}

/**
 * Get people by household
 */
export async function getPeopleByHousehold(
    client: PcoClient,
    householdId: string
) {
    const result = await client.people.getAll({
        include: ['household']
    });
    // Filter by household_id manually since it's not in the where clause
    // getAll returns PaginationResult with PersonResource[], so return the same type
    const filtered = {
        ...result,
        data: result.data.filter((p) => {
            const household = p.household;
            if (!household) return false;
            if (Array.isArray(household)) {
                return household.some((h) => hasOptionalId(h) && h.id === householdId);
            }
            return hasOptionalId(household) && household.id === householdId;
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
) {
    const [person, emails, phones, addresses, fieldData, workflowCards] = await Promise.all([
        client.people.getById(personId, { include: ['household'] }),
        client.people.getEmails(personId),
        client.people.getPhoneNumbers(personId),
        client.people.getAddresses(personId),
        client.people.getFieldData(personId),
        client.people.getWorkflowCards(personId)
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

export interface GetOrganizationInfoResult {
    organization: OrganizationResource | null;
    stats: { totalPeople: number; totalHouseholds: number; totalLists: number };
}

function totalFromMeta(meta: { total_count?: number } | undefined): number {
    return Number(meta?.total_count) || 0;
}

/**
 * Get organization info with statistics
 */
export async function getOrganizationInfo(client: PcoClient): Promise<GetOrganizationInfoResult> {
    const [people, households, lists] = await Promise.all([
        client.people.getPage({ per_page: 1 }),
        client.households.getPage({ per_page: 1 }),
        client.lists.getPage({ per_page: 1 })
    ]);

    return {
        organization: null,
        stats: {
            totalPeople: totalFromMeta(people.meta),
            totalHouseholds: totalFromMeta(households.meta),
            totalLists: totalFromMeta(lists.meta),
        }
    };
}

/**
 * Get lists with their categories
 */
export async function getListsWithCategories(
    client: PcoClient
) {
    const [lists, categories] = await Promise.all([
        client.lists.getAll(),
        client.lists.getListCategories()
    ]);

    return { lists, categories };
}

/**
 * Get workflow cards with notes for a person
 */
export async function getPersonWorkflowCardsWithNotes(
    client: PcoClient,
    personId: string
) {
    const workflowCards = await client.people.getWorkflowCards(personId);

    const notes: { [cardId: string]: { data: WorkflowCardNoteResource[]; meta?: Meta; links?: TopLevelLinks } } = {};

    for (const card of workflowCards.data) {
        try {
            notes[card.id] = await client.workflows.getWorkflowCardNotes(personId, card.id);
        } catch {
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
) {
    const workflowCardRes = await client.workflows.createWorkflowCard(workflowId, personId);
    const workflowCard = singleFromCreateResponse(workflowCardRes);
    if (!workflowCard) throw new Error('Create workflow card did not return a resource');

    const noteRes = await client.workflows.createWorkflowCardNote(
        personId,
        workflowCard.id,
        noteData
    );
    const note = singleFromCreateResponse(noteRes);
    if (!note) throw new Error('Create workflow card note did not return a resource');

    return { workflowCard, note };
}

/**
 * Export all people data in a structured format
 */
function buildExportInclude(includeFieldData: boolean): PersonInclude[] {
    const include: PersonInclude[] = ['household'];
    if (includeFieldData) include.push('field_data');
    return include;
}

function buildExportWhere(includeInactive: boolean): PersonWhereClause {
    return includeInactive ? {} : { status: 'active' };
}

async function fetchOrganizationSafe(client: PcoClient): Promise<OrganizationResource | null> {
    try {
        const orgInfo = await getOrganizationInfo(client);
        return orgInfo.organization;
    } catch {
        return null;
    }
}

/** Minimal shape for export payload list/household data */
interface ExportListData {
    data: object[];
}

function buildExportPayload(
    people: { data: PersonResource[]; meta?: { total_count?: number } },
    households: ExportListData,
    lists: ExportListData,
    organization: OrganizationResource | null
) {
    const totalCount = Number(people.meta?.total_count) || 0;
    return {
        people: people.data,
        households: households.data,
        lists: lists.data,
        organization,
        exportDate: new Date().toISOString(),
        totalCount
    };
}

export async function exportAllPeopleData(
    client: PcoClient,
    options: { includeInactive?: boolean; includeFieldData?: boolean } = {}
) {
    const { includeInactive = false, includeFieldData = false } = options;
    const where = buildExportWhere(includeInactive);
    const include = buildExportInclude(includeFieldData);

    const [people, households, lists] = await Promise.all([
        client.people.getAll({ where, include }),
        client.households.getAll(),
        client.lists.getAll()
    ]);

    const organization = await fetchOrganizationSafe(client);
    return buildExportPayload(people, households, lists, organization);
}

// ===== JSON:API Included (re-export from core) =====

/**
 * Map included resources to relationships (resolve + flatten).
 * Re-exported from @rachelallyson/planning-center-base-ts for convenience.
 * Applied automatically in getList()/getPage() responses.
 */
export const mapIncludedToRelationships = coreMapIncludedToRelationships;

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
export function getMimeType(extension: string): string {
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

