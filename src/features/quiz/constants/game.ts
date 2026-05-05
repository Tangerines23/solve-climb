// src/constants/game.ts
import { Difficulty } from '../types/quiz';

export const SCORE_PER_CORRECT = 10;
export const CLIMB_PER_CORRECT = 10; // 등반 시 10m 상승

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

// 무한 서바이벌(첼린지) 설정 v2.4
export const SURVIVAL_CONFIG = {
  HEAL_INTERVAL: 10,
  MAX_LIVES: 3,
  INITIAL_LIVES: 1,
  // 스마트 압박 타이머 설정 (v2.4 상세 기획 반영)
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
  // v2.4 슬라이딩 윈도우 + 함정 알고리즘 설정
  SLIDING_WINDOW_CONFIG: {
    BASE_LEVEL_DIVIDER: 5, // Floor(문제 수 / 5) + 1
    MAIN_STREAM_DELTA: 2, // 기준 레벨 ±2
    TRAP_PROBABILITY: 0.2, // 20% 확률로 함정
    TRAP_DELTA_MIN: 3, // 기준 레벨 - 3 이하
  },
};

// 랜드마크 매핑 (v2.2)
export const LANDMARK_MAPPING: Record<number, { icon: string; text: string }> = {
  100: { icon: '🌲', text: '첫 번째 숲 (100m)' },
  300: { icon: '☁️', text: '구름 위 (300m)' },
  500: { icon: '🏔️', text: '정상 정복 예정 (500m)' },
  1000: { icon: '🏆', text: '전설의 시작 (1000m)' },
};

/**
 * 카테고리별 게임 설정 (v2.5)
 */
export const CATEGORY_CONFIG: Record<string, { maxLevel: number; baseTime: number }> = {
  기초: { maxLevel: 30, baseTime: 30 },
  논리: { maxLevel: 15, baseTime: 15 },
  대수: { maxLevel: 20, baseTime: 20 },
  심화: { maxLevel: 15, baseTime: 15 },
  default: { maxLevel: 10, baseTime: 10 },
};

/**
 * 전역 게임 설정 상수
 */
export const GAME_CONFIG = {
  PROBLEMS_PER_LEVEL: 20,
  MAX_ANSWER_LENGTH_KEYPAD: 10,
  MAX_ANSWER_LENGTH_KEYBOARD: 20,
  PENALTY_AMOUNT: 5,
  INCORRECT_VIBRATION_DURATION: 200,
};

// 애니메이션 및 지연 시간 설정
export const ANIMATION_CONFIG = {
  TRANSITION_DELAY: 150,
  KEYBOARD_FOCUS_DELAY: 200,
  TOAST_DURATION: 2000,
  MODAL_DELAY: 300,
  RELOAD_DELAY: 500,
  QUERY_PARAM_DELAY: 100,
  CONFETTI_DURATION: 3000,
};

/**
 * UI 공통 메시지 (퀴즈 도메인 전용)
 */
export const UI_MESSAGES = {
  ROADMAP_TITLE: '등반 일지',
  CURRENT_ALTITUDE: '현재 고도',
  TOTAL_ALTITUDE: '누적 고도',
  TIME_UP: '시간 종료!',
  CHALLENGE_END: '도전 종료',
  GAME_OVER: '게임 오버',
  GENERATING_QUESTIONS: '문제를 생성하는 중...',
  WORLD_NAMES: {
    World1: 'World 1: 수리봉',
    World2: 'World 2: 만장굴',
    World3: 'World 3: 한라산',
    World4: 'World 4: 테크노파크',
    LangWorld1: '언어의 정원',
  },
  UNIT_METERS: 'm',
  AD_WATCH_START: '광고를 준비하고 있습니다...',
  AD_WATCH_COMPLETE: '광고 시청 완료!',
  AD_WATCH_FAILED: (error?: string) => `광고 시청 실패: ${error || '알 수 없는 오류'}`,
  STAMINA_REFUNDED: '스테미나가 환불되었습니다.',
  STAMINA_RECHARGED_FULL: '스테미나가 모두 회복되었습니다!',
};

/**
 * 카테고리 식별자 상수
 */
export const CATEGORY_IDS = {
  MATH: 'math',
  LANGUAGE: 'language',
  LOGIC: 'logic',
  GENERAL: 'general',
} as const;

/**
 * 수학 서브 카테고리 식별자
 */
export const MATH_SUB_IDS = {
  EQUATIONS: 'equations',
  CALCULUS: 'calculus',
} as const;

/**
 * 서브 카테고리 식별자
 */
export const SUB_CATEGORY_IDS = {
  JAPANESE: 'japanese',
} as const;
