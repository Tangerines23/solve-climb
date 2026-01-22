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

// 무한 서바이벌(첼린지) 설정 v2.2
export const SURVIVAL_CONFIG = {
  HEAL_INTERVAL: 10, // 10문제마다 회복
  MAX_LIVES: 3, // 기획서 요건: 최대 3목숨까지 확보 가능
  INITIAL_LIVES: 1, // v1.9+: 즉사 규칙 (기본 1개)
  // 스마트 압박 타이머 설정 (v2.2 상세 기획 반영)
  PRESSURE_CONFIG: {
    LEVEL_BASE_TIME: {
      1: 3,
      2: 4,
      3: 5,
      4: 7,
      5: 10,
      6: 12,
      7: 15,
      8: 17,
      9: 18,
      10: 20,
    } as Record<number, number>,
    PRESSURE_FACTOR: {
      START: 2.0, // 시작 배율 (여유로움)
      MIN: 0.8, // 최소 배율 (최소치 고정)
      DECAY: 0.01, // 문제당 감소량
    },
  },
  WAVES: [
    { start: 1, end: 10, minLevel: 1, maxLevel: 3, label: '워밍업' },
    { start: 11, end: 30, minLevel: 4, maxLevel: 7, label: '등반' },
    { start: 31, end: 50, minLevel: 8, maxLevel: 10, label: '고지대' },
    { start: 51, end: 99999, minLevel: 1, maxLevel: 10, label: '무한 루프' },
  ],
};

// 랜드마크 매핑 (v2.2)
export const LANDMARK_MAPPING: Record<number, { icon: string; text: string }> = {
  100: { icon: '🌲', text: '첫 번째 숲 (100m)' },
  300: { icon: '☁️', text: '구름 위 (300m)' },
  500: { icon: '🏔️', text: '정상 정복 예정 (500m)' },
  1000: { icon: '🏆', text: '전설의 시작 (1000m)' },
};
