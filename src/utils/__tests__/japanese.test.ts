import { describe, it, expect } from 'vitest';
import { generateJapaneseQuestion, normalizeRomaji, HIRAGANA_MAPPINGS } from '../japanese';

describe('japanese', () => {
  describe('generateJapaneseQuestion', () => {
    it('should generate question for easy difficulty', () => {
      const result = generateJapaneseQuestion('easy');

      expect(result).toHaveProperty('hiragana');
      expect(result).toHaveProperty('romaji');
      expect(typeof result.hiragana).toBe('string');
      expect(typeof result.romaji).toBe('string');
      expect(result.hiragana.length).toBeGreaterThan(0);
      expect(result.romaji.length).toBeGreaterThan(0);
    });

    it('should generate question for medium difficulty', () => {
      const result = generateJapaneseQuestion('medium');

      expect(result).toHaveProperty('hiragana');
      expect(result).toHaveProperty('romaji');
      expect(typeof result.hiragana).toBe('string');
      expect(typeof result.romaji).toBe('string');
    });

    it('should generate question for hard difficulty', () => {
      const result = generateJapaneseQuestion('hard');

      expect(result).toHaveProperty('hiragana');
      expect(result).toHaveProperty('romaji');
      expect(typeof result.hiragana).toBe('string');
      expect(typeof result.romaji).toBe('string');
    });

    it('should return valid hiragana from mappings', () => {
      for (let i = 0; i < 10; i++) {
        const result = generateJapaneseQuestion('hard');
        const found = HIRAGANA_MAPPINGS.find((m) => m.hiragana === result.hiragana);
        expect(found).toBeDefined();
        expect(found?.romaji).toBe(result.romaji);
      }
    });

    it('should generate different questions on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 20; i++) {
        const result = generateJapaneseQuestion('hard');
        results.add(result.hiragana);
      }
      // Should generate at least some different questions
      expect(results.size).toBeGreaterThan(1);
    });

    it('should use correct difficulty filter for easy', () => {
      // Easy should only include basic vowels and K, S, T, N, H, M rows
      for (let i = 0; i < 10; i++) {
        const result = generateJapaneseQuestion('easy');
        const mapping = HIRAGANA_MAPPINGS.find((m) => m.hiragana === result.hiragana);
        expect(mapping).toBeDefined();
        // Check that it's from the allowed set
        const firstChar = result.hiragana[0];
        const allowedChars = ['あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ', 'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と', 'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ', 'ま', 'み', 'む', 'め', 'も'];
        expect(allowedChars.includes(firstChar)).toBe(true);
      }
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

