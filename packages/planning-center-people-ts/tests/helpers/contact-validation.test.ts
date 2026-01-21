import { 
    emailDomainsMatch, 
    extractEmailDomain,
    phoneNumbersSimilar, 
    validateContactSimilarity 
} from '../../src/helpers';

describe('Contact Validation Helpers', () => {
    describe('extractEmailDomain', () => {
        it('extracts domain from valid email', () => {
            expect(extractEmailDomain('user@example.com')).toBe('example.com');
            expect(extractEmailDomain('user@sub.example.com')).toBe('sub.example.com');
        });

        it('handles uppercase emails', () => {
            expect(extractEmailDomain('User@EXAMPLE.COM')).toBe('example.com');
        });

        it('handles emails with whitespace', () => {
            expect(extractEmailDomain('  user@example.com  ')).toBe('example.com');
        });

        it('returns empty string for invalid emails', () => {
            expect(extractEmailDomain('invalid')).toBe('');
            expect(extractEmailDomain('')).toBe('');
        });
    });

    describe('emailDomainsMatch', () => {
        it('matches identical domains', () => {
            expect(emailDomainsMatch('user@example.com', 'other@example.com')).toBe(true);
        });

        it('matches domains case-insensitively', () => {
            expect(emailDomainsMatch('user@EXAMPLE.com', 'other@example.COM')).toBe(true);
        });

        it('matches google domain aliases', () => {
            expect(emailDomainsMatch('user@gmail.com', 'other@googlemail.com')).toBe(true);
        });

        it('matches domains with similar prefixes', () => {
            // Catches domains that share same first 3 characters
            expect(emailDomainsMatch('user@gmail.com', 'other@gmaill.com')).toBe(true);
            // Note: gmial.com has different 4th char, so prefix matching only works for first 3 chars
            expect(emailDomainsMatch('user@example.com', 'other@examplecorp.com')).toBe(true);
        });

        it('does not match different domains', () => {
            expect(emailDomainsMatch('user@gmail.com', 'other@yahoo.com')).toBe(false);
        });

        it('handles missing domains', () => {
            expect(emailDomainsMatch('invalid', 'user@example.com')).toBe(false);
            expect(emailDomainsMatch('user@example.com', 'invalid')).toBe(false);
            expect(emailDomainsMatch('invalid', 'invalid')).toBe(false);
        });

        it('handles empty strings', () => {
            expect(emailDomainsMatch('', 'user@example.com')).toBe(false);
            expect(emailDomainsMatch('user@example.com', '')).toBe(false);
        });
    });

    describe('phoneNumbersSimilar', () => {
        it('matches identical phone numbers', () => {
            expect(phoneNumbersSimilar('+15551234567', '+15551234567')).toBe(true);
        });

        it('matches phone numbers with different formats', () => {
            expect(phoneNumbersSimilar('+15551234567', '5551234567')).toBe(true);
            expect(phoneNumbersSimilar('15551234567', '5551234567')).toBe(true);
            expect(phoneNumbersSimilar('+1 (555) 123-4567', '5551234567')).toBe(true);
        });

        it('matches 10-digit and 11-digit US numbers', () => {
            expect(phoneNumbersSimilar('5551234567', '15551234567')).toBe(true);
        });

        it('does not match different phone numbers', () => {
            expect(phoneNumbersSimilar('+15551234567', '+15559876543')).toBe(false);
        });

        it('handles empty or null-ish values', () => {
            expect(phoneNumbersSimilar('', '+15551234567')).toBe(false);
            expect(phoneNumbersSimilar('+15551234567', '')).toBe(false);
        });

        it('handles international numbers', () => {
            expect(phoneNumbersSimilar('+442071234567', '+442071234567')).toBe(true);
            expect(phoneNumbersSimilar('442071234567', '+442071234567')).toBe(true);
        });
    });

    describe('validateContactSimilarity', () => {
        const personEmails = ['john@example.com', 'john.doe@work.com'];
        const personPhones = ['+15551234567', '+15559876543'];

        it('returns valid when email domain matches', () => {
            const result = validateContactSimilarity(
                'jane@example.com', // Same domain as person
                undefined,
                personEmails,
                personPhones
            );
            expect(result.emailMatch).toBe(true);
            expect(result.phoneMatch).toBe(false);
            expect(result.isValid).toBe(true);
        });

        it('returns valid when phone is similar', () => {
            const result = validateContactSimilarity(
                undefined,
                '555-123-4567', // Matches first person phone
                personEmails,
                personPhones
            );
            expect(result.emailMatch).toBe(false);
            expect(result.phoneMatch).toBe(true);
            expect(result.isValid).toBe(true);
        });

        it('returns valid when either email or phone matches', () => {
            const result = validateContactSimilarity(
                'jane@example.com',
                '+15551234567',
                personEmails,
                personPhones
            );
            expect(result.emailMatch).toBe(true);
            expect(result.phoneMatch).toBe(true);
            expect(result.isValid).toBe(true);
        });

        it('returns invalid when neither matches', () => {
            const result = validateContactSimilarity(
                'jane@different.com',
                '+15550000000',
                personEmails,
                personPhones
            );
            expect(result.emailMatch).toBe(false);
            expect(result.phoneMatch).toBe(false);
            expect(result.isValid).toBe(false);
        });

        it('returns valid when no search criteria provided', () => {
            const result = validateContactSimilarity(
                undefined,
                undefined,
                personEmails,
                personPhones
            );
            expect(result.emailMatch).toBe(false);
            expect(result.phoneMatch).toBe(false);
            expect(result.isValid).toBe(true); // No criteria = valid by default
        });

        it('handles empty person contact arrays', () => {
            const result = validateContactSimilarity(
                'jane@example.com',
                '+15551234567',
                [],
                []
            );
            expect(result.emailMatch).toBe(false);
            expect(result.phoneMatch).toBe(false);
            expect(result.isValid).toBe(false);
        });
    });
});
