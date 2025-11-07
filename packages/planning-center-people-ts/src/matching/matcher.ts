/**
 * v2.0.0 Person Matching Logic
 */

import type { PeopleModule } from '../modules/people';
import type { PersonResource } from '../types';
import { PersonMatchOptions } from '../modules/people';
import { MatchStrategies } from './strategies';
import { MatchScorer } from './scoring';
import { matchesAgeCriteria, normalizeEmail, normalizePhone, isValidEmail } from '../helpers';

export interface MatchResult {
    person: PersonResource;
    score: number;
    reason: string;
    isVerifiedContactMatch?: boolean; // True if email/phone actually matches
}

export class PersonMatcher {
    private strategies: MatchStrategies;
    private scorer: MatchScorer;

    constructor(private peopleModule: PeopleModule) {
        this.strategies = new MatchStrategies();
        this.scorer = new MatchScorer(peopleModule);
    }

    /**
     * Find or create a person with smart matching
     * 
     * Uses intelligent matching logic that:
     * - Verifies email/phone matches by checking actual contact information
     * - Only uses name matching when appropriate (multiple people share contact info, or no contact info provided)
     * - Can automatically add missing contact information when a match is found (if addMissingContactInfo is true)
     * - Retries with exponential backoff when contacts may not be verified yet (PCO takes 30-90+ seconds)
     * 
     * @param options - Matching options
     * @param options.addMissingContactInfo - If true, automatically adds missing email/phone to matched person's profile
     * @param options.retryConfig - Configuration for retry logic to handle PCO contact verification delays
     */
    async findOrCreate(options: PersonMatchOptions): Promise<PersonResource> {
        const { createIfNotFound = true, matchStrategy = 'fuzzy', addMissingContactInfo = false, retryConfig, ...searchOptions } = options;

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

        // Try to find existing person
        const match = await this.findMatch({ ...searchOptions, matchStrategy });

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
            return this.createPerson(options);
        }

        throw new Error(`No matching person found and creation is disabled`);
    }

    /**
     * Find or create with retry logic to handle PCO contact verification delays
     * 
     * PCO takes 30-90+ seconds to verify/index contacts after a person is created.
     * This method retries with exponential backoff to give PCO time to process contacts.
     */
    private async findOrCreateWithRetry(options: PersonMatchOptions): Promise<PersonResource> {
        const { createIfNotFound = false, matchStrategy = 'fuzzy', addMissingContactInfo = false, retryConfig, ...searchOptions } = options;
        
        // Default retry configuration
        const maxRetries = retryConfig?.maxRetries ?? 5;
        const maxWaitTime = retryConfig?.maxWaitTime ?? 120000; // 120 seconds
        const initialDelay = retryConfig?.initialDelay ?? 10000; // 10 seconds
        const backoffMultiplier = retryConfig?.backoffMultiplier ?? 1.5;

        let totalWaitTime = 0;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Try to find existing person
                const match = await this.findMatch({ ...searchOptions, matchStrategy });

                if (match) {
                    const person = match.person;
                    
                    // Add missing contact information if requested
                    if (addMissingContactInfo) {
                        await this.addMissingContactInfo(person, options);
                    }
                    
                    // Log success if we had to retry
                    if (attempt > 1) {
                        console.log(`[PERSON_MATCH] Found person after ${attempt} attempts (waited ${totalWaitTime}ms)`, {
                            personId: person.id,
                            attempt,
                            totalWaitTime
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
                console.warn(`[PERSON_MATCH] Max wait time (${maxWaitTime}ms) exceeded, stopping retries`, {
                    attempt,
                    totalWaitTime,
                    remainingDelay: maxWaitTime - totalWaitTime
                });
                break;
            }

            totalWaitTime += delay;

            // Log retry attempt
            console.log(`[PERSON_MATCH] Attempt ${attempt} failed, retrying in ${delay}ms`, {
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
        const { matchStrategy = 'fuzzy', email, phone, firstName, lastName } = options;

        // Step 1: Try email/phone search first
        const emailPhoneMatches: PersonResource[] = [];
        const nameOnlyMatches: PersonResource[] = [];

        // Search by email (with normalization and validation)
        if (email) {
            // Validate email format to avoid wasted API calls
            if (!isValidEmail(email)) {
                console.warn('Invalid email format, skipping email search:', email);
            } else {
                try {
                    // Normalize email before search to improve PCO search results
                    const normalizedEmail = normalizeEmail(email);
                    const emailResults = await this.peopleModule.search({ email: normalizedEmail });
                    emailPhoneMatches.push(...emailResults.data);
                } catch (error) {
                    console.warn('Email search failed:', error);
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
            } catch (error) {
                console.warn('Phone search failed:', error);
            }
        }

        // Remove duplicates
        const uniqueEmailPhoneMatches = emailPhoneMatches.filter(
            (person, index, self) => index === self.findIndex(p => p.id === person.id)
        );

        // Step 2: Verify email/phone actually match
        const verifiedMatches: PersonResource[] = [];
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
                    console.warn('Name search failed:', error);
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
            return exactMatches.length > 0 ? exactMatches[0] : null;
        }

        // Apply strategy-specific filtering
        const bestMatch = this.strategies.selectBestMatch(scoredCandidates, matchStrategy);
        return bestMatch;
    }

    /**
     * Get potential matching candidates
     * @deprecated Use findMatch which has improved logic for separating verified matches from name-only matches
     */
    private async getCandidates(options: PersonMatchOptions): Promise<PersonResource[]> {
        const candidates: PersonResource[] = [];
        const { email, phone, firstName, lastName } = options;

        // Strategy 1: Exact email match
        if (email) {
            try {
                const emailMatches = await this.peopleModule.search({ email });
                candidates.push(...emailMatches.data);
            } catch (error) {
                console.warn('Email search failed:', error);
            }
        }

        // Strategy 2: Exact phone match
        if (phone) {
            try {
                const phoneMatches = await this.peopleModule.search({ phone });
                candidates.push(...phoneMatches.data);
            } catch (error) {
                console.warn('Phone search failed:', error);
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
                console.warn('Name search failed:', error);
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
                console.warn('Broad search failed:', error);
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
    private async verifyEmailMatch(person: PersonResource, email: string): Promise<boolean> {
        try {
            const personEmails = await this.peopleModule.getEmails(person.id);
            const normalizedSearchEmail = normalizeEmail(email);
            const emails = personEmails.data?.map(e => 
                normalizeEmail(e.attributes?.address || '')
            ).filter(Boolean) || [];
            return emails.includes(normalizedSearchEmail);
        } catch {
            return false;
        }
    }

    /**
     * Verify if a person's phone actually matches the search phone
     */
    private async verifyPhoneMatch(person: PersonResource, phone: string): Promise<boolean> {
        try {
            const personPhones = await this.peopleModule.getPhoneNumbers(person.id);
            const normalizedSearchPhone = normalizePhone(phone);
            const phones = personPhones.data?.map(p => 
                normalizePhone(p.attributes?.number || '')
            ).filter(Boolean) || [];
            return phones.includes(normalizedSearchPhone);
        } catch {
            return false;
        }
    }

    /**
     * Add missing contact information to a person's profile
     */
    private async addMissingContactInfo(person: PersonResource, options: PersonMatchOptions): Promise<void> {
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
                console.warn(`Failed to add email contact for person ${person.id}:`, error);
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
                console.warn(`Failed to add phone contact for person ${person.id}:`, error);
            }
        }
    }

    /**
     * Filter candidates by age preferences
     */
    private filterByAgePreferences(candidates: PersonResource[], options: PersonMatchOptions): PersonResource[] {
        // If no age criteria specified, return all candidates
        if (!options.agePreference &&
            options.minAge === undefined &&
            options.maxAge === undefined &&
            options.birthYear === undefined) {
            return candidates;
        }

        return candidates.filter(person => {
            const birthdate = person.attributes?.birthdate;
            return matchesAgeCriteria(birthdate, {
                agePreference: options.agePreference,
                minAge: options.minAge,
                maxAge: options.maxAge,
                birthYear: options.birthYear
            });
        });
    }

    /**
     * Create a new person
     */
    private async createPerson(options: PersonMatchOptions): Promise<PersonResource> {
        // Validate firstName is required for person creation
        if (!options.firstName?.trim()) {
            throw new Error('First name is required to create a person');
        }

        // Create basic person data (only name fields)
        const personData: any = {};

        if (options.firstName) personData.first_name = options.firstName;
        if (options.lastName) personData.last_name = options.lastName;

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
                console.warn(`Failed to create email contact for person ${person.id}:`, error);
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
                console.warn(`Failed to create phone contact for person ${person.id}:`, error);
            }
        }

        // Set campus if provided
        if (options.campusId) {
            try {
                await this.peopleModule.setPrimaryCampus(person.id, options.campusId);
            } catch (error) {
                console.warn(`Failed to set campus for person ${person.id}:`, error);
            }
        }

        return person;
    }

    /**
     * Get all potential matches with detailed scoring
     */
    async getAllMatches(options: PersonMatchOptions): Promise<MatchResult[]> {
        // Use the improved matching logic from findMatch
        const { matchStrategy = 'fuzzy', email, phone, firstName, lastName } = options;

        const emailPhoneMatches: PersonResource[] = [];
        const nameOnlyMatches: PersonResource[] = [];

        if (email) {
            try {
                const emailResults = await this.peopleModule.search({ email });
                emailPhoneMatches.push(...emailResults.data);
            } catch (error) {
                console.warn('Email search failed:', error);
            }
        }

        if (phone) {
            try {
                const phoneResults = await this.peopleModule.search({ phone });
                emailPhoneMatches.push(...phoneResults.data);
            } catch (error) {
                console.warn('Phone search failed:', error);
            }
        }

        const uniqueEmailPhoneMatches = emailPhoneMatches.filter(
            (person, index, self) => index === self.findIndex(p => p.id === person.id)
        );

        const verifiedMatches: PersonResource[] = [];
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
                    console.warn('Name search failed:', error);
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
