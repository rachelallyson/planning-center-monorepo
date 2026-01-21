import { calculateTrust, DEFAULT_TRUST_WINDOW } from '../../src/helpers';

describe('Trust Calculation Helpers', () => {
    describe('calculateTrust', () => {
        it('returns shouldTrust=false when no timestamp provided', () => {
            const result = calculateTrust(undefined);
            expect(result.shouldTrust).toBe(false);
            expect(result.age).toBeNull();
            expect(result.reason).toContain('No timestamp');
        });

        it('returns shouldTrust=true for timestamps within trust window', () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const result = calculateTrust(fiveMinutesAgo);
            
            expect(result.shouldTrust).toBe(true);
            expect(result.age).toBeLessThan(DEFAULT_TRUST_WINDOW);
            expect(result.reason).toContain('Fresh personId');
        });

        it('returns shouldTrust=false for timestamps outside trust window', () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
            const result = calculateTrust(twoHoursAgo);
            
            expect(result.shouldTrust).toBe(false);
            expect(result.age).toBeGreaterThan(DEFAULT_TRUST_WINDOW);
            expect(result.reason).toContain('needs verification');
        });

        it('respects custom trust window', () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const shortWindow = 1 * 60 * 1000; // 1 minute
            
            const result = calculateTrust(fiveMinutesAgo, shortWindow);
            expect(result.shouldTrust).toBe(false);
            expect(result.age).toBeGreaterThan(shortWindow);
        });

        it('handles edge case at exactly trust window boundary', () => {
            // This tests the < vs <= boundary
            const exactlyOneHourAgo = new Date(Date.now() - DEFAULT_TRUST_WINDOW).toISOString();
            const result = calculateTrust(exactlyOneHourAgo);
            
            // At exactly the boundary, should not trust
            expect(result.shouldTrust).toBe(false);
        });

        it('handles invalid timestamp format', () => {
            const result = calculateTrust('invalid-date');
            expect(result.shouldTrust).toBe(false);
            expect(result.age).toBeNull();
            expect(result.reason).toContain('Invalid timestamp');
        });

        it('handles future timestamps (clock skew)', () => {
            const futureDate = new Date(Date.now() + 60 * 1000).toISOString();
            const result = calculateTrust(futureDate);
            
            expect(result.shouldTrust).toBe(false);
            expect(result.reason).toContain('future');
        });

        it('calculates age correctly in seconds', () => {
            const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
            const result = calculateTrust(thirtySecondsAgo);
            
            expect(result.shouldTrust).toBe(true);
            expect(result.age).toBeGreaterThanOrEqual(29000);
            expect(result.age).toBeLessThanOrEqual(32000);
        });

        it('reason includes time information', () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const result = calculateTrust(fiveMinutesAgo);
            
            // Should mention seconds or minutes in reason
            expect(result.reason).toMatch(/\d+s old|\d+min/);
        });
    });

    describe('DEFAULT_TRUST_WINDOW', () => {
        it('is 1 hour in milliseconds', () => {
            expect(DEFAULT_TRUST_WINDOW).toBe(60 * 60 * 1000);
        });
    });
});
