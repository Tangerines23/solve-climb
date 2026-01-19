import { describe, it, expect, vi } from 'vitest';
import {
  validateNumberParam,
  validateFloatParam,
  validateStringParam,
  validateCategoryParam,
  validateSubTopicParam,
  validateModeParam,
  validateLevelParam,
} from '../urlParams';

// Mock APP_CONFIG
vi.mock('../../config/app', () => ({
  APP_CONFIG: {
    CATEGORIES: [{ id: 'math' }, { id: 'language' }],
    SUB_TOPICS: {
      math: [{ id: 'arithmetic' }, { id: 'equations' }],
      language: [{ id: 'japanese' }],
    },
  },
}));

describe('validation-urlParams', () => {
  describe('validateNumberParam', () => {
    it('should return number for valid input', () => {
      expect(validateNumberParam('5', 0, 10)).toBe(5);
    });

    it('should return null for invalid input', () => {
      expect(validateNumberParam('invalid', 0, 10)).toBeNull();
      expect(validateNumberParam('15', 0, 10)).toBeNull();
    });
  });

  describe('validateFloatParam', () => {
    it('should return float for valid input', () => {
      expect(validateFloatParam('5.5', 0, 10)).toBe(5.5);
    });

    it('should return null for invalid input', () => {
      expect(validateFloatParam('invalid', 0, 10)).toBeNull();
    });
  });

  describe('validateStringParam', () => {
    it('should return string for valid input', () => {
      expect(validateStringParam('value', ['value', 'other'])).toBe('value');
    });

    it('should return null for invalid input', () => {
      expect(validateStringParam('invalid', ['value', 'other'])).toBeNull();
    });
  });

  describe('validateCategoryParam', () => {
    it('should return category for valid input', () => {
      expect(validateCategoryParam('math')).toBe('math');
    });

    it('should return null for invalid input', () => {
      expect(validateCategoryParam('invalid')).toBeNull();
    });
  });

  describe('validateSubTopicParam', () => {
    it('should return subTopic for valid input', () => {
      expect(validateSubTopicParam('math', 'arithmetic')).toBe('arithmetic');
    });

    it('should return null for invalid input', () => {
      expect(validateSubTopicParam('math', 'invalid')).toBeNull();
    });
  });

  describe('validateModeParam', () => {
    it('should return mode for valid input', () => {
      expect(validateModeParam('time-attack')).toBe('time-attack');
      expect(validateModeParam('survival')).toBe('survival');
    });

    it('should return null for invalid input', () => {
      expect(validateModeParam('invalid')).toBeNull();
    });
  });

  describe('validateLevelParam', () => {
    it('should return level for valid input', () => {
      expect(validateLevelParam('5', 20)).toBe(5);
    });

    it('should return null for invalid input', () => {
      expect(validateLevelParam('25', 20)).toBeNull();
    });

    it('should return null for level below minimum', () => {
      expect(validateLevelParam('0', 20)).toBeNull();
    });

    it('should return null for level at maximum boundary', () => {
      expect(validateLevelParam('21', 20)).toBeNull();
    });

    it('should return level at minimum boundary', () => {
      expect(validateLevelParam('1', 20)).toBe(1);
    });

    it('should return level at maximum boundary', () => {
      expect(validateLevelParam('20', 20)).toBe(20);
    });
  });

  describe('validateNumberParam - Edge cases', () => {
    it('should return null for null input', () => {
      expect(validateNumberParam(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(validateNumberParam('')).toBeNull();
    });

    it('should handle boundary values', () => {
      expect(validateNumberParam('0', 0, 10)).toBe(0);
      expect(validateNumberParam('10', 0, 10)).toBe(10);
      expect(validateNumberParam('-1', 0, 10)).toBeNull();
      expect(validateNumberParam('11', 0, 10)).toBeNull();
    });

    it('should handle default min and max', () => {
      expect(validateNumberParam('0')).toBe(0);
      expect(validateNumberParam('999999')).toBe(999999);
    });

    it('should handle negative numbers with negative min', () => {
      expect(validateNumberParam('-5', -10, 10)).toBe(-5);
      expect(validateNumberParam('-11', -10, 10)).toBeNull();
    });
  });

  describe('validateFloatParam - Edge cases', () => {
    it('should return null for null input', () => {
      expect(validateFloatParam(null)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(validateFloatParam('')).toBeNull();
    });

    it('should handle decimal values', () => {
      expect(validateFloatParam('5.5', 0, 10)).toBe(5.5);
      expect(validateFloatParam('0.1', 0, 10)).toBe(0.1);
      expect(validateFloatParam('9.99', 0, 10)).toBe(9.99);
    });

    it('should handle boundary values', () => {
      expect(validateFloatParam('0.0', 0, 10)).toBe(0);
      expect(validateFloatParam('10.0', 0, 10)).toBe(10);
      expect(validateFloatParam('-0.1', 0, 10)).toBeNull();
      expect(validateFloatParam('10.1', 0, 10)).toBeNull();
    });

    it('should handle scientific notation', () => {
      expect(validateFloatParam('1e2', 0, 200)).toBe(100);
    });
  });

  describe('validateStringParam - Edge cases', () => {
    it('should return null for null input', () => {
      expect(validateStringParam(null, ['value'])).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(validateStringParam('', ['value'])).toBeNull();
    });

    it('should return null for empty allowedValues array', () => {
      expect(validateStringParam('value', [])).toBeNull();
    });

    it('should handle case-sensitive matching', () => {
      expect(validateStringParam('Value', ['value', 'Value'])).toBe('Value');
      expect(validateStringParam('value', ['Value'])).toBeNull();
    });
  });

  describe('validateSubTopicParam - Edge cases', () => {
    it('should return null when category is null', () => {
      expect(validateSubTopicParam(null, 'arithmetic')).toBeNull();
    });

    it('should return null when subTopic is null', () => {
      expect(validateSubTopicParam('math', null)).toBeNull();
    });

    it('should return null when both are null', () => {
      expect(validateSubTopicParam(null, null)).toBeNull();
    });

    it('should return null for invalid category', () => {
      expect(validateSubTopicParam('invalid', 'arithmetic')).toBeNull();
    });
  });

  describe('validateModeParam - Edge cases', () => {
    it('should return null for null input', () => {
      expect(validateModeParam(null)).toBeNull();
    });

    it('should handle time_attack variant', () => {
      expect(validateModeParam('time_attack')).toBe('time-attack');
    });

    it('should return null for empty string', () => {
      expect(validateModeParam('')).toBeNull();
    });

    it('should return null for case variations', () => {
      expect(validateModeParam('TIME-ATTACK')).toBeNull();
      expect(validateModeParam('Survival')).toBeNull();
    });
  });
});
