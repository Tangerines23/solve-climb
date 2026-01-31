import { TierDefinition, MilestoneItem, TIER_CYCLE_LIMIT } from '../types/roadmap';

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
 * 지리적 경관 랜드마크 (절대 고도)
 */
const BASE_LANDMARKS = [
  { label: '심우주 진입', altitude: 1000000, icon: '🌟' },
  { label: '외기권 (Exosphere) 경계', altitude: 700000, icon: '🌌' },
  { label: '열권 (Thermosphere)', altitude: 600000, icon: '🔥' },
  { label: '스타링크 위성 궤도', altitude: 550000, icon: '🛰️' },
  { label: '허블 우주 망원경', altitude: 540000, icon: '🔭' },
  { label: '국제 우주 정거장 (ISS)', altitude: 400000, icon: '👨‍🚀' },
  { label: '카르만 라인 (우주의 시작)', altitude: 100000, icon: '🌌' },
  { label: '성층권 (Stratosphere)', altitude: 50000, icon: '🚀' },
  { label: '펠릭스 바움가르트너 유성 점프', altitude: 39045, icon: '🪂' },
  { label: '오존층 (Ozone Layer)', altitude: 25000, icon: '🛡️' },
  { label: '민항기 순항 고도', altitude: 12000, icon: '✈️' },
  { label: '에베레스트 정상', altitude: 8848, icon: '🏁' },
  { label: '킬리만자로 정상', altitude: 5895, icon: '🗻' },
  { label: '몽블랑 정상', altitude: 4807, icon: '❄️' },
  { label: '후지산 정상', altitude: 3776, icon: '🇯🇵' },
  { label: '한라산 정상', altitude: 1947, icon: '🇰🇷' },
  { label: '수목 한계선', altitude: 1500, icon: '🌲' },
  { label: '부르즈 할리파 (최고 빌딩)', altitude: 828, icon: '🏙️' },
  { label: '롯데월드타워 (서울)', altitude: 555, icon: '🏢' },
  { label: '시작점', altitude: 0, icon: '🏠' },
];

/**
 * 250,000m 사이클마다 반복되는 티어와 절대 고도 랜드마크를 결합하여
 * 전체 로드맵 배열을 생성합니다.
 */
export const ALTITUDE_MILESTONES: MilestoneItem[] = (() => {
  const list: MilestoneItem[] = [];
  const maxCycles = 1;

  // 1. 모든 사이클의 티어를 먼저 생성
  for (let s = 0; s < maxCycles; s++) {
    ALTITUDE_TIERS.forEach((t) => {
      const absAltitude = s * TIER_CYCLE_LIMIT + t.goal;
      const label = t.name;

      list.push({
        id: `tier-${s}-${t.goal}`,
        label: label,
        altitude: absAltitude,
        icon: t.icon,
        type: 'tier',
        stars: s,
        subLandmarks: [], // 여기에 하위 랜드마크를 담을 것
        isTier: true, // Explicit flag
      });
    });
  }

  // 1.1 시작점(0m) 명시적으로 추가
  list.push({
    id: 'starting-point',
    label: '시작점',
    altitude: 0,
    icon: '🏠',
    type: 'landmark', // 또는 'tier'와 유사하게 취급되도록 logic 수정 필요할 수 있음
    stars: 0,
    subLandmarks: [],
  });

  const sortedTiers = [...list].sort((a, b) => a.altitude - b.altitude);

  // 2. 랜드마크를 알맞은 티어에 배속 (고도의 무결성 보장)
  BASE_LANDMARKS.forEach((l) => {
    // 정수 고도로 취급하여 오차 방지
    const targetAlt = Math.round(l.altitude);

    // 해당 랜드마크를 포함할 수 있는 가장 낮은 티어 찾기 (부모 티어)
    // 예: 12k 랜드마크 -> 20k 티어에 배속
    const parentTier = sortedTiers.find((t) => Math.round(t.altitude) >= targetAlt);

    if (parentTier) {
      const tierAlt = Math.round(parentTier.altitude);
      if (tierAlt === targetAlt) {
        // 고도가 정확히 일치하면 덮어쓰기 지표로 설정
        // Cast l as MilestoneItem-ish object if needed, or strictly type BASE_LANDMARKS
        parentTier.overlapLandmark = { ...l, id: `landmark-${targetAlt}`, type: 'landmark' };
      } else {
        // 구간 내에 있으면 하위 리스트에 추가
        if (!parentTier.subLandmarks) parentTier.subLandmarks = [];
        parentTier.subLandmarks.push({ ...l, id: `landmark-${targetAlt}`, type: 'landmark' });
      }
    }
  });

  // 3. 하위 랜드마크 정렬 및 대표 서브 선정
  list.forEach((tier) => {
    if (tier.subLandmarks && tier.subLandmarks.length > 0) {
      // 티어 고도에서 역순으로 가장 가까운 것부터 (등반 시 먼저 만나는 순)
      tier.subLandmarks.sort((a, b) => b.altitude - a.altitude);
      tier.representativeLandmark = tier.subLandmarks[0];
    } else {
      tier.subLandmarks = [];
    }
  });

  return list.sort((a, b) => b.altitude - a.altitude);
})();

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
    reachedTierIndex === -1 ? ALTITUDE_TIERS[0] : reversedTiers.at(reachedTierIndex) ?? ALTITUDE_TIERS[0];

  // 다음 티어: 현재 점수보다 높은 첫 번째 목표
  let nextTierIndex = ALTITUDE_TIERS.findIndex((t) => currentCycleScore < t.goal);
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
  if (streakCount >= 7)
    return `${streakCount}일 연속 완등! 등반의 신이 강림하셨나요? 🔥`;
  if (streakCount >= 3)
    return `${streakCount}일 연속 등반 중! 꾸준함이 곧 실력입니다. ✨`;
  if (averageAccuracy >= 98)
    return '정교한 산악인이시네요! 단 하나의 실수도 용납하지 않는 군요. 🎯';
  if (maxCombo >= 100)
    return `무려 ${maxCombo}콤보! 폭발적인 집중력의 소유자입니다. ⚡`;
  if (totalAltitude >= 250000)
    return '전설의 영역에 도달하셨습니다. 이제부터는 성급을 올릴 시간입니다! ⭐';
  if (totalAltitude >= 20000)
    return '고산 지대에 진입하셨습니다. 이제부터가 진짜 등반입니다! 🏔️';
  if (totalAltitude >= 5000)
    return '산중턱을 넘어섰네요. 정상이 조금씩 보이기 시작합니다. 🌲';
  return '오늘도 한 걸음 더 높은 곳으로! 즐거운 등반 되세요. 🥾';
};
