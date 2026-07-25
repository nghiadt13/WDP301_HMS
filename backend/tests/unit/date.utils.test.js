const { parsePositiveInteger, parseDateOnly, toDateKey, addDays } = require('../../src/utils/date.utils');

describe('date.utils unit tests', () => {
  describe('parsePositiveInteger', () => {
    it('should parse valid positive integers', () => {
      expect(parsePositiveInteger('10', 0)).toBe(10);
      expect(parsePositiveInteger(5, 0)).toBe(5);
    });

    it('should return fallback for invalid inputs', () => {
      expect(parsePositiveInteger('invalid', 0)).toBe(0);
      expect(parsePositiveInteger(-5, 0)).toBe(0);
    });
  });

  describe('parseDateOnly', () => {
    it('should parse YYYY-MM-DD string correctly', () => {
      const date = parseDateOnly('2026-07-24');
      expect(date).toBeInstanceOf(Date);
      expect(toDateKey(date)).toBe('2026-07-24');
    });

    it('should return null for invalid date string', () => {
      expect(parseDateOnly('invalid-date')).toBeNull();
      expect(parseDateOnly('')).toBeNull();
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const base = new Date('2026-07-24T00:00:00.000Z');
      const next = addDays(base, 2);
      expect(toDateKey(next)).toBe('2026-07-26');
    });
  });
});
