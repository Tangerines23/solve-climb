import { APP_CONFIG } from '@/config/app';
import { storageService, STORAGE_KEYS } from '@/services';
import { useFeatureFlagStore } from '@/stores/useFeatureFlagStore';

export interface TodayChallenge {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  topic: string;
  topicId: string;
  mode: string;
  level: number;
  worldId: string;
}

/**
 * 날짜 문자열을 반환합니다 (YYYY-MM-DD 형식)
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 날짜 문자열을 시드 숫자로 변환합니다
 */
function dateToSeed(dateString: string): number {
  if (!dateString || typeof dateString !== 'string') return 20260101;
  const numeric = parseInt(dateString.replace(/-/g, ''), 10);
  return Number.isFinite(numeric) ? numeric : 20260101;
}

/**
 * 시드 기반 랜덤 숫자 생성기
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = Number.isFinite(seed) ? Math.floor(seed) : 12345;
  }

  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  randomInt(min: number, max: number): number {
    const safeMin = Number.isFinite(min) ? Math.floor(min) : 0;
    const safeMax = Number.isFinite(max) ? Math.floor(max) : 0;
    if (safeMin === safeMax) return safeMin;
    const [lower, upper] = safeMin <= safeMax ? [safeMin, safeMax] : [safeMax, safeMin];
    return Math.floor(this.random() * (upper - lower)) + lower;
  }
}

/**
 * 오늘의 챌린지를 생성합니다 (Categorized League System)
 */
export type ProgressData = { cleared: boolean; level: number };
export type ProgressMap = Record<string, Record<string, Record<string, ProgressData>>>;

/**
 * 오늘의 챌린지를 생성합니다 (Categorized League System)
 */
export function generateTodayChallenge(progressMap?: ProgressMap | null): TodayChallenge {
  const todayDate = getTodayDateString();
  const seed = dateToSeed(todayDate);
  const rng = new SeededRandom(seed);

  const { flags } = useFeatureFlagStore.getState();

  // 1. 산 선택 (활성화된 것 중)
  const availableMountains = (APP_CONFIG.MOUNTAINS || []).filter((mtn) => {
    const mountainId = mtn.id as 'math' | 'language' | 'logic' | 'general';
    if (mountainId === 'math') return flags.ENABLE_MATH_MOUNTAIN;
    if (mountainId === 'language') return flags.ENABLE_LANGUAGE_MOUNTAIN;
    return false;
  });
  const mountains = [...availableMountains].sort((a, b) => a.id.localeCompare(b.id));
  const fallbackMountain = APP_CONFIG.MOUNTAINS?.[0] || { id: 'math', name: '수학' };
  const selectedMountain =
    mountains.length > 0 ? mountains[rng.randomInt(0, mountains.length)] : fallbackMountain;

  // 2. 월드 선택 (해당 산의 월드 중)
  const availableWorlds = (APP_CONFIG.WORLDS || []).filter(
    (w) => w.mountainId === selectedMountain.id
  );
  const fallbackWorld = APP_CONFIG.WORLDS?.[0] || {
    id: 'World1',
    mountainId: 'math',
    name: '월드 1',
  };
  const selectedWorld =
    availableWorlds.length > 0
      ? availableWorlds[rng.randomInt(0, availableWorlds.length)]
      : fallbackWorld;

  // 3. 카테고리/분야 선택
  const subTopics = APP_CONFIG.SUB_TOPICS?.[selectedMountain.id as 'math' | 'language'] || [];
  const filteredSubTopics =
    selectedMountain.id === 'math'
      ? subTopics.filter((t) => (t.id as string) !== 'sequence')
      : subTopics;

  const fallbackTopic = { id: 'default', name: '기본 챌린지' };
  const selectedTopic =
    filteredSubTopics && filteredSubTopics.length > 0
      ? filteredSubTopics[rng.randomInt(0, filteredSubTopics.length)]
      : fallbackTopic;

  // 4. 로컬 실력 확인 (해당 월드/분야의 Max Level)
  let maxLevel = 0;
  if (progressMap && typeof progressMap === 'object') {
    const worldProgress = progressMap[selectedWorld.id];
    if (worldProgress && typeof worldProgress === 'object' && worldProgress[selectedTopic.id]) {
      const topicLevels = Object.values(worldProgress[selectedTopic.id]) as unknown as Array<{
        cleared?: boolean;
        level?: number;
      }>;
      topicLevels.forEach((l) => {
        if (l && l.cleared && typeof l.level === 'number' && l.level > maxLevel) {
          maxLevel = l.level;
        }
      });
    }
  }

  // 5. 리그 결정 (10레벨 단위)
  // League 1: 0-10, League 2: 11-20, League 3: 21-30 ...
  const league = Math.floor(maxLevel / 10); // 0, 1, 2...
  const leagueStart = league * 10 + 1;
  const leagueEnd = (league + 1) * 10 + 2; // +2 Preview

  // 6. 후보 레벨 필터링
  const levelsConfig = (APP_CONFIG.LEVELS || {}) as unknown as Record<
    string,
    Record<string, { level: number; name: string }[]>
  >;
  const allLevels = levelsConfig[selectedWorld.id]?.[selectedTopic.id] || [];

  // 리그 범위 내의 레벨들
  let candidateLevels = allLevels.filter((l) => l.level >= leagueStart && l.level <= leagueEnd);

  // 만약 해당 리그 범위에 레벨이 없다면 (예: 월드2 기초는 10레벨까지만 있을 때)
  if (candidateLevels.length === 0) {
    // 가장 가까운 아래 범위 레벨들로 선택
    candidateLevels = allLevels.filter((l) => l.level <= leagueEnd);
  }

  // 그래도 없으면 전체에서 선택
  if (candidateLevels.length === 0) candidateLevels = allLevels;

  const finalLevel =
    candidateLevels.length > 0
      ? candidateLevels[rng.randomInt(0, candidateLevels.length)]
      : { level: 1, name: '입문' };

  return {
    id: `today_challenge_${todayDate}`,
    title: `${selectedTopic.name} ${finalLevel.name}!`,
    category: selectedMountain.name,
    categoryId: selectedMountain.id,
    topic: selectedTopic.name,
    topicId: selectedTopic.id,
    mode: 'time-attack',
    level: finalLevel.level,
    worldId: selectedWorld.id,
  };
}

/**
 * 오늘의 챌린지를 가져옵니다
 */
export async function getTodayChallenge(progressMap?: ProgressMap | null): Promise<TodayChallenge> {
  const safeProgressMap = progressMap && typeof progressMap === 'object' ? progressMap : {};
  const todayDate = getTodayDateString();
  const storedDate = storageService.get<string>(STORAGE_KEYS.TODAY_CHALLENGE_DATE);
  const storedChallenge = storageService.get<TodayChallenge>(STORAGE_KEYS.TODAY_CHALLENGE);

  if (storedDate === todayDate && storedChallenge && typeof storedChallenge === 'object') {
    return storedChallenge;
  }

  const newChallenge = generateTodayChallenge(safeProgressMap);
  storageService.set(STORAGE_KEYS.TODAY_CHALLENGE_DATE, todayDate);
  storageService.set(STORAGE_KEYS.TODAY_CHALLENGE, newChallenge);

  return newChallenge;
}
