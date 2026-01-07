// src/constants/game.ts
import { Difficulty } from '../types/quiz';

export const SCORE_PER_CORRECT = 10;
export const CLIMB_PER_CORRECT = 10; // 등반 시 10m 상승
export const SLIDE_PER_WRONG = 3; // 오답 시 3m 감점 (미끄러짐)

// 새로운 등반 거리 시스템 상수
export const BASE_CLIMB_DISTANCE = 10;
export const DISTANCE_PER_LEVEL = 5;
export const BOSS_LEVEL = 10;
export const BOSS_BONUS = 50;

export type ThemeTier = 'basic' | 'advanced' | 'expert';

export const THEME_MULTIPLIERS: Record<ThemeTier, number> = {
  basic: 1.0,
  advanced: 1.5,
  expert: 3.0,
};

export const NUMBER_RANGE_BY_DIFFICULTY: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 0, max: 9 },
  medium: { min: 10, max: 99 },
  hard: { min: 100, max: 999 },
};

export const MAX_POSSIBLE_ANSWER = 999 + 999;

// 무한 서바이벌(첼린지) 설정
export const SURVIVAL_CONFIG = {
  HEAL_INTERVAL: 10, // 10문제마다 회복
  MAX_LIVES: 5,
  INITIAL_LIVES: 3,
  WAVES: [
    { start: 1, end: 10, level: 1, timer: 5, multiplier: 1.0 },
    { start: 11, end: 20, level: 4, timer: 6, multiplier: 2.0 },
    { start: 21, end: 30, level: 7, timer: 8, multiplier: 3.0 },
    { start: 31, end: 50, level: 10, timer: 10, multiplier: 4.0 },
    { start: 51, end: 9999, level: 15, timer: 7, multiplier: 5.0 },
  ],
};
