// src/app/checkout/page.test.ts
// Unit tests for the pure address helper functions exported from the checkout page.
// These are isolated from React — no DOM needed.

import { serializeAddress, parseAddress } from './page';

describe('Checkout Address Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── serializeAddress ──────────────────────────────────────────────────────

  describe('serializeAddress', () => {
    it('should join all five fields with newline delimiters in the correct order', () => {
      // Arrange
      const addr = {
        building: 'Flat 4B, Sunrise Towers',
        street: 'MG Road',
        city: 'Jaipur',
        state: 'Rajasthan',
        pin: '302001',
      };

      // Act
      const result = serializeAddress(addr);

      // Assert
      expect(result).toBe('Flat 4B, Sunrise Towers\nMG Road\nJaipur\nRajasthan\n302001');
    });

    it('should produce exactly 4 newline characters (5 lines) even for empty sub-fields', () => {
      // Arrange
      const addr = { building: '', street: '', city: '', state: '', pin: '' };

      // Act
      const result = serializeAddress(addr);

      // Assert
      expect(result.split('\n')).toHaveLength(5);
      expect(result).toBe('\n\n\n\n');
    });

    it('should preserve internal whitespace within each field', () => {
      // Arrange
      const addr = {
        building: '  Block A  ',
        street: 'Lane 1, Near Mall',
        city: 'New Delhi',
        state: 'Delhi',
        pin: '110001',
      };

      // Act
      const result = serializeAddress(addr);
      const lines = result.split('\n');

      // Assert — whitespace is preserved exactly, not trimmed
      expect(lines[0]).toBe('  Block A  ');
      expect(lines[1]).toBe('Lane 1, Near Mall');
    });
  });

  // ─── parseAddress ──────────────────────────────────────────────────────────

  describe('parseAddress', () => {
    it('should correctly parse a well-formed 5-line serialised address', () => {
      // Arrange
      const raw = 'Flat 4B\nMG Road\nJaipur\nRajasthan\n302001';

      // Act
      const result = parseAddress(raw);

      // Assert
      expect(result).toStrictEqual({
        building: 'Flat 4B',
        street: 'MG Road',
        city: 'Jaipur',
        state: 'Rajasthan',
        pin: '302001',
      });
    });

    it('should return an empty address object when given null', () => {
      // Arrange & Act
      const result = parseAddress(null);

      // Assert
      expect(result).toStrictEqual({ building: '', street: '', city: '', state: '', pin: '' });
    });

    it('should return an empty address object when given undefined', () => {
      // Arrange & Act
      const result = parseAddress(undefined);

      // Assert
      expect(result).toStrictEqual({ building: '', street: '', city: '', state: '', pin: '' });
    });

    it('should return an empty address object when given an empty string', () => {
      // Arrange & Act
      const result = parseAddress('');

      // Assert
      expect(result).toStrictEqual({ building: '', street: '', city: '', state: '', pin: '' });
    });

    it('should place a legacy single-line address entirely in the building field', () => {
      // Arrange — address saved before the split-field update
      const raw = '12 MG Road, Jaipur, Rajasthan 302001';

      // Act
      const result = parseAddress(raw);

      // Assert
      expect(result.building).toBe(raw);
      expect(result.street).toBe('');
      expect(result.city).toBe('');
      expect(result.state).toBe('');
      expect(result.pin).toBe('');
    });

    it('should handle a partially filled address (fewer than 5 lines) as a legacy address', () => {
      // Arrange
      const raw = 'Flat 4B\nMG Road\nJaipur';

      // Act
      const result = parseAddress(raw);

      // Assert — treated as legacy, everything goes into building
      expect(result.building).toBe(raw);
      expect(result.street).toBe('');
    });

    it('should be a round-trip inverse of serializeAddress', () => {
      // Arrange
      const original = {
        building: 'Apt 12',
        street: 'Baker Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pin: '400001',
      };

      // Act
      const serialized = serializeAddress(original);
      const parsed     = parseAddress(serialized);

      // Assert
      expect(parsed).toStrictEqual(original);
    });
  });
});
