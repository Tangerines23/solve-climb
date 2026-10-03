import { describe, it, expect } from 'vitest';
import { sanitizeQuizInput, QUIZ_INPUT_LIMITS } from '../quizInputFilter';

describe('sanitizeQuizInput', () => {
  describe('Standard Numeric Mode (Default)', () => {
    it('allows numeric characters and slices to max length (6)', () => {
      expect(sanitizeQuizInput('12345')).toBe('12345');
      expect(sanitizeQuizInput('123456789')).toBe('123456');
    });

    it('strips non-numeric characters', () => {
      expect(sanitizeQuizInput('12abc34!#')).toBe('1234');
      expect(sanitizeQuizInput('hello')).toBe('');
      expect(sanitizeQuizInput('-12')).toBe('12');
    });
  });

  describe('Japanese Mode', () => {
    it('allows only English alphabets and truncates to max length (20)', () => {
      expect(sanitizeQuizInput('konnichiwa', { isJapaneseQuiz: true })).toBe('konnichiwa');
      expect(sanitizeQuizInput('123ohayo!#', { isJapaneseQuiz: true })).toBe('ohayo');
      expect(sanitizeQuizInput('abcdefghijklmnopqrstuvwxyz', { isJapaneseQuiz: true })).toBe(
        'abcdefghijklmnopqrst'.slice(0, QUIZ_INPUT_LIMITS.MAX_JAPANESE_LENGTH)
      );
    });
  });

  describe('Force System Keyboard Mode', () => {
    it('preserves text and limits to max 10 characters', () => {
      expect(sanitizeQuizInput('1234567890extra', { forceSystemKeyboard: true })).toBe(
        '1234567890'
      );
      expect(sanitizeQuizInput('123-456', { forceSystemKeyboard: true })).toBe('123-456');
    });
  });

  describe('Allow Negative Mode (Equations / Calculus)', () => {
    it('preserves valid negative integers up to 6 characters', () => {
      expect(sanitizeQuizInput('-42', { allowNegative: true })).toBe('-42');
      expect(sanitizeQuizInput('123', { allowNegative: true })).toBe('123');
    });

    it('moves misplaced minus sign to the front', () => {
      expect(sanitizeQuizInput('42-', { allowNegative: true })).toBe('-42');
      expect(sanitizeQuizInput('1-23', { allowNegative: true })).toBe('-123');
    });

    it('deduplicates multiple minus signs to a single front minus', () => {
      expect(sanitizeQuizInput('--99', { allowNegative: true })).toBe('-99');
      expect(sanitizeQuizInput('-5-6-7', { allowNegative: true })).toBe('-567');
    });

    it('strips non-digits except valid negative sign and limits to 6 chars', () => {
      expect(sanitizeQuizInput('-12abc34', { allowNegative: true })).toBe('-1234');
      expect(sanitizeQuizInput('-12345678', { allowNegative: true })).toBe('-12345');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty strings cleanly across all modes', () => {
      expect(sanitizeQuizInput('')).toBe('');
      expect(sanitizeQuizInput('', { isJapaneseQuiz: true })).toBe('');
      expect(sanitizeQuizInput('', { forceSystemKeyboard: true })).toBe('');
      expect(sanitizeQuizInput('', { allowNegative: true })).toBe('');
    });
  });
});
