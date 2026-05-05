import { describe, it, expect } from 'vitest';
import { generateJapaneseQuestion, normalizeRomaji } from '../japanese';

describe('japanese utility', () => {
  it('should generate a Hiragana question by default', () => {
    const question = generateJapaneseQuestion('easy');
    expect(question).toHaveProperty('question');
    expect(question).toHaveProperty('answer');

    // Check it's an ASCII or close to it romaji string (easy has basic romaji answers)
    expect(question.answer).toMatch(/^[a-z]+$/);
  });

  it('should generate a Katakana question', () => {
    const question = generateJapaneseQuestion('medium', '가타카나');
    expect(question).toHaveProperty('question');
    expect(question).toHaveProperty('answer');
  });

  it('should generate a Vocabulary question', () => {
    const question = generateJapaneseQuestion('medium', '어휘');
    expect(question).toHaveProperty('question');
    expect(question.question).toContain('의 읽는 법은?');
    expect(question).toHaveProperty('answer');
  });

  it('should handle different difficulty levels for Hiragana', () => {
    const easy = generateJapaneseQuestion('easy');
    const medium = generateJapaneseQuestion('medium');
    const hard = generateJapaneseQuestion('hard');

    expect(easy).toBeDefined();
    expect(medium).toBeDefined();
    expect(hard).toBeDefined();
  });

  it('should normalize romaji input correctly', () => {
    expect(normalizeRomaji('  Aka  ')).toBe('aka');
    expect(normalizeRomaji('SHIro')).toBe('shiro');
    expect(normalizeRomaji('foo ')).toBe('foo');
  });
});
