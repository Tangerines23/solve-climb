import { describe, it, expect, vi } from 'vitest';
import {
  validateNumberParam,
  validateFloatParam,
  validateStringParam,
  validateCategoryParam,
  validateSubTopicParam,
  validateModeParam,
  validateLevelParam,
} from '../validation';

// Mock APP_CONFIG
vi.mock('../config/app', () => ({
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
  });
});

