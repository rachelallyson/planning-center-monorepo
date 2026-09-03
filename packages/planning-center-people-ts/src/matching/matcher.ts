/**
 * v2.0.0 Person Matching Logic
 */

import { createDebugLogger, singleFromCreateResponse } from '@rachelallyson/planning-center-base-ts';
import type { PcoClientConfig } from '@rachelallyson/planning-center-base-ts';
import type { PersonMatcherDeps } from '../modules/people';
import type { PersonAttributes, PersonResource } from '../types';
import {
    PersonMatchOptions,
    RetryConfig,
    DEFAULT_INITIAL_RETRY_CONFIG,
    DEFAULT_AGGRESSIVE_RETRY_CONFIG
} from '../modules/people';
import { MatchStrategies } from './strategies';
import { MatchScorer } from './scoring';
import { SearchFaultLedger } from './search-outcome';
import type { SearchFault, SearchOutcome } from './search-outcome';
import { NoMatchingPersonError, PcoSearchUnavailableError } from './errors';
import {
    matchesAgeCriteria,
    normalizeEmail,
    normalizePhone,
    isValidEmail,
    validateContactSimilarity,
    emailDomainsMatch
} from '../helpers';

export interface MatchResult {
    person: PersonResource;
    score: number;
    reason: string;
    isVerifiedContactMatch?: boolean; // True if email/phone actually matches
}

/**
 * What a single search attempt established: a match, a confirmed absence, or
 * nothing at all because PCO did not answer.
 *
 * Only `'empty'` is a confirmed absence, and only a confirmed absence may lead to
 * creating a person. See `./search-outcome` for why this distinction has to be
 * carried rather than reconstructed.
 */
export type PersonSearchOutcome = SearchOutcome<MatchResult>;

export class PersonMatcher {
    private strategies: MatchStrategies;
    private scorer: MatchScorer;
    private getConfig?: () => PcoClientConfig;

    constructor(private peopleModule: PersonMatcherDeps, getConfig?: () => PcoClientConfig) {
        this.getConfig = getConfig;
        this.strategies = new MatchStrategies();
        this.scorer = new MatchScorer(peopleModule, getConfig);
    }

    /** Log only when client config has debug enabled; no-op otherwise */
    private debugLog(message: string, data?: object): void {
        const logger = createDebugLogger(this.getConfig?.());
        if (logger.enabled) logger.log(message, data);
    }

    /** Get one retry config number from config, phaseConfig, or defaults */
    private static getRetryNumber(
        config: RetryConfig | undefined,
        phaseConfig: RetryConfig | undefined,
        defaults: Required<Omit<RetryConfig, 'enabled'>>,
        key: keyof Required<Omit<RetryConfig, 'enabled'>>
    ): number {
        const source = phaseConfig ?? config;
        const raw = source?.[key] ?? defaults[key];
        return typeof raw === 'number' ? raw : defaults[key];
    }

    /**
     * Resolve retry configuration from options, with defaults
     */
    private resolveRetryConfig(
        explicitConfig?: RetryConfig,
        phaseConfig?: RetryConfig,
        defaults: Required<Omit<RetryConfig, 'enabled'>> = DEFAULT_INITIAL_RETRY_CONFIG
    ): Required<Omit<RetryConfig, 'enabled'>> {
        const config = phaseConfig ?? explicitConfig;
        return {
            maxRetries: PersonMatcher.getRetryNumber(config, phaseConfig, defaults, 'maxRetries'),
            maxWaitTime: PersonMatcher.getRetryNumber(config, phaseConfig, defaults, 'maxWaitTime'),
            initialDelay: PersonMatcher.getRetryNumber(config, phaseConfig, defaults, 'initialDelay'),
            backoffMultiplier: PersonMatcher.getRetryNumber(config, phaseConfig, defaults, 'backoffMultiplier'),
        };
    }

    private static shouldUseRetry(options: PersonMatchOptions): boolean {
        const hasContactInfo = !!(options.email || options.phone);
        const createIfNotFound = options.createIfNotFound !== false;
        return hasContactInfo && !createIfNotFound && (options.retryConfig?.enabled !== false);
    }

    private async performSearch(
        options: PersonMatchOptions,
        ledger: SearchFaultLedger
    ): Promise<MatchResult | null> {
        const { searchStrategy = 'single', matchStrategy = 'fuzzy', ...searchOptions } = options;
        if (searchStrategy === 'multi-step') {
            return this.findMatchMultiStep(options, ledger);
        }
        return this.findMatch({ ...searchOptions, matchStrategy }, ledger);
    }

    /** Collapse a completed attempt and its ledger into the three-valued answer. */
    private static toOutcome(match: MatchResult | null, ledger: SearchFaultLedger): PersonSearchOutcome {
        if (match) return { kind: 'match', match };
        if (ledger.degraded) return { kind: 'degraded', faults: ledger.causes };
        return { kind: 'empty' };
    }

    /**
     * Run one complete search and report what it established.
     *
     * The ledger is created here, per attempt, and never held on the instance:
     * `PersonMatcher` is shared across concurrent `findOrCreate` calls, so an
     * instance field would leak one caller's outage into another caller's decision.
     *
     * An error that escapes the search entirely is classified the same way as one
     * that was swallowed inside it, which is what keeps a 404 (definitively absent,
     * so `'empty'`) distinct from a 500 (`'degraded'`).
     */
    private async attemptSearch(options: PersonMatchOptions): Promise<PersonSearchOutcome> {
        const ledger = new SearchFaultLedger();
        try {
            const match = await this.performSearch(options, ledger);
            return PersonMatcher.toOutcome(match, ledger);
        } catch (error) {
            ledger.record('search', error);
            return PersonMatcher.toOutcome(null, ledger);
        }
    }

    /**
     * Find the best match and say whether the answer can be trusted.
     *
     * The distinguishable-outcome counterpart to `findMatch`, for callers that want
     * to tell "not there" from "could not tell" without catching an exception.
     */
    async findMatchWithOutcome(options: PersonMatchOptions): Promise<PersonSearchOutcome> {
        return this.attemptSearch(options);
    }

    private async whenMatchFound(match: MatchResult, options: PersonMatchOptions): Promise<PersonResource> {
        if (options.addMissingContactInfo) {
            await this.addMissingContactInfo(match.person, options);
        }
        return match.person;
    }

    /**
     * The gate between "we did not find this person" and "so make a new one".
     *
     * A create may only follow a search that COMPLETED and found nobody. If the
     * governing outcome is `degraded`, the absence of a match is not evidence of
     * anything and creating would be the duplicate-generating bug this whole change
     * exists to close.
     *
     * Throwing rather than returning a sentinel is deliberate: the caller's job must
     * fail and be retried later. A sentinel would rebuild the same bug one level up,
     * where someone reads "no person" and creates one anyway.
     */
    private async whenCreateIfNotFound(
        options: PersonMatchOptions,
        initialOutcome: PersonSearchOutcome
    ): Promise<PersonResource> {
        const outcome = options.retryConfigs?.aggressive
            ? await this.findWithAggressiveRetry(options, initialOutcome)
            : initialOutcome;
        if (outcome.kind === 'match') {
            return this.whenMatchFound(outcome.match, options);
        }
        if (PersonMatcher.mustRefuseCreate(outcome, options)) {
            throw new PcoSearchUnavailableError(outcome.faults);
        }
        return this.createPerson(options);
    }

    /**
     * Whether this outcome forbids creating: PCO did not answer, and the caller has
     * not explicitly opted back into the old create-anyway behaviour.
     */
    private static mustRefuseCreate(
        outcome: PersonSearchOutcome,
        options: PersonMatchOptions
    ): outcome is { kind: 'degraded'; faults: SearchFault[] } {
        return outcome.kind === 'degraded' && options.createOnDegradedSearch !== true;
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
    async findOrCreate(options: PersonMatchOptions) {
        if (PersonMatcher.shouldUseRetry(options)) {
            return this.findOrCreateWithRetry(options);
        }
        const outcome = await this.attemptSearch(options);
        if (outcome.kind === 'match') {
            return this.whenMatchFound(outcome.match, options);
        }
        if (options.createIfNotFound !== false) {
            return this.whenCreateIfNotFound(options, outcome);
        }
        if (outcome.kind === 'degraded') {
            throw new PcoSearchUnavailableError(outcome.faults, 'report no match');
        }
        throw new NoMatchingPersonError();
    }

    private async runOneAggressiveAttempt(
        options: PersonMatchOptions,
        ledger: SearchFaultLedger
    ): Promise<MatchResult | null> {
        const { searchStrategy = 'single', matchStrategy = 'fuzzy' } = options;
        if (searchStrategy === 'multi-step') {
            return this.findMatchMultiStep(options, ledger);
        }
        return this.findMatch({ ...options, matchStrategy }, ledger);
    }

    private static computeAggressiveDelay(
        attempt: number,
        totalWaitTime: number,
        config: Required<Omit<RetryConfig, 'enabled'>>
    ): number | null {
        if (attempt === config.maxRetries) return null;
        const delay = Math.min(
            config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
            config.maxWaitTime - totalWaitTime
        );
        if (totalWaitTime + delay > config.maxWaitTime) return null;
        return delay;
    }

    /**
     * The LAST attempt that ran governs, not the best one.
     *
     * This loop exists because an initial no-match can be stale, so the question it
     * answers is "is this person absent right now". If the most recent attempt could
     * not establish that, an earlier clean empty does not license a create: PCO went
     * down between the two, and the create is exactly what must not happen next.
     *
     * A match on any attempt still wins immediately, since finding somebody is not
     * ambiguous.
     */
    private async runAggressiveRetryLoop(
        options: PersonMatchOptions,
        aggressiveConfig: Required<Omit<RetryConfig, 'enabled'>>,
        initialOutcome: PersonSearchOutcome
    ): Promise<PersonSearchOutcome> {
        let totalWaitTime = 0;
        let outcome = initialOutcome;
        for (let attempt = 1; attempt <= aggressiveConfig.maxRetries; attempt++) {
            const ledger = new SearchFaultLedger();
            try {
                const match = await this.runOneAggressiveAttempt(options, ledger);
                outcome = PersonMatcher.toOutcome(match, ledger);
                if (outcome.kind === 'match') {
                    this.debugLog(`findOrCreate  aggressive search found person (would have created duplicate)`, {
                        personId: outcome.match.person.id,
                        attempt,
                        totalWaitTime,
                    });
                    return outcome;
                }
            } catch (error) {
                ledger.record(`aggressive:${attempt}`, error);
                outcome = PersonMatcher.toOutcome(null, ledger);
                this.debugLog(`findOrCreate  aggressive search attempt ${attempt} failed`, { error: String(error) });
            }
            const delay = PersonMatcher.computeAggressiveDelay(attempt, totalWaitTime, aggressiveConfig);
            if (delay === null) break;
            totalWaitTime += delay;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        this.logAggressiveResult(outcome, totalWaitTime, aggressiveConfig.maxRetries);
        return outcome;
    }

    private logAggressiveResult(
        outcome: PersonSearchOutcome,
        totalWaitTime: number,
        maxRetries: number
    ): void {
        const verdict = outcome.kind === 'empty'
            ? 'PCO answered, no match found, safe to create'
            : 'PCO did not answer, NOT safe to create';
        this.debugLog(`findOrCreate  aggressive search completed - ${verdict}`, {
            totalWaitTime,
            maxRetries,
            outcome: outcome.kind,
        });
    }

    /**
     * Final aggressive search before creating a new person
     *
     * This is a safeguard to prevent duplicate person creation when:
     * - PCO hasn't indexed contacts yet (15-30 minute delay)
     * - Multiple workers are processing the same person
     * - The fast path didn't find an existing person
     */
    private async findWithAggressiveRetry(
        options: PersonMatchOptions,
        initialOutcome: PersonSearchOutcome
    ): Promise<PersonSearchOutcome> {
        const aggressiveConfig = this.resolveRetryConfig(
            undefined,
            options.retryConfigs?.aggressive,
            DEFAULT_AGGRESSIVE_RETRY_CONFIG
        );
        this.debugLog(`findOrCreate  aggressive final search before create`, {
            maxWaitTime: aggressiveConfig.maxWaitTime,
            maxRetries: aggressiveConfig.maxRetries,
        });
        return this.runAggressiveRetryLoop(options, aggressiveConfig, initialOutcome);
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

    private async tryOneMultiStepStrategy(
        strategy: (typeof PersonMatcher.MULTI_STEP_STRATEGIES)[number],
        baseOptions: Omit<PersonMatchOptions, 'matchStrategy' | 'agePreference' | 'agePreferenceLenient'> & { agePreference?: PersonMatchOptions['agePreference']; agePreferenceLenient?: boolean },
        agePreference: PersonMatchOptions['agePreference'],
        agePreferenceLenient: boolean | undefined,
        ledger: SearchFaultLedger
    ): Promise<MatchResult | null> {
        const searchOptions: PersonMatchOptions = {
            ...baseOptions,
            matchStrategy: strategy.matchStrategy,
        };
        if (strategy.useAgePreference && agePreference) {
            searchOptions.agePreference = agePreference;
            searchOptions.agePreferenceLenient = agePreferenceLenient ?? true;
        }
        return this.findMatch(searchOptions, ledger);
    }

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
    async findMatchMultiStep(
        options: PersonMatchOptions,
        ledger: SearchFaultLedger = new SearchFaultLedger()
    ) {
        const { agePreference, agePreferenceLenient, ...baseOptions } = options;
        for (const strategy of PersonMatcher.MULTI_STEP_STRATEGIES) {
            try {
                const match = await this.tryOneMultiStepStrategy(
                    strategy,
                    baseOptions,
                    agePreference,
                    agePreferenceLenient,
                    ledger
                );
                if (match) {
                    this.debugLog(`findOrCreate  multi-step search found match using ${strategy.description}`, {
                        personId: match.person.id,
                        score: match.score,
                        reason: match.reason,
                    });
                    return match;
                }
            } catch (error) {
                // Falling through to the next strategy is right, but "every strategy
                // threw" must not read the same as "every strategy found nobody".
                ledger.record(`multi-step:${strategy.description}`, error);
                this.debugLog(`findOrCreate  multi-step strategy "${strategy.description}" failed`, { error: String(error) });
            }
        }
        return null;
    }

    private async runOneRetryAttempt(options: PersonMatchOptions): Promise<PersonSearchOutcome> {
        return this.attemptSearch(options);
    }

    private static computeRetryDelay(
        attempt: number,
        maxRetries: number,
        totalWaitTime: number,
        config: Required<Omit<RetryConfig, 'enabled'>>
    ): number | null {
        if (attempt === maxRetries) return null;
        const delay = Math.min(
            config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1),
            config.maxWaitTime - totalWaitTime
        );
        if (totalWaitTime + delay > config.maxWaitTime) return null;
        return delay;
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
    private async handleRetrySuccess(
        match: MatchResult,
        attempt: number,
        totalWaitTime: number,
        options: PersonMatchOptions
    ): Promise<PersonResource> {
        if (options.addMissingContactInfo) {
            await this.addMissingContactInfo(match.person, options);
        }
        if (attempt > 1) {
            this.debugLog(`findOrCreate  found person after ${attempt} attempts (waited ${totalWaitTime}ms)`, {
                personId: match.person.id,
                attempt,
                totalWaitTime,
                searchStrategy: options.searchStrategy,
            });
        }
        return match.person;
    }

    /**
     * One round of the find-only retry loop.
     *
     * A genuine no-match and a failed lookup used to produce the same
     * `Error('No matching person found and creation is disabled')`, so a caller
     * could not tell an outage from an answer and the safe response to each was
     * different. They are now separate types. The no-match message is unchanged, so
     * callers matching on the string keep working.
     */
    private async tryOneRetryRound(
        options: PersonMatchOptions,
        attempt: number,
        totalWaitTime: number
    ): Promise<{ success: true; person: PersonResource } | { success: false; lastError: Error }> {
        try {
            const outcome = await this.runOneRetryAttempt(options);
            if (outcome.kind === 'match') {
                const person = await this.handleRetrySuccess(outcome.match, attempt, totalWaitTime, options);
                return { success: true, person };
            }
            if (outcome.kind === 'degraded') {
                return {
                    success: false,
                    lastError: new PcoSearchUnavailableError(outcome.faults, 'report no match'),
                };
            }
            return { success: false, lastError: new NoMatchingPersonError() };
        } catch (error) {
            const lastError = error instanceof Error ? error : new Error(String(error));
            return { success: false, lastError };
        }
    }

    private async waitBeforeNextRetry(
        attempt: number,
        totalWaitTime: number,
        lastError: Error | null,
        config: Required<Omit<RetryConfig, 'enabled'>>
    ): Promise<number | null> {
        const delay = PersonMatcher.computeRetryDelay(attempt, config.maxRetries, totalWaitTime, config);
        if (delay === null) {
            this.maybeLogRetryTimeout(attempt, config.maxRetries, totalWaitTime, config.maxWaitTime);
            return null;
        }
        const nextTotal = totalWaitTime + delay;
        this.debugLog(`findOrCreate  attempt ${attempt} failed, retrying in ${delay}ms`, {
            attempt,
            delay,
            totalWaitTime: nextTotal,
            errorMessage: lastError?.message,
            maxRetries: config.maxRetries,
            maxWaitTime: config.maxWaitTime,
        });
        await new Promise(resolve => setTimeout(resolve, delay));
        return nextTotal;
    }

    private static buildRetryExhaustedError(
        lastError: Error | null,
        maxRetries: number,
        totalWaitTime: number
    ): Error {
        return lastError ?? new NoMatchingPersonError(
            `No matching person found after ${maxRetries} attempts (waited ${totalWaitTime}ms) and creation is disabled`
        );
    }

    private async runRetryLoop(options: PersonMatchOptions): Promise<PersonResource> {
        const config = this.resolveRetryConfig(options.retryConfig, options.retryConfigs?.initial);
        let totalWaitTime = 0;
        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
            const result = await this.tryOneRetryRound(options, attempt, totalWaitTime);
            if (result.success) return result.person;
            lastError = result.success === false ? result.lastError : lastError;
            const nextTotal = await this.waitBeforeNextRetry(attempt, totalWaitTime, lastError, config);
            if (nextTotal === null) break;
            totalWaitTime = nextTotal;
        }
        throw PersonMatcher.buildRetryExhaustedError(lastError, config.maxRetries, totalWaitTime);
    }

    private async findOrCreateWithRetry(options: PersonMatchOptions) {
        return this.runRetryLoop(options);
    }

    private maybeLogRetryTimeout(
        attempt: number,
        maxRetries: number,
        totalWaitTime: number,
        maxWaitTime: number
    ): void {
        if (totalWaitTime > 0 && attempt < maxRetries) {
            this.debugLog(`findOrCreate  max wait time (${maxWaitTime}ms) exceeded, stopping retries`, {
                attempt,
                totalWaitTime,
                remainingDelay: maxWaitTime - totalWaitTime,
            });
        }
    }

    /**
     * Still returns an empty array on failure, but no longer pretends the failure
     * did not happen: the reason goes in the ledger so the create decision can see
     * that this empty result carries no information.
     *
     * An invalid email is NOT a fault. Nothing was asked of PCO, and there is no
     * person to find, so an empty result there is a real answer.
     */
    private async searchByEmail(email: string, ledger: SearchFaultLedger): Promise<PersonResource[]> {
        if (!isValidEmail(email)) return [];
        try {
            const normalizedEmail = normalizeEmail(email);
            const emailResults = await this.peopleModule.search({ email: normalizedEmail });
            return emailResults.data;
        } catch (error) {
            ledger.record('search:email', error);
            return [];
        }
    }

    private async searchByPhone(phone: string, ledger: SearchFaultLedger): Promise<PersonResource[]> {
        try {
            const normalizedPhone = normalizePhone(phone);
            const phoneResults = await this.peopleModule.search({ phone: normalizedPhone });
            return phoneResults.data;
        } catch (error) {
            ledger.record('search:phone', error);
            return [];
        }
    }

    private async gatherEmailPhoneCandidates(
        options: PersonMatchOptions,
        ledger: SearchFaultLedger
    ): Promise<PersonResource[]> {
        const emailList = options.email ? await this.searchByEmail(options.email, ledger) : [];
        const phoneList = options.phone ? await this.searchByPhone(options.phone, ledger) : [];
        return PersonMatcher.dedupeById([...emailList, ...phoneList]);
    }

    private async isVerifiedContactMatch(
        candidate: PersonResource,
        email: string | undefined,
        phone: string | undefined,
        ledger: SearchFaultLedger
    ): Promise<boolean> {
        if (email && (await this.verifyEmailMatch(candidate, email, ledger))) return true;
        if (phone && (await this.verifyPhoneMatch(candidate, phone, ledger))) return true;
        return false;
    }

    /**
     * Verification is part of the search, not a detail after it. A candidate that
     * PCO returned but whose contacts could not be read is dropped from the
     * verified set, and dropping every candidate that way produces the same empty
     * result as finding nobody. So these failures degrade the attempt too.
     */
    private async verifyEmailPhoneMatches(
        candidates: PersonResource[],
        email: string | undefined,
        phone: string | undefined,
        ledger: SearchFaultLedger
    ): Promise<PersonResource[]> {
        const verified: PersonResource[] = [];
        for (const candidate of candidates) {
            if (await this.isVerifiedContactMatch(candidate, email, phone, ledger)) {
                verified.push(candidate);
            }
        }
        return verified;
    }

    private static shouldRunNameSearch(verifiedCount: number, hasContactInfo: boolean): boolean {
        return verifiedCount > 1 || !hasContactInfo;
    }

    private async gatherNameOnlyMatches(
        options: PersonMatchOptions,
        verifiedCount: number,
        hasContactInfo: boolean,
        ledger: SearchFaultLedger
    ): Promise<PersonResource[]> {
        if (!PersonMatcher.shouldRunNameSearch(verifiedCount, hasContactInfo)) return [];
        if (!options.first_name || !options.last_name) return [];
        try {
            const nameResults = await this.peopleModule.search({
                name: `${options.first_name} ${options.last_name}`,
            });
            return nameResults.data;
        } catch (error) {
            ledger.record('search:name', error);
            this.debugLog('findMatch  name search failed', { error: String(error) });
            return [];
        }
    }

    private static dedupeById(people: PersonResource[]): PersonResource[] {
        return people.filter((person, index, self) => index === self.findIndex(p => p.id === person.id));
    }

    private selectBestFromScored(
        scoredCandidates: Array<MatchResult & { isVerifiedContactMatch?: boolean }>,
        matchStrategy: 'exact' | 'fuzzy' | 'aggressive'
    ): MatchResult | null {
        if (matchStrategy === 'exact') {
            const exact = scoredCandidates.filter(c => c.isVerifiedContactMatch && c.score >= 0.8);
            return exact.length > 0 ? exact[0] : null;
        }
        return this.strategies.selectBestMatch(scoredCandidates, matchStrategy);
    }

    private async scoreAndSortCandidates(
        ageFilteredCandidates: PersonResource[],
        verifiedMatches: PersonResource[],
        options: PersonMatchOptions
    ): Promise<Array<MatchResult & { isVerifiedContactMatch?: boolean }>> {
        const scored = await Promise.all(
            ageFilteredCandidates.map(async (candidate) => ({
                person: candidate,
                score: await this.scorer.scoreMatch(candidate, options),
                reason: await this.scorer.getMatchReason(candidate, options),
                isVerifiedContactMatch: verifiedMatches.some(v => v.id === candidate.id),
            }))
        );
        scored.sort((a, b) => {
            if (a.isVerifiedContactMatch && !b.isVerifiedContactMatch) return -1;
            if (!a.isVerifiedContactMatch && b.isVerifiedContactMatch) return 1;
            return b.score - a.score;
        });
        return scored;
    }

    private static shouldFallbackToNameSearch(options: PersonMatchOptions): boolean {
        return (
            options.fallbackToNameSearch === true &&
            !!options.first_name &&
            !!options.last_name &&
            !!(options.email || options.phone)
        );
    }

    private async maybeFallbackNameSearch(
        options: PersonMatchOptions,
        ledger: SearchFaultLedger
    ): Promise<MatchResult | null> {
        if (!PersonMatcher.shouldFallbackToNameSearch(options)) return null;
        const first = options.first_name ?? '';
        const last = options.last_name ?? '';
        const validation = options.contactValidation ?? 'similarity';
        return this.findMatchByNameWithContactValidation(
            first,
            last,
            options.email,
            options.phone,
            validation,
            options,
            ledger
        );
    }

    /**
     * Find the best match for a person
     *
     * Returns `null` both when nobody matched and when the lookups failed, exactly
     * as before, so read-only callers are unaffected. Pass a `SearchFaultLedger`
     * (or call `findMatchWithOutcome`) to tell those two cases apart.
     */
    async findMatch(options: PersonMatchOptions, ledger?: SearchFaultLedger) {
        return this.findMatchWithLedger(options, ledger ?? new SearchFaultLedger());
    }

    private async findMatchWithLedger(options: PersonMatchOptions, ledger: SearchFaultLedger) {
        const { matchStrategy = 'fuzzy', email, phone } = options;
        const emailPhoneCandidates = await this.gatherEmailPhoneCandidates(options, ledger);
        const verifiedMatches = await this.verifyEmailPhoneMatches(emailPhoneCandidates, email, phone, ledger);
        const nameOnlyMatches = await this.gatherNameOnlyMatches(
            options,
            verifiedMatches.length,
            !!(email || phone),
            ledger
        );
        const uniqueCandidates = PersonMatcher.dedupeById([...verifiedMatches, ...nameOnlyMatches]);
        const ageFilteredCandidates = this.filterByAgePreferences(uniqueCandidates, options);
        if (ageFilteredCandidates.length === 0) return null;
        const scoredCandidates = await this.scoreAndSortCandidates(
            ageFilteredCandidates,
            verifiedMatches,
            options
        );
        const best = this.selectBestFromScored(scoredCandidates, matchStrategy);
        if (best) return best;
        return this.maybeFallbackNameSearch(options, ledger);
    }

    /**
     * Find a match by name with contact validation
     * 
     * This is a fallback when email/phone search fails. It searches by name
     * but validates that the person's contact info is similar to prevent
     * wrong-person matches (e.g., two people named "John Smith").
     */
    private async findMatchByNameWithContactValidation(
        first_name: string,
        last_name: string,
        searchEmail: string | undefined,
        searchPhone: string | undefined,
        validationStrategy: 'strict' | 'domain' | 'similarity',
        options: PersonMatchOptions,
        ledger: SearchFaultLedger
    ) {
        try {
            const nameResults = await this.peopleModule.search({
                name: `${first_name} ${last_name}`
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
                    validationStrategy,
                    ledger
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
        } catch (error) {
            ledger.record('search:name-fallback', error);
            return null;
        }
    }

    private static validateStrict(
        searchEmail: string | undefined,
        searchPhone: string | undefined,
        personEmails: string[],
        personPhones: string[]
    ): boolean {
        if (searchEmail) {
            const normalizedSearch = normalizeEmail(searchEmail);
            if (personEmails.some(e => normalizeEmail(e) === normalizedSearch)) return true;
        }
        if (searchPhone) {
            const normalizedSearch = normalizePhone(searchPhone);
            if (personPhones.some(p => normalizePhone(p) === normalizedSearch)) return true;
        }
        return false;
    }

    private static validateDomain(
        searchEmail: string | undefined,
        searchPhone: string | undefined,
        personEmails: string[],
        personPhones: string[]
    ): boolean {
        if (searchEmail && personEmails.some(e => emailDomainsMatch(searchEmail!, e))) return true;
        if (searchPhone) {
            const normalizedSearch = normalizePhone(searchPhone);
            if (personPhones.some(p => normalizePhone(p) === normalizedSearch)) return true;
        }
        return false;
    }

    private static validateSimilarity(
        searchEmail: string | undefined,
        searchPhone: string | undefined,
        personEmails: string[],
        personPhones: string[]
    ): boolean {
        return validateContactSimilarity(searchEmail, searchPhone, personEmails, personPhones).isValid;
    }

    /**
     * Validate a candidate's contact info based on the validation strategy
     */
    private async validateCandidateContact(
        candidate: PersonResource,
        searchEmail: string | undefined,
        searchPhone: string | undefined,
        validationStrategy: 'strict' | 'domain' | 'similarity',
        ledger: SearchFaultLedger = new SearchFaultLedger()
    ) {
        try {
            const [personEmails, personPhones] = await Promise.all([
                this.peopleModule.getEmails(candidate.id).then(r =>
                    r.data?.map(e => e.address || '').filter(Boolean) || []
                ).catch((error) => {
                    ledger.record(`validate:emails:${candidate.id}`, error);
                    return [];
                }),
                this.peopleModule.getPhoneNumbers(candidate.id).then(r =>
                    r.data?.map(p => p.number || '').filter(Boolean) || []
                ).catch((error) => {
                    ledger.record(`validate:phones:${candidate.id}`, error);
                    return [];
                }),
            ]);
            if (validationStrategy === 'strict') {
                return PersonMatcher.validateStrict(searchEmail, searchPhone, personEmails, personPhones);
            }
            if (validationStrategy === 'domain') {
                return PersonMatcher.validateDomain(searchEmail, searchPhone, personEmails, personPhones);
            }
            return PersonMatcher.validateSimilarity(searchEmail, searchPhone, personEmails, personPhones);
        } catch (error) {
            ledger.record(`validate:${candidate.id}`, error);
            this.debugLog(`findMatch  contact validation failed for person ${candidate.id}`, { error: String(error) });
            return false;
        }
    }


    /**
     * Verify if a person's email actually matches the search email
     */
    private async verifyEmailMatch(
        person: PersonResource,
        email: string,
        ledger: SearchFaultLedger = new SearchFaultLedger()
    ) {
        try {
            const personEmails = await this.peopleModule.getEmails(person.id);
            const normalizedSearchEmail = normalizeEmail(email);
            const emails = personEmails.data?.map(e =>
                normalizeEmail(e.address || '')
            ).filter(Boolean) || [];
            return emails.includes(normalizedSearchEmail);
        } catch (error) {
            ledger.record(`verify:emails:${person.id}`, error);
            return false;
        }
    }

    /**
     * Verify if a person's phone actually matches the search phone
     */
    private async verifyPhoneMatch(
        person: PersonResource,
        phone: string,
        ledger: SearchFaultLedger = new SearchFaultLedger()
    ) {
        try {
            const personPhones = await this.peopleModule.getPhoneNumbers(person.id);
            const normalizedSearchPhone = normalizePhone(phone);
            const phones = personPhones.data?.map(p =>
                normalizePhone(p.number || '')
            ).filter(Boolean) || [];
            return phones.includes(normalizedSearchPhone);
        } catch (error) {
            ledger.record(`verify:phones:${person.id}`, error);
            return false;
        }
    }

    private async addEmailIfMissing(person: PersonResource, email: string): Promise<void> {
        try {
            const hasEmail = await this.verifyEmailMatch(person, email);
            if (!hasEmail) {
                await this.peopleModule.addEmail(person.id, {
                    address: email,
                    location: 'Home',
                    primary: false,
                });
            }
        } catch (error) {
            this.debugLog(`addMissingContactInfo  failed to add email for person ${person.id}`, { error: String(error) });
        }
    }

    private async addPhoneIfMissing(person: PersonResource, phone: string): Promise<void> {
        try {
            const hasPhone = await this.verifyPhoneMatch(person, phone);
            if (!hasPhone) {
                await this.peopleModule.addPhoneNumber(person.id, {
                    number: phone,
                    location: 'Home',
                    primary: false,
                });
            }
        } catch (error) {
            this.debugLog(`addMissingContactInfo  failed to add phone for person ${person.id}`, { error: String(error) });
        }
    }

    /**
     * Add missing contact information to a person's profile
     */
    private async addMissingContactInfo(person: PersonResource, options: PersonMatchOptions) {
        if (options.email) await this.addEmailIfMissing(person, options.email);
        if (options.phone) await this.addPhoneIfMissing(person, options.phone);
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

    private static buildPersonData(options: PersonMatchOptions): Partial<PersonAttributes> {
        const personData: Partial<PersonAttributes> = { status: 'active' };
        if (options.first_name) personData.first_name = options.first_name;
        if (options.last_name) personData.last_name = options.last_name;
        return personData;
    }

    private async addEmailToNewPerson(personId: string, email: string): Promise<void> {
        try {
            await this.peopleModule.addEmail(personId, {
                address: email,
                location: 'Home',
                primary: true,
            });
        } catch (error) {
            this.debugLog(`createPerson  failed to create email for person ${personId}`, { error: String(error) });
        }
    }

    private async addPhoneToNewPerson(personId: string, phone: string): Promise<void> {
        try {
            await this.peopleModule.addPhoneNumber(personId, {
                number: phone,
                location: 'Home',
                primary: true,
            });
        } catch (error) {
            this.debugLog(`createPerson  failed to create phone for person ${personId}`, { error: String(error) });
        }
    }

    private async addContactsAndCampusToNewPerson(personId: string, options: PersonMatchOptions): Promise<void> {
        if (options.email) await this.addEmailToNewPerson(personId, options.email);
        if (options.phone) await this.addPhoneToNewPerson(personId, options.phone);
        if (options.campusId) await this.peopleModule.setPrimaryCampus(personId, options.campusId);
    }

    /**
     * Create a new person
     */
    private async createPerson(options: PersonMatchOptions) {
        if (!options.first_name?.trim()) {
            throw new Error('First name is required to create a person');
        }
        const personData = PersonMatcher.buildPersonData(options);
        const createRes = await this.peopleModule.create(personData);
        const person = singleFromCreateResponse(createRes);
        if (!person) throw new Error('Create person did not return a resource');
        await this.addContactsAndCampusToNewPerson(person.id, options);
        return this.peopleModule.getById(person.id);
    }

    /**
     * Get all potential matches with detailed scoring
     */
    async getAllMatches(options: PersonMatchOptions, ledger: SearchFaultLedger = new SearchFaultLedger()) {
        const emailPhoneCandidates = await this.gatherEmailPhoneCandidates(options, ledger);
        const verifiedMatches = await this.verifyEmailPhoneMatches(
            emailPhoneCandidates,
            options.email,
            options.phone,
            ledger
        );
        const nameOnlyMatches = await this.gatherNameOnlyMatches(
            options,
            verifiedMatches.length,
            !!(options.email || options.phone),
            ledger
        );
        const uniqueCandidates = PersonMatcher.dedupeById([...verifiedMatches, ...nameOnlyMatches]);
        const ageFilteredCandidates = this.filterByAgePreferences(uniqueCandidates, options);
        const scoredCandidates = await Promise.all(
            ageFilteredCandidates.map(async (candidate) => ({
                person: candidate,
                score: await this.scorer.scoreMatch(candidate, options),
                reason: await this.scorer.getMatchReason(candidate, options),
                isVerifiedContactMatch: verifiedMatches.some(v => v.id === candidate.id),
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
    async isMatch(personId: string, options: PersonMatchOptions) {
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
