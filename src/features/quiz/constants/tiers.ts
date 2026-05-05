// src/constants/tiers.ts
import { supabase } from '@/utils/supabaseClient';

export type TierLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TierInfo {
  level: TierLevel;
  name: string;
  icon: string;
  minScore: number;
  colorVar: string; // CSS 변수명
}

export interface TierCalculationResult {
  level: TierLevel;
  stars: number;
  totalScore: number;
  currentCycleScore: number;
}

// 폴백: 하드코딩된 기본값
const FALLBACK_TIER_DEFINITIONS: TierInfo[] = [
  { level: 0, name: '베이스캠프', icon: '⛺', minScore: 0, colorVar: '--color-tier-base' },
  { level: 1, name: '등산로', icon: '🥾', minScore: 1000, colorVar: '--color-tier-trail' },
  { level: 2, name: '중턱', icon: '⛰️', minScore: 5000, colorVar: '--color-tier-mid' },
  { level: 3, name: '고지대', icon: '🏔️', minScore: 20000, colorVar: '--color-tier-high' },
  { level: 4, name: '봉우리', icon: '🦅', minScore: 50000, colorVar: '--color-tier-peak' },
  { level: 5, name: '정상', icon: '🚩', minScore: 100000, colorVar: '--color-tier-summit' },
  { level: 6, name: '전설', icon: '👑', minScore: 250000, colorVar: '--color-tier-legend' },
];

const FALLBACK_CYCLE_CAP = 250000;

// 캐시 변수
let cachedTierLevels: TierInfo[] | null = null;
let cachedCycleCap: number | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1시간

/**
 * DB에서 티어 정의 로드
 */
export async function loadTierDefinitions(): Promise<TierInfo[]> {
  // 캐시가 유효하면 반환
  if (cachedTierLevels && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedTierLevels;
  }

  try {
    const { data, error } = await supabase.from('tier_definitions').select('*').order('level');

    if (error || !data || data.length === 0) {
      // 폴백: 하드코딩된 기본값
      cachedTierLevels = FALLBACK_TIER_DEFINITIONS;
      cacheTimestamp = Date.now();
      return cachedTierLevels;
    }

    cachedTierLevels = data.map((item) => ({
      level: item.level as TierLevel,
      name: item.name,
      icon: item.icon,
      minScore: item.min_score,
      colorVar: item.color_var,
    }));

    cacheTimestamp = Date.now();
    return cachedTierLevels;
  } catch (error) {
    console.error('Failed to load tier definitions:', error);
    // 폴백 반환
    if (!cachedTierLevels) {
      cachedTierLevels = FALLBACK_TIER_DEFINITIONS;
    }
    return cachedTierLevels;
  }
}

/**
 * DB에서 사이클 기준점 로드
 */
export async function loadCycleCap(): Promise<number> {
  // 캐시가 유효하면 반환
  if (cachedCycleCap !== null && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedCycleCap;
  }

  try {
    const { data, error } = await supabase
      .from('game_config')
      .select('value')
      .eq('key', 'tier_cycle_cap')
      .single();

    if (error || !data) {
      // 폴백: 기본값
      cachedCycleCap = FALLBACK_CYCLE_CAP;
      cacheTimestamp = Date.now();
      return cachedCycleCap;
    }

    cachedCycleCap = parseInt(data.value, 10);
    cacheTimestamp = Date.now();
    return cachedCycleCap;
  } catch (error) {
    console.error('Failed to load cycle cap:', error);
    // 폴백 반환
    if (cachedCycleCap === null) {
      cachedCycleCap = FALLBACK_CYCLE_CAP;
    }
    return cachedCycleCap;
  }
}

/**
 * 레벨 계산 함수 (공통 로직)
 */
function calculateLevel(score: number, tierLevels: TierInfo[]): TierLevel {
  const reversed = [...tierLevels].reverse();
  for (const tier of reversed) {
    if (score >= tier.minScore) {
      return tier.level;
    }
  }
  return 0; // 베이스캠프
}

/**
 * 무한 등반(순환제) 계산 로직
 *
 * @param totalScore 총 마스터리 점수
 * @returns { level: 티어 레벨, stars: 별 개수, totalScore: 총 점수, currentCycleScore: 현재 사이클 내 점수 }
 */
export async function calculateTier(totalScore: number): Promise<TierCalculationResult> {
  const [tierLevels, cycleCap] = await Promise.all([loadTierDefinitions(), loadCycleCap()]);

  // 첫 사이클 이전 (250,000점 이하)
  if (totalScore <= cycleCap) {
    return {
      level: calculateLevel(totalScore, tierLevels),
      stars: 0,
      totalScore,
      currentCycleScore: totalScore,
    };
  }

  // 사이클 이후: 사이클 수와 현재 사이클 내 점수 계산
  // 250,001점부터 다음 사이클 시작 (버퍼 적용)
  const cycleCount = Math.floor((totalScore - 1) / cycleCap); // 사이클 수 (별 개수)
  const currentCycleScore = ((totalScore - 1) % cycleCap) + 1; // 현재 사이클 내 점수 (1부터 시작)

  return {
    level: calculateLevel(currentCycleScore, tierLevels),
    stars: cycleCount,
    totalScore,
    currentCycleScore,
  };
}

/**
 * 동기 버전 (캐시된 값 사용)
 */
export function calculateTierSync(
  totalScore: number,
  tierLevels: TierInfo[],
  cycleCap: number
): TierCalculationResult {
  // 첫 사이클 이전 (250,000점 이하)
  if (totalScore <= cycleCap) {
    return {
      level: calculateLevel(totalScore, tierLevels),
      stars: 0,
      totalScore,
      currentCycleScore: totalScore,
    };
  }

  // 사이클 이후: 250,001점부터 다음 사이클 시작 (버퍼 적용)
  const cycleCount = Math.floor((totalScore - 1) / cycleCap);
  const currentCycleScore = ((totalScore - 1) % cycleCap) + 1;

  return {
    level: calculateLevel(currentCycleScore, tierLevels),
    stars: cycleCount,
    totalScore,
    currentCycleScore,
  };
}

/**
 * 다음 티어까지 필요한 점수
 */
export async function getNextTierInfo(
  currentScore: number
): Promise<{ name: string; minScore: number; remaining: number } | null> {
  const [tierLevels, cycleCap] = await Promise.all([loadTierDefinitions(), loadCycleCap()]);

  const tierResult = await calculateTier(currentScore);

  // 첫 사이클 이전
  if (tierResult.stars === 0) {
    const nextTier = tierLevels.find((t) => t.level === tierResult.level + 1);
    if (!nextTier) {
      // 전설까지 도달: 다음 사이클 시작까지
      return {
        name: '다음 사이클',
        minScore: cycleCap,
        remaining: cycleCap - currentScore,
      };
    }
    return {
      name: nextTier.name,
      minScore: nextTier.minScore,
      remaining: nextTier.minScore - currentScore,
    };
  }

  // 사이클 이후: 현재 사이클 내에서 다음 레벨까지
  const nextTier = tierLevels.find((t) => t.level === tierResult.level + 1);

  if (nextTier) {
    // 같은 사이클 내 다음 레벨
    return {
      name: nextTier.name,
      minScore: nextTier.minScore,
      remaining: nextTier.minScore - tierResult.currentCycleScore,
    };
  } else {
    // 전설까지 도달: 다음 사이클 시작까지
    return {
      name: '다음 사이클',
      minScore: cycleCap,
      remaining: cycleCap - tierResult.currentCycleScore,
    };
  }
}

/**
 * 티어 정보 가져오기 (레벨로)
 */
export async function getTierInfo(level: TierLevel): Promise<TierInfo | null> {
  const tierLevels = await loadTierDefinitions();
  return tierLevels.find((t) => t.level === level) || null;
}
