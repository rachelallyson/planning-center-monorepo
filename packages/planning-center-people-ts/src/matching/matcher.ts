/**
 * v2.0.0 Person Matching Logic
 */

import { createDebugLogger } from '@rachelallyson/planning-center-base-ts';
import type { PcoClientConfig } from '@rachelallyson/planning-center-base-ts';
import type { PeopleModule } from '../modules/people';
import type { PersonResource, FlattenedPersonResource } from '../types';
import {
    PersonMatchOptions,
    RetryConfig,
    DEFAULT_INITIAL_RETRY_CONFIG,
    DEFAULT_AGGRESSIVE_RETRY_CONFIG
} from '../modules/people';
import { MatchStrategies } from './strategies';
import { MatchScorer } from './scoring';
import { 
    matchesAgeCriteria, 
    normalizeEmail, 
    normalizePhone, 
    isValidEmail,
    validateContactSimilarity,
    emailDomainsMatch,
    phoneNumbersSimilar 
} from '../helpers';

export interface MatchResult {
    person: FlattenedPersonResource;
    score: number;
    reason: string;
    isVerifiedContactMatch?: boolean; // True if email/phone actually matches
}

export class PersonMatcher {
    private strategies: MatchStrategies;
    private scorer: MatchScorer;
    private getConfig?: () => PcoClientConfig;

    constructor(private peopleModule: PeopleModule, getConfig?: () => PcoClientConfig) {
        this.getConfig = getConfig;
        this.strategies = new MatchStrategies();
        this.scorer = new MatchScorer(peopleModule, getConfig);
    }

    /** Log only when client config has debug enabled; no-op otherwise */
    private debugLog(message: string, data?: unknown): void {
        const logger = createDebugLogger(this.getConfig?.());
        if (logger.enabled) logger.log(message, data);
    }

    /**
     * Resolve retry configuration from options, with defaults
     */
    private resolveRetryConfig(
        explicitConfig?: RetryConfig,
        phaseConfig?: RetryConfig,
        defaults: Required<Omit<RetryConfig, 'enabled'>> = DEFAULT_INITIAL_RETRY_CONFIG
    ): Required<Omit<RetryConfig, 'enabled'>> {
        // Phase config takes precedence over explicit config
        const config = phaseConfig || explicitConfig;
        
        return {
            maxRetries: config?.maxRetries ?? defaults.maxRetries,
            maxWaitTime: config?.maxWaitTime ?? defaults.maxWaitTime,
            initialDelay: config?.initialDelay ?? defaults.initialDelay,
            backoffMultiplier: config?.backoffMultiplier ?? defaults.backoffMultiplier,
        };
    }

    /**
     * Find or create a person with smart matching
     * 
     * Uses intelligent matching logic that:
     * - Verifies email/phone matches by checking actual contact information
     * - Only uses name matching when appropriate (multiple people share contact info, or no contact info provided)
     * - Can automatically add missing contact information when a match is found (if addMissingContactInfo is true)
     * - Retries with exponential backoff when contacts may not be verified yet (PCO takes 30-90+ seconds)
     * - Supports multi-step search strategy for maximum matching success
     * 
     * @param options - Matching options
     * @param options.addMissingContactInfo - If true, automatically adds missing email/phone to matched person's profile
     * @param options.retryConfig - Configuration for retry logic to handle PCO contact verification delays
     * @param options.searchStrategy - 'single' for standard search, 'multi-step' for trying multiple strategies
     */
    async findOrCreate(options: PersonMatchOptions): Promise<FlattenedPersonResource> {
        const { 
            createIfNotFound = true, 
            matchStrategy = 'fuzzy', 
            searchStrategy = 'single',
            addMissingContactInfo = false, 
            retryConfig, 
            ...searchOptions 
        } = options;

        // Determine if retry logic should be enabled
        // Retry is useful when:
        // 1. We have email/phone (these need verification)
        // 2. createIfNotFound is false (we're trying to find existing, not create new)
        // 3. retryConfig.enabled is not explicitly false
        const hasContactInfo = !!(options.email || options.phone);
        const shouldRetry = hasContactInfo && 
                           !createIfNotFound && 
                           (retryConfig?.enabled !== false);

        if (shouldRetry) {
            return this.findOrCreateWithRetry(options);
        }

        // Try to find existing person using appropriate search strategy
        let match: MatchResult | null = null;
        
        if (searchStrategy === 'multi-step') {
            match = await this.findMatchMultiStep(options);
        } else {
            match = await this.findMatch({ ...searchOptions, matchStrategy });
        }

        if (match) {
            const person = match.person;
            
            // Add missing contact information if requested
            if (addMissingContactInfo) {
                await this.addMissingContactInfo(person, options);
            }
            
            return person;
        }

        // Create new person if not found and creation is enabled
        if (createIfNotFound) {
            // If aggressive retry config is provided, do a final aggressive search before creating
            // This is a safeguard to prevent duplicates when PCO hasn't indexed contacts yet
            if (options.retryConfigs?.aggressive) {
                const aggressiveMatch = await this.findWithAggressiveRetry(options);
                if (aggressiveMatch) {
                    const person = aggressiveMatch.person;
                    if (addMissingContactInfo) {
                        await this.addMissingContactInfo(person, options);
                    }
                    return person;
                }
            }
            
            return this.createPerson(options);
        }

        throw new Error(`No matching person found and creation is disabled`);
    }

    /**
     * Final aggressive search before creating a new person
     * 
     * This is a safeguard to prevent duplicate person creation when:
     * - PCO hasn't indexed contacts yet (15-30 minute delay)
     * - Multiple workers are processing the same person
     * - The fast path didn't find an existing person
     */
    private async findWithAggressiveRetry(options: PersonMatchOptions): Promise<MatchResult | null> {
        const { 
            matchStrategy = 'fuzzy', 
            searchStrategy = 'single',
            retryConfigs 
        } = options;
        
        const aggressiveConfig = this.resolveRetryConfig(
            undefined, 
            retryConfigs?.aggressive,
            DEFAULT_AGGRESSIVE_RETRY_CONFIG
        );
        
        this.debugLog(`findOrCreate  aggressive final search before create`, {
            maxWaitTime: aggressiveConfig.maxWaitTime,
            maxRetries: aggressiveConfig.maxRetries,
        });
        
        let totalWaitTime = 0;
        
        for (let attempt = 1; attempt <= aggressiveConfig.maxRetries; attempt++) {
            try {
                let match: MatchResult | null = null;
                
                if (searchStrategy === 'multi-step') {
                    match = await this.findMatchMultiStep(options);
                } else {
                    match = await this.findMatch({ ...options, matchStrategy });
                }
                
                if (match) {
                    this.debugLog(`findOrCreate  aggressive search found person (would have created duplicate)`, {
                        personId: match.person.id,
                        attempt,
                        totalWaitTime,
                    });
                    return match;
                }
            } catch (error) {
                this.debugLog(`findOrCreate  aggressive search attempt ${attempt} failed`, { error: String(error) });
            }
            
            // Don't wait on the last attempt
            if (attempt === aggressiveConfig.maxRetries) {
                break;
            }
            
            // Calculate delay with exponential backoff
            const delay = Math.min(
                aggressiveConfig.initialDelay * Math.pow(aggressiveConfig.backoffMultiplier, attempt - 1),
                aggressiveConfig.maxWaitTime - totalWaitTime
            );
            
            if (totalWaitTime + delay > aggressiveConfig.maxWaitTime) {
                break;
            }
            
            totalWaitTime += delay;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        this.debugLog(`findOrCreate  aggressive search completed - no match found, safe to create`, {
            totalWaitTime,
            maxRetries: aggressiveConfig.maxRetries,
        });
        
        return null;
    }

    /**
     * Multi-step search strategy configuration
     */
    private static readonly MULTI_STEP_STRATEGIES: Array<{
        matchStrategy: 'fuzzy' | 'exact' | 'aggressive';
        useAgePreference: boolean;
        description: string;
    }> = [
        { matchStrategy: 'fuzzy', useAgePreference: true, description: 'fuzzy with age preference' },
        { matchStrategy: 'fuzzy', useAgePreference: false, description: 'fuzzy without age preference' },
        { matchStrategy: 'exact', useAgePreference: true, description: 'exact with age preference' },
        { matchStrategy: 'exact', useAgePreference: false, description: 'exact without age preference' },
    ];

    /**
     * Find a match using multi-step search strategy
     * 
     * Tries multiple matching strategies in order until a match is found:
     * 1. Fuzzy with age preference (handles name variations, prefers adults)
     * 2. Fuzzy without age preference (catches single matches filtered by age)
     * 3. Exact with age preference (high confidence, prefers adults)
     * 4. Exact without age preference (high confidence, any age)
     * 
     * This approach maximizes matching success while maintaining quality.
     */
    async findMatchMultiStep(options: PersonMatchOptions): Promise<MatchResult | null> {
        const { agePreference, agePreferenceLenient, ...baseOptions } = options;
        
        for (const strategy of PersonMatcher.MULTI_STEP_STRATEGIES) {
            try {
                const searchOptions: PersonMatchOptions = {
                    ...baseOptions,
                    matchStrategy: strategy.matchStrategy,
                };
                
                // Apply age preference only when specified by strategy
                if (strategy.useAgePreference && agePreference) {
                    searchOptions.agePreference = agePreference;
                    // Use lenient mode when specified, so profiles without birthdates are included
                    searchOptions.agePreferenceLenient = agePreferenceLenient ?? true;
                }
                
                const match = await this.findMatch(searchOptions);
                
                if (match) {
                    this.debugLog(`findOrCreate  multi-step search found match using ${strategy.description}`, {
                        personId: match.person.id,
                        score: match.score,
                        reason: match.reason,
                    });
                    return match;
                }
            } catch (error) {
                // Log but continue to next strategy
                this.debugLog(`findOrCreate  multi-step strategy "${strategy.description}" failed`, { error: String(error) });
            }
        }
        
        return null;
    }

    /**
     * Find or create with retry logic to handle PCO contact verification delays
     * 
     * PCO takes 30-90+ seconds to verify/index contacts after a person is created.
     * This method retries with exponential backoff to give PCO time to process contacts.
     * 
     * Supports phase-specific retry configurations via retryConfigs:
     * - initial: Quick search (default 30s)
     * - aggressive: Final search before create (default 60s)
     */
    private async findOrCreateWithRetry(options: PersonMatchOptions): Promise<FlattenedPersonResource> {
        const { 
            createIfNotFound = false, 
            matchStrategy = 'fuzzy', 
            searchStrategy = 'single',
            addMissingContactInfo = false, 
            retryConfig,
            retryConfigs,
            ...searchOptions 
        } = options;
        
        // Determine which retry configuration to use
        // Priority: retryConfigs.initial > retryConfig > defaults
        const effectiveRetryConfig = this.resolveRetryConfig(retryConfig, retryConfigs?.initial);
        
        const maxRetries = effectiveRetryConfig.maxRetries;
        const maxWaitTime = effectiveRetryConfig.maxWaitTime;
        const initialDelay = effectiveRetryConfig.initialDelay;
        const backoffMultiplier = effectiveRetryConfig.backoffMultiplier;

        let totalWaitTime = 0;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Try to find existing person using appropriate search strategy
                let match: MatchResult | null = null;
                
                if (searchStrategy === 'multi-step') {
                    match = await this.findMatchMultiStep(options);
                } else {
                    match = await this.findMatch({ ...searchOptions, matchStrategy });
                }

                if (match) {
                    const person = match.person;
                    
                    // Add missing contact information if requested
                    if (addMissingContactInfo) {
                        await this.addMissingContactInfo(person, options);
                    }
                    
                    // Log success if we had to retry
                    if (attempt > 1) {
                        this.debugLog(`findOrCreate  found person after ${attempt} attempts (waited ${totalWaitTime}ms)`, {
                            personId: person.id,
                            attempt,
                            totalWaitTime,
                            searchStrategy,
                        });
                    }
                    
                    return person;
                }

                // No match found - this might be because contacts aren't verified yet
                lastError = new Error(`No matching person found and creation is disabled`);
                
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
            }

            // Don't retry on the last attempt
            if (attempt === maxRetries) {
                break;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
                initialDelay * Math.pow(backoffMultiplier, attempt - 1),
                maxWaitTime - totalWaitTime // Don't exceed maxWaitTime
            );

            // Check if we've exceeded max wait time
            if (totalWaitTime + delay > maxWaitTime) {
                this.debugLog(`findOrCreate  max wait time (${maxWaitTime}ms) exceeded, stopping retries`, {
                    attempt,
                    totalWaitTime,
                    remainingDelay: maxWaitTime - totalWaitTime
                });
                break;
            }

            totalWaitTime += delay;

            // Log retry attempt
            this.debugLog(`findOrCreate  attempt ${attempt} failed, retrying in ${delay}ms`, {
                attempt,
                delay,
                totalWaitTime,
                errorMessage: lastError?.message,
                maxRetries,
                maxWaitTime
            });

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // All retries exhausted - throw error
        throw lastError || new Error(`No matching person found after ${maxRetries} attempts (waited ${totalWaitTime}ms) and creation is disabled`);
    }

    /**
     * Find the best match for a person
     */
    async findMatch(options: PersonMatchOptions): Promise<MatchResult | null> {
        const { 
            matchStrategy = 'fuzzy', 
            email, 
            phone, 
            firstName, 
            lastName,
            fallbackToNameSearch = false,
            contactValidation = 'similarity'
        } = options;

        // Step 1: Try email/phone search first
        const emailPhoneMatches: FlattenedPersonResource[] = [];
        const nameOnlyMatches: FlattenedPersonResource[] = [];

        // Search by email (with normalization and validation)
        if (email) {
            // Validate email format to avoid wasted API calls
            if (isValidEmail(email)) {
                try {
                    // Normalize email before search to improve PCO search results
                    const normalizedEmail = normalizeEmail(email);
                    const emailResults = await this.peopleModule.search({ email: normalizedEmail });
                    emailPhoneMatches.push(...emailResults.data);
                } catch {
                    // Email search failed, continue without email results
                }
            }
        }

        // Search by phone (with normalization)
        if (phone) {
            try {
                // Normalize phone before search to improve PCO search results
                const normalizedPhone = normalizePhone(phone);
                const phoneResults = await this.peopleModule.search({ phone: normalizedPhone });
                emailPhoneMatches.push(...phoneResults.data);
            } catch {
                // Phone search failed, continue without phone results
            }
        }

        // Remove duplicates
        const uniqueEmailPhoneMatches = emailPhoneMatches.filter(
            (person, index, self) => index === self.findIndex(p => p.id === person.id)
        );

        // Step 2: Verify email/phone actually match
        const verifiedMatches: FlattenedPersonResource[] = [];
        for (const candidate of uniqueEmailPhoneMatches) {
            let emailMatches = false;
            let phoneMatches = false;

            if (email) {
                emailMatches = await this.verifyEmailMatch(candidate, email);
            }
            if (phone) {
                phoneMatches = await this.verifyPhoneMatch(candidate, phone);
            }

            // Only include if email OR phone matches (at least one required)
            if (emailMatches || phoneMatches) {
                verifiedMatches.push(candidate);
            }
        }

        // Step 3: Only search by name if:
        //   - Email/phone search found multiple verified results (need name to distinguish), OR
        //   - No email/phone was provided (name-only matching is OK)
        //   NOTE: Do NOT search by name if email/phone were provided but don't match
        if (verifiedMatches.length > 1 || (!email && !phone)) {
            
            if (firstName && lastName) {
                try {
                    const nameResults = await this.peopleModule.search({
                        name: `${firstName} ${lastName}`
                    });
                    nameOnlyMatches.push(...nameResults.data);
                } catch (error) {
                    this.debugLog('findMatch  name search failed', { error: String(error) });
                }
            }
        }

        // Step 4: Combine verified email/phone matches with name matches
        // Prioritize email/phone matches over name-only matches
        const allCandidates = [...verifiedMatches, ...nameOnlyMatches];

        // Remove duplicates
        const uniqueCandidates = allCandidates.filter(
            (person, index, self) => index === self.findIndex(p => p.id === person.id)
        );

        // Filter by age preferences
        const ageFilteredCandidates = this.filterByAgePreferences(
            uniqueCandidates, 
            options
        );

        if (ageFilteredCandidates.length === 0) {
            return null;
        }

        // Score and rank candidates
        const scoredCandidates = await Promise.all(
            ageFilteredCandidates.map(async (candidate) => ({
            person: candidate,
                score: await this.scorer.scoreMatch(candidate, options),
                reason: await this.scorer.getMatchReason(candidate, options),
                // Mark if this is a verified email/phone match
                isVerifiedContactMatch: verifiedMatches.some(v => v.id === candidate.id)
            }))
        );

        // Sort by verified match first, then by score
        scoredCandidates.sort((a, b) => {
            if (a.isVerifiedContactMatch && !b.isVerifiedContactMatch) return -1;
            if (!a.isVerifiedContactMatch && b.isVerifiedContactMatch) return 1;
            return b.score - a.score;
        });

        // For "exact" strategy, only return verified email/phone matches
        if (matchStrategy === 'exact') {
            const exactMatches = scoredCandidates.filter(
                c => c.isVerifiedContactMatch && c.score >= 0.8
            );
            if (exactMatches.length > 0) {
                return exactMatches[0];
            }
            // Continue to fallback if enabled
        } else {
            // Apply strategy-specific filtering
            const bestMatch = this.strategies.selectBestMatch(scoredCandidates, matchStrategy);
            if (bestMatch) {
                return bestMatch;
            }
            // Continue to fallback if enabled
        }

        // Step 5: Fallback to name-based search with contact validation
        // Only used when email/phone search fails to find a match
        if (fallbackToNameSearch && firstName && lastName && (email || phone)) {
            const nameSearchMatch = await this.findMatchByNameWithContactValidation(
                firstName,
                lastName,
                email,
                phone,
                contactValidation,
                options
            );
            if (nameSearchMatch) {
                return nameSearchMatch;
            }
        }

        return null;
    }

    /**
     * Find a match by name with contact validation
     * 
     * This is a fallback when email/phone search fails. It searches by name
     * but validates that the person's contact info is similar to prevent
     * wrong-person matches (e.g., two people named "John Smith").
     */
    private async findMatchByNameWithContactValidation(
        firstName: string,
        lastName: string,
        searchEmail: string | undefined,
        searchPhone: string | undefined,
        validationStrategy: 'strict' | 'domain' | 'similarity',
        options: PersonMatchOptions
    ): Promise<MatchResult | null> {
        try {
            const nameResults = await this.peopleModule.search({
                name: `${firstName} ${lastName}`
            });
            
            if (nameResults.data.length === 0) {
                return null;
            }
            
            // Validate each candidate's contact info
            for (const candidate of nameResults.data) {
                const isValid = await this.validateCandidateContact(
                    candidate,
                    searchEmail,
                    searchPhone,
                    validationStrategy
                );
                
                if (isValid) {
                    const score = await this.scorer.scoreMatch(candidate, options);
                    const reason = await this.scorer.getMatchReason(candidate, options);
                    
                    return {
                        person: candidate,
                        score,
                        reason: `name match with ${validationStrategy} contact validation, ${reason}`,
                        isVerifiedContactMatch: false, // Not a direct contact match
                    };
                }
            }
            
            return null;
        } catch {
            return null;
        }
    }

    /**
     * Validate a candidate's contact info based on the validation strategy
     */
    private async validateCandidateContact(
        candidate: FlattenedPersonResource,
        searchEmail: string | undefined,
        searchPhone: string | undefined,
        validationStrategy: 'strict' | 'domain' | 'similarity'
    ): Promise<boolean> {
        try {
            // Get person's contact info
            const [personEmails, personPhones] = await Promise.all([
                this.peopleModule.getEmails(candidate.id).then(r => 
                    r.data?.map(e => e.address || '').filter(Boolean) || []
                ).catch(() => []),
                this.peopleModule.getPhoneNumbers(candidate.id).then(r => 
                    r.data?.map(p => p.number || '').filter(Boolean) || []
                ).catch(() => []),
            ]);
            
            switch (validationStrategy) {
                case 'strict':
                    // Require exact match
                    if (searchEmail) {
                        const normalizedSearch = normalizeEmail(searchEmail);
                        if (personEmails.some(e => normalizeEmail(e) === normalizedSearch)) {
                            return true;
                        }
                    }
                    if (searchPhone) {
                        const normalizedSearch = normalizePhone(searchPhone);
                        if (personPhones.some(p => normalizePhone(p) === normalizedSearch)) {
                            return true;
                        }
                    }
                    return false;
                    
                case 'domain':
                    // Require domain match for email or exact match for phone
                    if (searchEmail && personEmails.some(e => emailDomainsMatch(searchEmail, e))) {
                        return true;
                    }
                    if (searchPhone) {
                        const normalizedSearch = normalizePhone(searchPhone);
                        if (personPhones.some(p => normalizePhone(p) === normalizedSearch)) {
                            return true;
                        }
                    }
                    return false;
                    
                case 'similarity':
                default:
                    // Use domain matching for email and similarity for phone
                    const validation = validateContactSimilarity(
                        searchEmail,
                        searchPhone,
                        personEmails,
                        personPhones
                    );
                    return validation.isValid;
            }
        } catch (error) {
            this.debugLog(`findMatch  contact validation failed for person ${candidate.id}`, { error: String(error) });
            return false;
        }
    }

    /**
     * Get potential matching candidates
     * @deprecated Use findMatch which has improved logic for separating verified matches from name-only matches
     */
    private async getCandidates(options: PersonMatchOptions): Promise<FlattenedPersonResource[]> {
        const candidates: FlattenedPersonResource[] = [];
        const { email, phone, firstName, lastName } = options;

        // Strategy 1: Exact email match
        if (email) {
            try {
                const emailMatches = await this.peopleModule.search({ email });
                candidates.push(...emailMatches.data);
            } catch (error) {
                this.debugLog('findMatch  email search failed', { error: String(error) });
            }
        }

        // Strategy 2: Exact phone match
        if (phone) {
            try {
                const phoneMatches = await this.peopleModule.search({ phone });
                candidates.push(...phoneMatches.data);
            } catch (error) {
                this.debugLog('findMatch  phone search failed', { error: String(error) });
            }
        }

        // Strategy 3: Name-based search
        if (firstName && lastName) {
            try {
                const nameMatches = await this.peopleModule.search({
                    name: `${firstName} ${lastName}`
                });
                candidates.push(...nameMatches.data);
            } catch (error) {
                this.debugLog('findMatch  name search failed', { error: String(error) });
            }
        }

        // Strategy 4: Broader search if no exact matches
        if (candidates.length === 0 && (firstName || lastName)) {
            try {
                const broadMatches = await this.peopleModule.search({
                    name: firstName || lastName || '',
                });
                candidates.push(...broadMatches.data);
            } catch (error) {
                this.debugLog('findMatch  broad search failed', { error: String(error) });
            }
        }

        // Remove duplicates based on person ID
        const uniqueCandidates = candidates.filter((person, index, self) =>
            index === self.findIndex(p => p.id === person.id)
        );

        // Filter by age preferences if specified
        const ageFilteredCandidates = this.filterByAgePreferences(uniqueCandidates, options);

        return ageFilteredCandidates;
    }

    /**
     * Verify if a person's email actually matches the search email
     */
    private async verifyEmailMatch(person: FlattenedPersonResource, email: string): Promise<boolean> {
        try {
            const personEmails = await this.peopleModule.getEmails(person.id);
            const normalizedSearchEmail = normalizeEmail(email);
            const emails = personEmails.data?.map(e => 
                normalizeEmail(e.address || '')
            ).filter(Boolean) || [];
            return emails.includes(normalizedSearchEmail);
        } catch {
            return false;
        }
    }

    /**
     * Verify if a person's phone actually matches the search phone
     */
    private async verifyPhoneMatch(person: FlattenedPersonResource, phone: string): Promise<boolean> {
        try {
            const personPhones = await this.peopleModule.getPhoneNumbers(person.id);
            const normalizedSearchPhone = normalizePhone(phone);
            const phones = personPhones.data?.map(p => 
                normalizePhone(p.number || '')
            ).filter(Boolean) || [];
            return phones.includes(normalizedSearchPhone);
        } catch {
            return false;
        }
    }

    /**
     * Add missing contact information to a person's profile
     */
    private async addMissingContactInfo(person: FlattenedPersonResource, options: PersonMatchOptions): Promise<void> {
        const { email, phone } = options;

        // Check and add email if provided and missing
        if (email) {
            try {
                const hasEmail = await this.verifyEmailMatch(person, email);
                if (!hasEmail) {
                    await this.peopleModule.addEmail(person.id, {
                        address: email,
                        location: 'Home',
                        primary: false // Don't override existing primary email
                    });
                }
            } catch (error) {
                this.debugLog(`addMissingContactInfo  failed to add email for person ${person.id}`, { error: String(error) });
            }
        }

        // Check and add phone if provided and missing
        if (phone) {
            try {
                const hasPhone = await this.verifyPhoneMatch(person, phone);
                if (!hasPhone) {
                    await this.peopleModule.addPhoneNumber(person.id, {
                        number: phone,
                        location: 'Home',
                        primary: false // Don't override existing primary phone
                    });
                }
            } catch (error) {
                this.debugLog(`addMissingContactInfo  failed to add phone for person ${person.id}`, { error: String(error) });
            }
        }
    }

    /**
     * Filter candidates by age preferences
     */
    private filterByAgePreferences(candidates: FlattenedPersonResource[], options: PersonMatchOptions): FlattenedPersonResource[] {
        // If no age criteria specified, return all candidates
        if (!options.agePreference &&
            options.minAge === undefined &&
            options.maxAge === undefined &&
            options.birthYear === undefined) {
            return candidates;
        }

        return candidates.filter(person => {
            const birthdate = person.birthdate;
            return matchesAgeCriteria(birthdate, {
                agePreference: options.agePreference,
                minAge: options.minAge,
                maxAge: options.maxAge,
                birthYear: options.birthYear,
                agePreferenceLenient: options.agePreferenceLenient
            });
        });
    }

    /**
     * Create a new person
     */
    private async createPerson(options: PersonMatchOptions): Promise<FlattenedPersonResource> {
        // Validate firstName is required for person creation
        if (!options.firstName?.trim()) {
            throw new Error('First name is required to create a person');
        }

        // Create basic person data (only name fields)
        // Use camelCase as expected by PersonCreateOptions
        const personData: Partial<import('../modules/people').PersonCreateOptions> = {};

        if (options.firstName) personData.firstName = options.firstName;
        if (options.lastName) personData.lastName = options.lastName;
        // Status is required by the API
        personData.status = 'active';

        // Create the person first
        const person = await this.peopleModule.create(personData);

        // Add email contact if provided
        if (options.email) {
            try {
                await this.peopleModule.addEmail(person.id, {
                    address: options.email,
                    location: 'Home', // Required field
                    primary: true
                });
            } catch (error) {
                this.debugLog(`createPerson  failed to create email for person ${person.id}`, { error: String(error) });
            }
        }

        // Add phone contact if provided
        if (options.phone) {
            try {
                await this.peopleModule.addPhoneNumber(person.id, {
                    number: options.phone,
                    location: 'Home', // Required field
                    primary: true
                });
            } catch (error) {
                this.debugLog(`createPerson  failed to create phone for person ${person.id}`, { error: String(error) });
            }
        }

        // Set campus if provided
        if (options.campusId) {
            await this.peopleModule.setPrimaryCampus(person.id, options.campusId);
        }

        // Return the flattened person resource to match the type expected by the rest of the code
        return this.peopleModule.getById(person.id);
    }

    /**
     * Get all potential matches with detailed scoring
     */
    async getAllMatches(options: PersonMatchOptions): Promise<MatchResult[]> {
        // Use the improved matching logic from findMatch
        const { matchStrategy = 'fuzzy', email, phone, firstName, lastName } = options;

        const emailPhoneMatches: FlattenedPersonResource[] = [];
        const nameOnlyMatches: FlattenedPersonResource[] = [];

        if (email) {
            try {
                const emailResults = await this.peopleModule.search({ email });
                emailPhoneMatches.push(...emailResults.data);
            } catch (error) {
                this.debugLog('findMatch  email search failed', { error: String(error) });
            }
        }

        if (phone) {
            try {
                const phoneResults = await this.peopleModule.search({ phone });
                emailPhoneMatches.push(...phoneResults.data);
            } catch (error) {
                this.debugLog('findMatch  phone search failed', { error: String(error) });
            }
        }

        const uniqueEmailPhoneMatches = emailPhoneMatches.filter(
            (person, index, self) => index === self.findIndex(p => p.id === person.id)
        );

        const verifiedMatches: FlattenedPersonResource[] = [];
        for (const candidate of uniqueEmailPhoneMatches) {
            let emailMatches = false;
            let phoneMatches = false;

            if (email) {
                emailMatches = await this.verifyEmailMatch(candidate, email);
            }
            if (phone) {
                phoneMatches = await this.verifyPhoneMatch(candidate, phone);
            }

            if (emailMatches || phoneMatches) {
                verifiedMatches.push(candidate);
            }
        }

        if (verifiedMatches.length > 1 || (!email && !phone)) {
            
            if (firstName && lastName) {
                try {
                    const nameResults = await this.peopleModule.search({
                        name: `${firstName} ${lastName}`
                    });
                    nameOnlyMatches.push(...nameResults.data);
                } catch (error) {
                    this.debugLog('findMatch  name search failed', { error: String(error) });
                }
            }
        }

        const allCandidates = [...verifiedMatches, ...nameOnlyMatches];
        const uniqueCandidates = allCandidates.filter(
            (person, index, self) => index === self.findIndex(p => p.id === person.id)
        );

        const ageFilteredCandidates = this.filterByAgePreferences(
            uniqueCandidates, 
            options
        );

        const scoredCandidates = await Promise.all(
            ageFilteredCandidates.map(async (candidate) => ({
            person: candidate,
                score: await this.scorer.scoreMatch(candidate, options),
                reason: await this.scorer.getMatchReason(candidate, options),
                isVerifiedContactMatch: verifiedMatches.some(v => v.id === candidate.id)
            }))
        );

        return scoredCandidates.sort((a, b) => {
            if (a.isVerifiedContactMatch && !b.isVerifiedContactMatch) return -1;
            if (!a.isVerifiedContactMatch && b.isVerifiedContactMatch) return 1;
            return b.score - a.score;
        });
    }

    /**
     * Check if a person matches the given criteria
     */
    async isMatch(personId: string, options: PersonMatchOptions): Promise<MatchResult | null> {
        const person = await this.peopleModule.getById(personId);
        const score = await this.scorer.scoreMatch(person, options);

        if (score > 0.5) { // Threshold for considering it a match
            // Check if this is a verified contact match
            let isVerifiedContactMatch = false;
            if (options.email) {
                isVerifiedContactMatch = await this.verifyEmailMatch(person, options.email);
            }
            if (!isVerifiedContactMatch && options.phone) {
                isVerifiedContactMatch = await this.verifyPhoneMatch(person, options.phone);
            }

            return {
                person,
                score,
                reason: await this.scorer.getMatchReason(person, options),
                isVerifiedContactMatch,
            };
        }

        return null;
    }
}
