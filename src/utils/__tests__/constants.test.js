import { describe, it, expect } from 'vitest';
import {
  getBetTypeById,
  getBetOptions,
  getBetOptionLabel,
  DEFAULT_BET_TYPES,
} from '../constants';

describe('constants utilities', () => {
  describe('getBetTypeById', () => {
    it('should return null for invalid betTypes array', () => {
      expect(getBetTypeById(null, 'Y/N')).toBeNull();
      expect(getBetTypeById(undefined, 'Y/N')).toBeNull();
      expect(getBetTypeById('not an array', 'Y/N')).toBeNull();
    });

    it('should return null for non-existent bet type', () => {
      expect(getBetTypeById(DEFAULT_BET_TYPES, 'INVALID')).toBeNull();
    });

    it('should return correct bet type for valid ID', () => {
      const result = getBetTypeById(DEFAULT_BET_TYPES, 'Y/N');
      expect(result).toBeDefined();
      expect(result.id).toBe('Y/N');
      expect(result.label).toBe('Yes/No');
    });

    it('should return correct bet type for O/U', () => {
      const result = getBetTypeById(DEFAULT_BET_TYPES, 'O/U');
      expect(result).toBeDefined();
      expect(result.id).toBe('O/U');
      expect(result.options).toEqual(['O', 'U']);
    });
  });

  describe('getBetOptions', () => {
    it('should return empty array for invalid bet type', () => {
      expect(getBetOptions('INVALID')).toEqual([]);
    });

    it('should return options for string bet type ID', () => {
      const options = getBetOptions('Y/N');
      expect(options).toEqual(['Y', 'N']);
    });

    it('should return options for O/U bet type', () => {
      const options = getBetOptions('O/U');
      expect(options).toEqual(['O', 'U']);
    });

    it('should return team names when requiresTeamNames is true', () => {
      const teamNames = { option1: 'KC', option2: 'SF' };
      const options = getBetOptions('KC/PHL', teamNames);
      expect(options).toEqual(['KC', 'SF']);
    });

    it('should return default options when teamNames not provided for team bet type', () => {
      const options = getBetOptions('KC/PHL');
      expect(options).toEqual(['KC', 'PHL']); // Uses default from DEFAULT_BET_TYPES
    });

    it('should return empty array for integer range bet type', () => {
      const integerRangeType = {
        id: 'INT_RANGE',
        isIntegerRange: true,
        minValue: 0,
        maxValue: 100,
      };
      const options = getBetOptions(integerRangeType);
      expect(options).toEqual([]);
    });

    it('should work with bet type object directly', () => {
      const betType = DEFAULT_BET_TYPES.find(bt => bt.id === 'O/E');
      const options = getBetOptions(betType);
      expect(options).toEqual(['O', 'E']);
    });
  });

  describe('getBetOptionLabel', () => {
    it('should return value for invalid bet type', () => {
      expect(getBetOptionLabel('INVALID', 'Y')).toBe('Y');
    });

    it('should return label for Y/N bet type', () => {
      expect(getBetOptionLabel('Y/N', 'Y')).toBe('Yes');
      expect(getBetOptionLabel('Y/N', 'N')).toBe('No');
    });

    it('should return label for O/U bet type', () => {
      expect(getBetOptionLabel('O/U', 'O')).toBe('Over');
      expect(getBetOptionLabel('O/U', 'U')).toBe('Under');
    });

    it('should return team name when requiresTeamNames is true', () => {
      const teamNames = { option1: 'KC', option2: 'SF' };
      expect(getBetOptionLabel('KC/PHL', 'KC', teamNames)).toBe('KC');
      expect(getBetOptionLabel('KC/PHL', 'SF', teamNames)).toBe('SF');
    });

    it('should return value when no label exists', () => {
      expect(getBetOptionLabel('KC/PHL', 'KC')).toBe('KC');
    });

    it('should work with bet type object directly', () => {
      const betType = DEFAULT_BET_TYPES.find(bt => bt.id === 'O/E');
      expect(getBetOptionLabel(betType, 'O')).toBe('Odd');
      expect(getBetOptionLabel(betType, 'E')).toBe('Even');
    });
  });
});
