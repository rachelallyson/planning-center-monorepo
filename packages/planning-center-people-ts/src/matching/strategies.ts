/**
 * v2.0.0 Person Matching Strategies
 */

import type { MatchResult } from './matcher';

export type MatchStrategy = 'exact' | 'fuzzy' | 'aggressive';

export class MatchStrategies {
    /**
     * Select the best match based on strategy
     */
    selectBestMatch(candidates: MatchResult[], strategy: MatchStrategy): MatchResult | null {
        if (candidates.length === 0) {
            return null;
        }

        switch (strategy) {
            case 'exact':
                return this.selectExactMatch(candidates);
            case 'fuzzy':
                return this.selectFuzzyMatch(candidates);
            case 'aggressive':
                return this.selectAggressiveMatch(candidates);
            default:
                return this.selectFuzzyMatch(candidates);
        }
    }

    /**
     * Exact matching strategy - only return matches with very high confidence
     * Requires verified email/phone matches unless multiple people share the same contact info
     */
    private selectExactMatch(candidates: MatchResult[]): MatchResult | null {
        // For exact match, require verified email/phone match
        // Only allow name-only matches if multiple people share same email/phone (to distinguish)
        const verifiedMatches = candidates.filter(c => c.isVerifiedContactMatch);
        const verifiedCount = verifiedMatches.length;
        
        const exactMatches = candidates.filter(c => {
            // Must have score >= 0.8
            if (c.score < 0.8) return false;
            
            // Must be a verified contact match (email/phone), OR
            // Must be a name-only match with multiple verified matches (to distinguish)
            const isNameMatch = c.reason.includes('name match');
            return c.isVerifiedContactMatch || 
                   (isNameMatch && verifiedCount > 1);
        });
        
        return exactMatches.length > 0 ? exactMatches[0] : null;
    }

    /**
     * Fuzzy matching strategy - return best match above threshold
     */
    private selectFuzzyMatch(candidates: MatchResult[]): MatchResult | null {
        // Return best match with score >= 0.5 (lowered from 0.7)
        const fuzzyMatches = candidates.filter(c => c.score >= 0.5);
        return fuzzyMatches.length > 0 ? fuzzyMatches[0] : null;
    }

    /**
     * Aggressive matching strategy - return best match with lower threshold
     */
    private selectAggressiveMatch(candidates: MatchResult[]): MatchResult | null {
        // Return best match with score >= 0.5
        const aggressiveMatches = candidates.filter(c => c.score >= 0.5);
        return aggressiveMatches.length > 0 ? aggressiveMatches[0] : null;
    }

    /**
     * Get all matches above threshold for a strategy
     */
    getAllMatchesAboveThreshold(candidates: MatchResult[], strategy: MatchStrategy): MatchResult[] {
        const threshold = this.getThreshold(strategy);
        return candidates.filter(c => c.score >= threshold);
    }

    /**
     * Get the threshold for a strategy
     */
    getThreshold(strategy: MatchStrategy): number {
        switch (strategy) {
            case 'exact':
                return 0.9;
            case 'fuzzy':
                return 0.7;
            case 'aggressive':
                return 0.5;
            default:
                return 0.7;
        }
    }

    /**
     * Check if a score meets the strategy threshold
     */
    meetsThreshold(score: number, strategy: MatchStrategy): boolean {
        return score >= this.getThreshold(strategy);
    }
}
