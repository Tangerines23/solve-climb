import { describe, it, expect } from 'vitest';
import {
  normalizeTopicCategory,
  inferInputType,
  clampLevel,
  generateQuestion,
} from '../quizGenerator';
import { Mountain, World, Topic } from '../../types/quiz';

describe('normalizeTopicCategory', () => {
  it('should return the correct category from topicId', () => {
    expect(normalizeTopicCategory('World1-대수')).toBe('대수');
    expect(normalizeTopicCategory('World1-기초')).toBe('기초');
    expect(normalizeTopicCategory('논리')).toBe('논리');
  });

  it('should return "기초" for null, undefined, or empty string', () => {
    expect(normalizeTopicCategory(null)).toBe('기초');
    expect(normalizeTopicCategory(undefined)).toBe('기초');
    expect(normalizeTopicCategory('')).toBe('기초');
  });

  it('should return "기초" for non-string values', () => {
    expect(normalizeTopicCategory(123 as any)).toBe('기초');
    expect(normalizeTopicCategory({} as any)).toBe('기초');
    expect(normalizeTopicCategory([] as any)).toBe('기초');
  });
});

describe('inferInputType', () => {
  it('should infer the correct input type based on the answer', () => {
    expect(inferInputType('3/4')).toBe('fraction');
    expect(inferInputType('0.5')).toBe('decimal');
    expect(inferInputType(42)).toBe('number');
    expect(inferInputType('100')).toBe('number');
  });

  it('should return "number" for null or undefined', () => {
    expect(inferInputType(null)).toBe('number');
    expect(inferInputType(undefined)).toBe('number');
  });
});

describe('clampLevel', () => {
  it('should clamp the level to the correct range', () => {
    expect(clampLevel(5)).toBe(5);
    expect(clampLevel(1)).toBe(1);
    expect(clampLevel(10)).toBe(10);
    expect(clampLevel(15)).toBe(10);
    expect(clampLevel(0)).toBe(1);
    expect(clampLevel(-10)).toBe(1);
    expect(clampLevel(NaN)).toBe(1);
  });
});

describe('generateQuestion', () => {
  const mockRNG = {
    random: () => 0.5,
    randomInt: (min: number, max: number) => Math.floor((max - min + 1) * 0.5) + min,
  };

  it('should generate a question for math World1 with different categories', () => {
    const mathWorld1Basic = generateQuestion(
      'math',
      'World1',
      'World1-기초',
      1,
      'easy',
      'normal',
      mockRNG
    );
    expect(mathWorld1Basic.category).toBe('기초');

    const mathWorld1Algebra = generateQuestion(
      'math',
      'World1',
      'World1-대수',
      1,
      'easy',
      'normal',
      mockRNG
    );
    expect(mathWorld1Algebra.category).toBe('대수');

    const mathWorld1Logic = generateQuestion(
      'math',
      'World1',
      '논리',
      1,
      'easy',
      'normal',
      mockRNG
    );
    expect(mathWorld1Logic.category).toBe('논리');

    const mathWorld1Advanced = generateQuestion(
      'math',
      'World1',
      'World1-심화',
      1,
      'easy',
      'normal',
      mockRNG
    );
    expect(mathWorld1Advanced.category).toBe('심화');
  });

  it('should generate a question for math World2 (Geometry)', () => {
    const mathWorld2 = generateQuestion('math', 'World2', '기하', 1, 'easy', 'normal', mockRNG);
    expect(mathWorld2.category).toBe('기하');
  });

  it('should generate a question for math World3 (Stats)', () => {
    const mathWorld3 = generateQuestion('math', 'World3', '통계', 1, 'easy', 'normal', mockRNG);
    expect(mathWorld3.category).toBe('통계');
  });

  it('should generate a question for math World4 (CS)', () => {
    const mathWorld4 = generateQuestion(
      'math',
      'World4',
      '프로그래밍',
      1,
      'easy',
      'normal',
      mockRNG
    );
    expect(mathWorld4.category).toBe('프로그래밍');
  });

  it('should route to logic problem for logic mountain', () => {
    const logicMountain = generateQuestion('logic', 'World1', '논리', 1, 'easy', 'normal', mockRNG);
    expect(logicMountain.category).toBe('논리');
  });

  it('should route to CS for general mountain World1', () => {
    const generalWorld1 = generateQuestion(
      'general',
      'World1',
      '프로그래밍',
      1,
      'easy',
      'normal',
      mockRNG
    );
    expect(generalWorld1.category).toBe('프로그래밍');
  });

  it('should route to Calculus for general mountain World2', () => {
    const generalWorld2 = generateQuestion(
      'general',
      'World2',
      '미적분',
      1,
      'easy',
      'normal',
      mockRNG
    );
    expect(generalWorld2.category).toBe('미적분');
  });

  it('should fallback to MathProblemGenerator for unknown mountain/world', () => {
    const unknownMountain = generateQuestion(
      'unknown',
      'World1',
      '기초',
      1,
      'easy',
      'normal',
      mockRNG
    );
    expect(unknownMountain.category).toBe('기초');
  });

  it('should handle undefined or empty string topicId safely', () => {
    const undefinedTopic = generateQuestion(
      'math',
      'World1',
      undefined,
      1,
      'easy',
      'normal',
      mockRNG
    );
    expect(undefinedTopic.category).toBe('기초');

    const emptyTopic = generateQuestion('math', 'World1', '', 1, 'easy', 'normal', mockRNG);
    expect(emptyTopic.category).toBe('기초');
  });

  it('should clamp level to 1 for 0 or -5', () => {
    const levelZero = generateQuestion('math', 'World1', '기초', 0, 'easy', 'normal', mockRNG);
    expect(levelZero.level).toBe(1);

    const levelNegativeFive = generateQuestion(
      'math',
      'World1',
      '기초',
      -5,
      'easy',
      'normal',
      mockRNG
    );
    expect(levelNegativeFive.level).toBe(1);
  });
});
