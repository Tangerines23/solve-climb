import { describe, it, expect } from 'vitest';
import { generateJapaneseQuestion, normalizeRomaji, HIRAGANA_MAPPINGS } from '../japanese';

describe('japanese', () => {
  describe('generateJapaneseQuestion', () => {
    it('should generate question for easy difficulty', () => {
      const result = generateJapaneseQuestion('easy');

      expect(result).toHaveProperty('question');
      expect(result).toHaveProperty('answer');
      expect(typeof result.question).toBe('string');
      expect(typeof result.answer).toBe('string');
      expect(result.question.length).toBeGreaterThan(0);
      expect(result.answer.length).toBeGreaterThan(0);
    });

    it('should generate question for medium difficulty', () => {
      const result = generateJapaneseQuestion('medium');

      expect(result).toHaveProperty('question');
      expect(result).toHaveProperty('answer');
      expect(typeof result.question).toBe('string');
      expect(typeof result.answer).toBe('string');
    });

    it('should generate question for hard difficulty', () => {
      const result = generateJapaneseQuestion('hard');

      expect(result).toHaveProperty('question');
      expect(result).toHaveProperty('answer');
      expect(typeof result.question).toBe('string');
      expect(typeof result.answer).toBe('string');
    });

    it('should return valid hiragana from mappings', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateJapaneseQuestion('hard');
        const found = HIRAGANA_MAPPINGS.find((m) => m.hiragana === result.question);
        expect(found).toBeDefined();
        expect(found?.romaji).toBe(result.answer);
      }
    });

    it('should generate different questions on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        const result = generateJapaneseQuestion('hard');
        results.add(result.question);
      }
      // Should generate at least some different questions
      expect(results.size).toBeGreaterThan(1);
    });

    it('should use correct difficulty filter for easy', () => {
      // Easy should only include basic vowels and K, S, T, N, H, M rows
      for (let i = 0; i < 10; i++) {
        const result = generateJapaneseQuestion('easy');
        const mapping = HIRAGANA_MAPPINGS.find((m) => m.hiragana === result.question);
        expect(mapping).toBeDefined();
        // Check that it's from the allowed set
        const firstChar = result.question[0];
        const allowedChars = [
          'あ',
          'い',
          'う',
          'え',
          'お',
          'か',
          'き',
          'く',
          'け',
          'こ',
          'さ',
          'し',
          'す',
          'せ',
          'そ',
          'た',
          'ち',
          'つ',
          'て',
          'と',
          'な',
          'に',
          'ぬ',
          'ね',
          'の',
          'は',
          'ひ',
          'ふ',
          'へ',
          'ほ',
          'ま',
          'み',
          'む',
          'め',
          'も',
        ];
        expect(allowedChars.includes(firstChar)).toBe(true);
      }
    });

    it('should handle default case for unknown difficulty', () => {
      const result = generateJapaneseQuestion('unknown' as any);
      expect(result).toHaveProperty('question');
      expect(result).toHaveProperty('answer');
      const found = HIRAGANA_MAPPINGS.find((m) => m.hiragana === result.question);
      expect(found).toBeDefined();
    });
  });

  describe('normalizeRomaji', () => {
    it('should convert to lowercase', () => {
      expect(normalizeRomaji('A')).toBe('a');
      expect(normalizeRomaji('KI')).toBe('ki');
      expect(normalizeRomaji('SHI')).toBe('shi');
    });

    it('should trim whitespace', () => {
      expect(normalizeRomaji('  a  ')).toBe('a');
      expect(normalizeRomaji(' ki ')).toBe('ki');
      expect(normalizeRomaji('\tshi\n')).toBe('shi');
    });

    it('should handle mixed case and whitespace', () => {
      expect(normalizeRomaji('  Ki  ')).toBe('ki');
      expect(normalizeRomaji('\nSHI\t')).toBe('shi');
      expect(normalizeRomaji('  A  ')).toBe('a');
    });

    it('should handle empty string', () => {
      expect(normalizeRomaji('')).toBe('');
      expect(normalizeRomaji('   ')).toBe('');
    });

    it('should handle already normalized strings', () => {
      expect(normalizeRomaji('a')).toBe('a');
      expect(normalizeRomaji('ki')).toBe('ki');
      expect(normalizeRomaji('shi')).toBe('shi');
    });
  });
});
