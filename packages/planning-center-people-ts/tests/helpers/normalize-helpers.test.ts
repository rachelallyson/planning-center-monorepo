/**
 * Tests for normalizeEmail and normalizePhone helper functions
 */

import { normalizeEmail, normalizePhone } from '../../src/helpers';

describe('Normalize Helper Functions', () => {
  describe('normalizeEmail', () => {
    it('should lowercase email addresses', () => {
      expect(normalizeEmail('User@Example.COM')).toBe('user@example.com');
      expect(normalizeEmail('JOHN.DOE@GMAIL.COM')).toBe('john.doe@gmail.com');
    });

    it('should trim whitespace', () => {
      expect(normalizeEmail('  user@gmail.com  ')).toBe('user@gmail.com');
      expect(normalizeEmail('\tuser@gmail.com\n')).toBe('user@gmail.com');
    });

    it('should handle already normalized emails', () => {
      expect(normalizeEmail('user@gmail.com')).toBe('user@gmail.com');
    });

    it('should handle emails with plus signs', () => {
      expect(normalizeEmail('user+tag@gmail.com')).toBe('user+tag@gmail.com');
    });

    it('should handle emails with dots', () => {
      expect(normalizeEmail('first.last@gmail.com')).toBe('first.last@gmail.com');
    });
  });

  describe('normalizePhone', () => {
    it('should add +1 prefix to 10-digit US numbers', () => {
      expect(normalizePhone('5551234567')).toBe('+15551234567');
      expect(normalizePhone('(555) 123-4567')).toBe('+15551234567');
      expect(normalizePhone('555-123-4567')).toBe('+15551234567');
    });

    it('should add + prefix to 11-digit numbers starting with 1', () => {
      expect(normalizePhone('15551234567')).toBe('+15551234567');
      expect(normalizePhone('1-555-123-4567')).toBe('+15551234567');
    });

    it('should add + prefix to other length numbers', () => {
      expect(normalizePhone('442071234567')).toBe('+442071234567');
      expect(normalizePhone('1234567890123')).toBe('+1234567890123');
    });

    it('should handle already normalized numbers', () => {
      expect(normalizePhone('+15551234567')).toBe('+15551234567');
      expect(normalizePhone('+442071234567')).toBe('+442071234567');
    });

    it('should strip formatting characters', () => {
      expect(normalizePhone('+1 (555) 123-4567')).toBe('+15551234567');
      expect(normalizePhone('(555) 123-4567')).toBe('+15551234567');
      expect(normalizePhone('555.123.4567')).toBe('+15551234567');
    });

    it('should handle numbers with country code already present', () => {
      expect(normalizePhone('+15551234567')).toBe('+15551234567');
      expect(normalizePhone('15551234567')).toBe('+15551234567');
    });
  });
});
