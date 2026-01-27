import { describe, it, expect } from 'vitest';
import { getSuperBowlNumber, toRomanNumeral, getSuperBowlRomanNumeral } from '../superbowlLogos';

describe('superbowlLogos utilities', () => {
  describe('toRomanNumeral', () => {
    it('should convert 1 to I', () => {
      expect(toRomanNumeral(1)).toBe('I');
    });

    it('should convert 5 to V', () => {
      expect(toRomanNumeral(5)).toBe('V');
    });

    it('should convert 10 to X', () => {
      expect(toRomanNumeral(10)).toBe('X');
    });

    it('should convert 50 to L', () => {
      expect(toRomanNumeral(50)).toBe('L');
    });

    it('should convert 55 to LV', () => {
      expect(toRomanNumeral(55)).toBe('LV');
    });

    it('should convert 56 to LVI', () => {
      expect(toRomanNumeral(56)).toBe('LVI');
    });

    it('should convert 57 to LVII', () => {
      expect(toRomanNumeral(57)).toBe('LVII');
    });

    it('should convert 58 to LVIII', () => {
      expect(toRomanNumeral(58)).toBe('LVIII');
    });

    it('should convert 59 to LIX', () => {
      expect(toRomanNumeral(59)).toBe('LIX');
    });

    it('should convert 100 to C', () => {
      expect(toRomanNumeral(100)).toBe('C');
    });

    it('should convert 4 to IV', () => {
      expect(toRomanNumeral(4)).toBe('IV');
    });

    it('should convert 9 to IX', () => {
      expect(toRomanNumeral(9)).toBe('IX');
    });
  });

  describe('getSuperBowlNumber', () => {
    it('should return null for years before 1967', () => {
      expect(getSuperBowlNumber(1966)).toBeNull();
      expect(getSuperBowlNumber(1960)).toBeNull();
    });

    it('should return correct Super Bowl number for 1967', () => {
      expect(getSuperBowlNumber(1967)).toBe('I');
    });

    it('should return correct Super Bowl number for 2021', () => {
      expect(getSuperBowlNumber(2021)).toBe('LV');
    });

    it('should return correct Super Bowl number for 2022', () => {
      expect(getSuperBowlNumber(2022)).toBe('LVI');
    });

    it('should return correct Super Bowl number for 2023', () => {
      expect(getSuperBowlNumber(2023)).toBe('LVII');
    });

    it('should return correct Super Bowl number for 2024', () => {
      expect(getSuperBowlNumber(2024)).toBe('LVIII');
    });

    it('should return correct Super Bowl number for 2025', () => {
      expect(getSuperBowlNumber(2025)).toBe('LIX');
    });
  });

  describe('getSuperBowlRomanNumeral', () => {
    it('should return null for years before 1967', () => {
      expect(getSuperBowlRomanNumeral(1966)).toBeNull();
    });

    it('should return just the Roman numeral without L prefix', () => {
      expect(getSuperBowlRomanNumeral(2021)).toBe('LV');
      expect(getSuperBowlRomanNumeral(2025)).toBe('LIX');
    });
  });
});
