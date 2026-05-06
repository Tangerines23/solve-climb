import { TierDefinition, MilestoneItem, TIER_CYCLE_LIMIT } from '../types/roadmap';

export type { MilestoneItem };

export { TIER_CYCLE_LIMIT }; // Re-export for compatibility

/**
 * 한 사이클 내에서 반복되는 티어 정의입니다.
 */
export const ALTITUDE_TIERS: TierDefinition[] = [
  { name: '베이스캠프', goal: 1000, icon: '⛺', colorVar: '--color-tier-base' },
  { name: '등산로', goal: 5000, icon: '🥾', colorVar: '--color-tier-trail' },
  { name: '중턱', goal: 20000, icon: '⛰️', colorVar: '--color-tier-mid' },
  { name: '고지대', goal: 50000, icon: '🏔️', colorVar: '--color-tier-high' },
  { name: '봉우리', goal: 100000, icon: '🦅', colorVar: '--color-tier-peak' },
  { name: '정상', goal: 250000, icon: '🚩', colorVar: '--color-tier-summit' },
];

/**
 * 고도와 별 개수를 분석하여 현재 티어 정보를 반환합니다.
 */
export const getTierInfo = (altitude: number) => {
  // 1을 빼는 이유는 250,000m 정각일 때 1성 전설로 넘어가는 것을 방지하기 위함 (기존 로직 유지)
  const stars = Math.floor(Math.max(0, altitude - 1) / TIER_CYCLE_LIMIT);
  const currentCycleScore = (Math.max(0, altitude - 1) % TIER_CYCLE_LIMIT) + 1;

  // 현재 티어: 현재 점수 이하인 가장 높은 목표를 가진 티어
  const reversedTiers = [...ALTITUDE_TIERS].reverse();
  const reachedTierIndex = reversedTiers.findIndex((t) => currentCycleScore >= t.goal);
  const currentTier =
    reachedTierIndex === -1
      ? ALTITUDE_TIERS[0]
      : (reversedTiers.at(reachedTierIndex) ?? ALTITUDE_TIERS[0]);

  // 다음 티어: 현재 점수보다 높은 첫 번째 목표
  const nextTierIndex = ALTITUDE_TIERS.findIndex((t) => currentCycleScore < t.goal);
  let nextTier;
  let nextGoalAltitude;
  let nextStars = stars;

  if (nextTierIndex === -1) {
    // 현재 사이클의 모든 티어를 달성한 경우 다음 사이클의 첫 티어로
    nextTier = ALTITUDE_TIERS[0];
    nextStars = stars + 1;
    nextGoalAltitude = nextStars * TIER_CYCLE_LIMIT + nextTier.goal;
  } else {
    nextTier = ALTITUDE_TIERS.at(nextTierIndex) ?? ALTITUDE_TIERS[0];
    nextGoalAltitude = stars * TIER_CYCLE_LIMIT + nextTier.goal;
  }

  return {
    stars: 0,
    name: currentTier.name,
    nextTierName: nextTier.name,
    icon: currentTier.icon,
    colorVar: currentTier.colorVar,
    nextGoal: nextGoalAltitude,
    currentCycleScore,
  };
};

/**
 * 비로그인 유저를 위한 대표 칭호
 */
export const ANONYMOUS_USER_TITLE = '비로그인 유저';

/**
 * 고도에 따른 유저 칭호 생성 로직
 */
export const getUserTitle = (altitude: number): string => {
  if (altitude >= 1000000) return `은하계 등반 전설`;
  if (altitude >= 750000) return `우주 신기원 개척자`;
  if (altitude >= 500000) return `무중력의 지배자`;
  if (altitude >= 250000) return '성층권의 군주 (최종 등반가)';
  if (altitude >= 100000) return '구름 위의 지배자';
  if (altitude >= 50000) return '하능 위 신선';
  if (altitude >= 20000) return '절벽의 베테랑';
  if (altitude >= 8848) return '에베레스트 정복자';
  if (altitude >= 5000) return '고산 지대 적응자';
  if (altitude >= 1500) return '산중턱 탐험가';
  return '초보 등반가';
};

/**
 * 스마트 코멘트 생성을 위한 조건부 메시지
 */
export const getSmartComment = ({
  streakCount,
  averageAccuracy,
  maxCombo,
  totalAltitude,
}: {
  streakCount: number;
  averageAccuracy: number;
  maxCombo: number;
  totalAltitude: number;
}): string => {
  if (streakCount >= 7) return `${streakCount}일 연속 완등! 등반의 신이 강림하셨나요? 🔥`;
  if (streakCount >= 3) return `${streakCount}일 연속 등반 중! 꾸준함이 곧 실력입니다. ✨`;
  if (averageAccuracy >= 98)
    return '정교한 산악인이시네요! 단 하나의 실수도 용납하지 않는 군요. 🎯';
  if (maxCombo >= 100) return `무려 ${maxCombo}콤보! 폭발적인 집중력의 소유자입니다. ⚡`;
  if (totalAltitude >= 250000)
    return '전설의 영역에 도달하셨습니다. 이제부터는 성급을 올릴 시간입니다! ⭐';
  if (totalAltitude >= 20000) return '고산 지대에 진입하셨습니다. 이제부터가 진짜 등반입니다! 🏔️';
  if (totalAltitude >= 5000) return '산중턱을 넘어섰네요. 정상이 조금씩 보이기 시작합니다. 🌲';
  return '오늘도 한 걸음 더 높은 곳으로! 즐거운 등반 되세요. 🥾';
};
