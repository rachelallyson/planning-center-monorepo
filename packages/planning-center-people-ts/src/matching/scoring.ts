/**
 * v2.0.0 Person Match Scoring
 */

import { createDebugLogger } from '@rachelallyson/planning-center-base-ts';
import type { PcoClientConfig } from '@rachelallyson/planning-center-base-ts';
import type { PersonAttributes, PersonResource } from '../types';
import type { PersonMatchOptions, PersonMatcherDeps } from '../modules/people';
import { matchesAgeCriteria, calculateAgeSafe, normalizeEmail, normalizePhone } from '../helpers';

export class MatchScorer {
    private getConfig?: () => PcoClientConfig;

    constructor(private peopleModule: PersonMatcherDeps, getConfig?: () => PcoClientConfig) {
        this.getConfig = getConfig;
    }

    private debugLog(message: string, data?: object): void {
        const logger = createDebugLogger(this.getConfig?.());
        if (logger.enabled) logger.log(message, data);
    }

    private static getNameWeight(options: PersonMatchOptions): number {
        return !options.email && !options.phone ? 0.4 : 0.2;
    }

    private async getEmailContribution(person: PersonResource, options: PersonMatchOptions): Promise<{ score: number; max: number }> {
        if (!options.email) return { score: 0, max: 0 };
        const emailScore = await this.scoreEmailMatch(person, options.email);
        return { score: emailScore * 0.35, max: 0.35 };
    }

    private async getPhoneContribution(person: PersonResource, options: PersonMatchOptions): Promise<{ score: number; max: number }> {
        if (!options.phone) return { score: 0, max: 0 };
        const phoneScore = await this.scorePhoneMatch(person, options.phone);
        return { score: phoneScore * 0.25, max: 0.25 };
    }

    private getNameContribution(person: PersonResource, options: PersonMatchOptions): { score: number; max: number } {
        if (!options.first_name && !options.last_name) return { score: 0, max: 0 };
        const nameScore = this.scoreNameMatch(person, options);
        const nameWeight = MatchScorer.getNameWeight(options);
        return { score: nameScore * nameWeight, max: nameWeight };
    }

    /**
     * Score a person match based on various criteria
     */
    async scoreMatch(person: PersonResource, options: PersonMatchOptions) {
        const [email, phone, name] = await Promise.all([
            this.getEmailContribution(person, options),
            this.getPhoneContribution(person, options),
            Promise.resolve(this.getNameContribution(person, options)),
        ]);
        const ageScore = this.scoreAgeMatch(person, options);
        const additionalScore = this.scoreAdditionalCriteria(person, options);
        const totalScore = email.score + phone.score + name.score + ageScore * 0.15 + additionalScore * 0.05;
        const maxScore = email.max + phone.max + name.max + 0.15 + 0.05;
        return maxScore > 0 ? totalScore / maxScore : 0;
    }

    private async getEmailReason(person: PersonResource, options: PersonMatchOptions): Promise<string | null> {
        if (!options.email) return null;
        const emailScore = await this.scoreEmailMatch(person, options.email);
        return emailScore > 0.8 ? 'exact email match' : null;
    }

    private async getPhoneReason(person: PersonResource, options: PersonMatchOptions): Promise<string | null> {
        if (!options.phone) return null;
        const phoneScore = await this.scorePhoneMatch(person, options.phone);
        return phoneScore > 0.8 ? 'exact phone match' : null;
    }

    private getNameReason(person: PersonResource, options: PersonMatchOptions): string | null {
        if (!options.first_name && !options.last_name) return null;
        const nameScore = this.scoreNameMatch(person, options);
        if (nameScore > 0.8) return 'exact name match';
        if (nameScore > 0) return 'partial name match';
        return null;
    }

    private getAgeReason(person: PersonResource, options: PersonMatchOptions): string | null {
        const ageScore = this.scoreAgeMatch(person, options);
        if (ageScore <= 0.8) return null;
        const age = calculateAgeSafe(person.birthdate);
        if (age === null) return null;
        if (options.agePreference === 'adults') return 'adult age match';
        if (options.agePreference === 'children') return 'child age match';
        return `age ${age} match`;
    }

    /**
     * Get a human-readable reason for the match
     */
    async getMatchReason(person: PersonResource, options: PersonMatchOptions) {
        const [emailReason, phoneReason] = await Promise.all([
            this.getEmailReason(person, options),
            this.getPhoneReason(person, options),
        ]);
        const nameReason = this.getNameReason(person, options);
        const ageReason = this.getAgeReason(person, options);
        const reasons = [emailReason, phoneReason, nameReason, ageReason].filter((r): r is string => r !== null);
        return reasons.length === 0 ? 'partial match' : reasons.join(', ');
    }

    /**
     * Score email matching - verifies actual email matches
     */
    async scoreEmailMatch(person: PersonResource, email: string) {
        try {
            const personEmails = await this.peopleModule.getEmails(person.id);
            const normalizedSearchEmail = normalizeEmail(email);

            // Check if any of the person's emails match
            const emails = personEmails.data?.map(e =>
                normalizeEmail(e.address || '')
            ).filter(Boolean) || [];

            return emails.includes(normalizedSearchEmail) ? 1.0 : 0.0;
        } catch (error) {
            this.debugLog('scoring  failed to verify email match', { personId: person.id, error: String(error) });
            return 0.0;
        }
    }

    /**
     * Score phone matching - verifies actual phone matches
     */
    async scorePhoneMatch(person: PersonResource, phone: string) {
        try {
            const personPhones = await this.peopleModule.getPhoneNumbers(person.id);
            const normalizedSearchPhone = normalizePhone(phone);
            const phones = personPhones.data?.map(p =>
                normalizePhone(p.number || '')
            ).filter(Boolean) || [];

            return phones.includes(normalizedSearchPhone) ? 1.0 : 0.0;
        } catch (error) {
            this.debugLog('scoring  failed to verify phone match', { personId: person.id, error: String(error) });
            return 0.0;
        }
    }

    private static scoreFirstName(first: string, searchFirst: string): number {
        return searchFirst.toLowerCase() === first.toLowerCase() ? 0.5 : 0;
    }

    private static scoreLastName(last: string, searchLast: string): number {
        return searchLast.toLowerCase() === last.toLowerCase() ? 0.5 : 0;
    }

    /**
     * Score name matching - only exact matches
     */
    private scoreNameMatch(person: PersonAttributes, options: PersonMatchOptions): number {
        const firstScore = options.first_name
            ? MatchScorer.scoreFirstName(person.first_name ?? '', options.first_name)
            : 0;
        const lastScore = options.last_name
            ? MatchScorer.scoreLastName(person.last_name ?? '', options.last_name)
            : 0;
        return firstScore + lastScore;
    }

    private static hasAgeCriteria(options: PersonMatchOptions): boolean {
        return !!(
            options.agePreference ||
            options.minAge !== undefined ||
            options.maxAge !== undefined ||
            options.birthYear !== undefined
        );
    }

    private static getAgeRangeBonus(age: number, options: PersonMatchOptions): number {
        if (options.minAge === undefined || options.maxAge === undefined) return 0;
        return age >= options.minAge && age <= options.maxAge ? 0.3 : 0;
    }

    private static getBirthYearBonus(birthdate: string, options: PersonMatchOptions): number {
        if (options.birthYear === undefined) return 0;
        return new Date(birthdate).getFullYear() === options.birthYear ? 0.4 : 0;
    }

    private static getAgeBonusScore(birthdate: string, options: PersonMatchOptions): number {
        const age = calculateAgeSafe(birthdate);
        if (age === null) return 0;
        const bonus = MatchScorer.getAgeRangeBonus(age, options) + MatchScorer.getBirthYearBonus(birthdate, options);
        return Math.min(0.6 + bonus, 1.0);
    }

    /**
     * Score age matching
     */
    private scoreAgeMatch(person: PersonResource, options: PersonMatchOptions): number {
        if (!MatchScorer.hasAgeCriteria(options)) return 0.5;
        if (!person.birthdate) return 0.1;
        const matches = matchesAgeCriteria(person.birthdate, {
            agePreference: options.agePreference,
            minAge: options.minAge,
            maxAge: options.maxAge,
            birthYear: options.birthYear,
            agePreferenceLenient: options.agePreferenceLenient,
        });
        if (!matches) return 0;
        return MatchScorer.getAgeBonusScore(person.birthdate, options);
    }

    /**
     * Score additional criteria
     */
    private scoreAdditionalCriteria(person: PersonResource, options: PersonMatchOptions): number {
        // Add scoring for other criteria like campus, status, etc.
        void person;
        void options;
        return 0;
    }

    private static initLevenshteinMatrix(len1: number, len2: number): number[][] {
        const matrix: number[][] = [];
        for (let i = 0; i <= len1; i++) matrix[i] = [i];
        for (let j = 0; j <= len2; j++) matrix[0][j] = j;
        return matrix;
    }

    private static fillLevenshteinMatrix(
        matrix: number[][],
        str1: string,
        str2: string,
        len1: number,
        len2: number
    ): void {
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[i][j] = Math.min(
                    matrix[i - 1][j] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j - 1] + cost
                );
            }
        }
    }

    private static buildLevenshteinMatrix(str1: string, str2: string): number[][] {
        const len1 = str1.length;
        const len2 = str2.length;
        const matrix = MatchScorer.initLevenshteinMatrix(len1, len2);
        MatchScorer.fillLevenshteinMatrix(matrix, str1, str2, len1, len2);
        return matrix;
    }

    /**
     * Calculate string similarity using Levenshtein distance
     */
    private calculateStringSimilarity(str1: string, str2: string): number {
        if (str1 === str2) return 1;
        if (str1.length === 0 || str2.length === 0) return 0;
        const matrix = MatchScorer.buildLevenshteinMatrix(str1, str2);
        const len1 = str1.length;
        const len2 = str2.length;
        const distance = matrix[len1][len2];
        const maxLength = Math.max(len1, len2);
        return 1 - distance / maxLength;
    }
}
