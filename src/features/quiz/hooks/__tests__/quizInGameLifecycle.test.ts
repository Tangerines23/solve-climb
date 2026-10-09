import { describe, it, expect } from 'vitest';
import { computeInitialTimeLimit } from '@/features/quiz/hooks/useQuizStartLogic';
import { mapCategoryAndSubject } from '@/features/quiz/services/LevelSyncService';
import { calculateSurvivalTargetLevel } from '@/features/quiz/hooks/useQuestionGenerator';

describe('computeInitialTimeLimit', () => {
  it('survival mode with ["oxygen_tank"] -> 20', () => {
    expect(computeInitialTimeLimit('survival', ['oxygen_tank'])).toBe(20);
  });

  it('survival mode with [] -> 10', () => {
    expect(computeInitialTimeLimit('survival', [])).toBe(10);
  });

  it('normal mode with ["oxygen_tank"] -> 70', () => {
    expect(computeInitialTimeLimit('normal', ['oxygen_tank'])).toBe(70);
  });

  it('normal mode with [] -> 60', () => {
    expect(computeInitialTimeLimit('normal', [])).toBe(60);
  });

  it('timeattack mode with [] -> 60', () => {
    expect(computeInitialTimeLimit('timeattack', [])).toBe(60);
  });
});

describe('mapCategoryAndSubject', () => {
  it('"arithmetic_addition" -> { rpcCategory: "math", rpcSubject: "add" }', () => {
    expect(mapCategoryAndSubject('arithmetic_addition')).toEqual({
      rpcCategory: 'math',
      rpcSubject: 'add',
    });
  });

  it('"cs_binary" -> { rpcCategory: "cs", rpcSubject: "binary" }', () => {
    expect(mapCategoryAndSubject('cs_binary')).toEqual({ rpcCategory: 'cs', rpcSubject: 'binary' });
  });

  it('"normal", "sub" -> { rpcCategory: "normal", rpcSubject: "sub" }', () => {
    expect(mapCategoryAndSubject('normal', 'sub')).toEqual({
      rpcCategory: 'normal',
      rpcSubject: 'sub',
    });
  });

  it('"normal" -> { rpcCategory: "normal", rpcSubject: "add" }', () => {
    expect(mapCategoryAndSubject('normal')).toEqual({ rpcCategory: 'normal', rpcSubject: 'add' });
  });
});

describe('calculateSurvivalTargetLevel', () => {
  it('When totalQuestions = 25 (baseLevel = 6 > 3): randomFn returning 0.1 (< 0.2 TRAP): returns within trap range [1, 3]', () => {
    const randomFn = () => 0.1;
    expect(calculateSurvivalTargetLevel(25, 10, randomFn)).toBeGreaterThanOrEqual(1);
    expect(calculateSurvivalTargetLevel(25, 10, randomFn)).toBeLessThanOrEqual(3);
  });

  it('When totalQuestions = 25 (baseLevel = 6 > 3): randomFn returning 0.5 (>= 0.2 Mainstream): returns within [4, 8]', () => {
    const randomFn = () => 0.5;
    expect(calculateSurvivalTargetLevel(25, 10, randomFn)).toBeGreaterThanOrEqual(4);
    expect(calculateSurvivalTargetLevel(25, 10, randomFn)).toBeLessThanOrEqual(8);
  });

  it('When totalQuestions = 5 (baseLevel = 2 <= 3): randomFn returning 0.1: does NOT trigger trap (since baseLevel <= 3), returns mainstream [1, 4]', () => {
    const randomFn = () => 0.1;
    expect(calculateSurvivalTargetLevel(5, 10, randomFn)).toBeGreaterThanOrEqual(1);
    expect(calculateSurvivalTargetLevel(5, 10, randomFn)).toBeLessThanOrEqual(4);
  });
});
