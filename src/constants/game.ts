// src/constants/game.ts
import { Difficulty } from '../types/quiz';

export const SCORE_PER_CORRECT = 10;
export const CLIMB_PER_CORRECT = 10; // 등반 시 10m 상승
export const SLIDE_PER_WRONG = 3; // 오답 시 3m 감점 (미끄러짐)

export const NUMBER_RANGE_BY_DIFFICULTY: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 0, max: 9 },
  medium: { min: 10, max: 99 },
  hard: { min: 100, max: 999 },
};

export const MAX_POSSIBLE_ANSWER = 999 + 999;