/**
 * 오늘의 챌린지 생성 유틸리티
 * 서버에서 먼저 가져오고, 실패 시 로컬에서 생성합니다.
 */

import { APP_CONFIG } from '../config/app';
import { storage } from './storage';
import { challengeApi } from './api';

const STORAGE_KEY_DATE = 'solve-climb-today-challenge-date';
const STORAGE_KEY_CHALLENGE = 'solve-climb-today-challenge';

export interface TodayChallenge {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  topic: string;
  topicId: string;
  mode: string;
  level: number;
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
  // YYYY-MM-DD 형식을 숫자로 변환 (예: 2024-01-15 -> 20240115)
  const numeric = parseInt(dateString.replace(/-/g, ''), 10);
  return numeric;
}

/**
 * 시드 기반 랜덤 숫자 생성기 (선형 합동 생성기)
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * 0 이상 1 미만의 랜덤 숫자 생성
   */
  random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * min 이상 max 미만의 정수 생성
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }
}

/**
 * 오늘의 챌린지를 생성합니다
 */
function generateTodayChallenge(): TodayChallenge {
  const todayDate = getTodayDateString();
  const seed = dateToSeed(todayDate);
  const rng = new SeededRandom(seed);

  // 1. 카테고리(산) 랜덤 선택
  // 수학의 산과 언어의 산만 사용 (논리, 상식 제외)
  const availableCategories = APP_CONFIG.CATEGORIES.filter(
    (cat) => cat.id === 'math' || cat.id === 'language'
  );
  const categories = [...availableCategories].sort((a, b) => a.id.localeCompare(b.id));
  const categoryIndex = rng.randomInt(0, categories.length);
  const selectedCategory = categories[categoryIndex];

  // 2. 서브토픽(등반로) 랜덤 선택
  let subTopics = APP_CONFIG.SUB_TOPICS[selectedCategory.id as keyof typeof APP_CONFIG.SUB_TOPICS];

  // 수학의 산에서 수열 제거
  if (selectedCategory.id === 'math' && subTopics) {
    subTopics = subTopics.filter((topic) => topic.id !== 'sequence') as unknown as typeof subTopics;
  }

  if (!subTopics || !Array.isArray(subTopics) || (subTopics as unknown[]).length === 0) {
    // 서브토픽이 없으면 기본값 사용
    return {
      id: `today_challenge_${todayDate}`,
      title: '기본 챌린지',
      category:
        APP_CONFIG.CATEGORY_MAP[selectedCategory.id as keyof typeof APP_CONFIG.CATEGORY_MAP] ||
        selectedCategory.name,
      categoryId: selectedCategory.id,
      topic: '기본',
      topicId: 'default',
      mode: 'time_attack',
      level: 1,
    };
  }

  // 서브토픽도 ID로 정렬하여 항상 같은 순서 보장
  const sortedSubTopics = [...subTopics].sort((a, b) => a.id.localeCompare(b.id));
  const topicIndex = rng.randomInt(0, sortedSubTopics.length);
  const selectedTopic = sortedSubTopics[topicIndex];

  // 3. 레벨 랜덤 선택
  const categoryLevels = APP_CONFIG.LEVELS[selectedCategory.id as keyof typeof APP_CONFIG.LEVELS];
  const levels = categoryLevels?.[selectedTopic.id as keyof typeof categoryLevels] as
    | Array<{ level: number; name: string; description: string }>
    | undefined;
  if (!levels || !Array.isArray(levels) || levels.length === 0) {
    // 레벨이 없으면 기본값 사용
    return {
      id: `today_challenge_${todayDate}`,
      title: `${selectedTopic.name} 도전!`,
      category:
        APP_CONFIG.CATEGORY_MAP[selectedCategory.id as keyof typeof APP_CONFIG.CATEGORY_MAP] ||
        selectedCategory.name,
      categoryId: selectedCategory.id,
      topic: selectedTopic.name,
      topicId: selectedTopic.id,
      mode: 'time_attack',
      level: 1,
    };
  }

  // 레벨도 level 값으로 정렬하여 항상 같은 순서 보장
  const sortedLevels = [...levels].sort((a, b) => a.level - b.level);
  const levelIndex = rng.randomInt(0, sortedLevels.length);
  const selectedLevel = sortedLevels[levelIndex];

  // 챌린지 제목 생성
  const title = `${selectedTopic.name} ${selectedLevel.name}!`;

  return {
    id: `today_challenge_${todayDate}`,
    title,
    category:
      APP_CONFIG.CATEGORY_MAP[selectedCategory.id as keyof typeof APP_CONFIG.CATEGORY_MAP] ||
      selectedCategory.name,
    categoryId: selectedCategory.id,
    topic: selectedTopic.name,
    topicId: selectedTopic.id,
    mode: 'time_attack',
    level: selectedLevel.level,
  };
}

/**
 * 오늘의 챌린지를 가져옵니다
 * 1. 서버에서 먼저 시도
 * 2. 실패 시 로컬 캐시 확인
 * 3. 모두 실패 시 로컬 생성 (폴백)
 */
export async function getTodayChallenge(): Promise<TodayChallenge> {
  const todayDate = getTodayDateString();
  const storedDate = storage.getString(STORAGE_KEY_DATE, null);
  const storedChallenge = storage.get<TodayChallenge | null>(STORAGE_KEY_CHALLENGE, null);

  // 같은 날짜면 캐시된 값 먼저 확인 (빠른 응답)
  if (storedDate === todayDate && storedChallenge) {
    // 백그라운드에서 서버 확인 (다음 요청을 위해)
    challengeApi
      .getTodayChallenge(todayDate)
      .then((serverChallenge) => {
        if (serverChallenge) {
          const challenge: TodayChallenge = {
            id: serverChallenge.id,
            title: serverChallenge.title,
            category: serverChallenge.category_name,
            categoryId: serverChallenge.category_id,
            topic: serverChallenge.topic_name,
            topicId: serverChallenge.topic_id,
            mode: serverChallenge.mode,
            level: serverChallenge.level,
          };
          storage.setString(STORAGE_KEY_DATE, todayDate);
          storage.set(STORAGE_KEY_CHALLENGE, challenge);
        }
      })
      .catch(() => {
        // 서버 확인 실패는 무시 (캐시된 값 사용)
      });

    return storedChallenge;
  }

  // 서버에서 가져오기 시도
  try {
    const serverChallenge = await challengeApi.getTodayChallenge(todayDate);

    if (serverChallenge) {
      // 서버에서 가져온 챌린지 사용
      const challenge: TodayChallenge = {
        id: serverChallenge.id,
        title: serverChallenge.title,
        category: serverChallenge.category_name,
        categoryId: serverChallenge.category_id,
        topic: serverChallenge.topic_name,
        topicId: serverChallenge.topic_id,
        mode: serverChallenge.mode,
        level: serverChallenge.level,
      };

      // 캐시 저장
      storage.setString(STORAGE_KEY_DATE, todayDate);
      storage.set(STORAGE_KEY_CHALLENGE, challenge);

      return challenge;
    }
  } catch (error) {
    console.warn('Failed to fetch today challenge from server, using local fallback:', error);
  }

  // 서버에 없거나 실패 시 로컬 생성 (폴백)
  const newChallenge = generateTodayChallenge();

  // 저장
  storage.setString(STORAGE_KEY_DATE, todayDate);
  storage.set(STORAGE_KEY_CHALLENGE, newChallenge);

  return newChallenge;
}
