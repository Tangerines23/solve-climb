// src/features/mypage/utils/historyStatsCalculator.ts
import { APP_CONFIG } from '@/config/app';
import { getTimeAgo } from '@/utils/date';
import { getUserTitle, getSmartComment, getTierInfo } from '@/constants/history';

export interface DbLevelRecord {
  world_id: string;
  category_id: string;
  subject_id: string;
  level: number;
  mode_code: number;
  best_score: number;
  updated_at: string;
}

export interface DbProfile {
  total_mastery_score: number;
  login_streak: number;
  last_login_at: string | null;
}

export type SessionRow = {
  category: string;
  subject: string;
  level: number;
  game_mode?: string;
  score?: number;
  created_at?: string;
};

export interface EnrichedRecord extends DbLevelRecord {
  themeId: string;
  themeName: string;
}

export interface LocalHistoryRecord {
  score: number;
  date: string;
  category: string;
  world: string;
  level: number;
  mode: string;
  correctCount?: number;
  total?: number;
}

export interface HistoryStats {
  weeklyTotal: number;
  weeklyTotalLastWeek: number;
  graphPercentage: number;
  wrongAnswers: number;
  dailyCounts: number[];
  weekDays: string[];
  monthlyTotal: number;
  monthlyTotalLastMonth: number;
  monthlyDailyCounts: number[];
  monthlyDays: string[];
  categoryLevels: Array<{
    themeId: string;
    categoryName: string;
    subCategoryName?: string;
    level: number;
    levelName: string;
    progress: number;
  }>;
  recentRecords: Array<{
    themeId: string;
    categoryName: string;
    subCategoryName?: string;
    level: number;
    modeCode: number;
    modeName: string;
    bestScore: number;
    count: number;
    timeAgo: string;
  }>;
  totalAltitude: number;
  userTitle: string;
  totalCorrect: number;
  averageAccuracy: number;
  maxCombo: number;
  nextTierGoal: number;
  nextTierName: string;
  streakCount: number;
  heatmapData: Array<{ date: string; count: number; intensity: number }>;
  smartComment: string;
  allActivities: Array<{
    type: 'game' | 'reward';
    id: string;
    title: string;
    description: string;
    value?: string;
    timeAgo: string;
    icon: string;
    timestamp: string;
  }>;
}

export function getHeatmapIntensity(count: number): number {
  if (count > 10) return 4;
  if (count > 5) return 3;
  if (count > 2) return 2;
  if (count > 0) return 1;
  return 0;
}

export function getThemeScoreMultiplier(themeId: string): number {
  if (themeId.includes('calculus')) return 3.0;
  if (themeId.includes('arithmetic') || themeId.includes('japanese')) return 1.0;
  return 1.5;
}

export function getLevelBadgeName(level: number): string {
  if (level >= 10) return 'Expert';
  if (level >= 5) return 'Intermediate';
  return 'Beginner';
}

export function buildHeatmapData(
  activityMap: Map<string, number>,
  todayStart: Date
): Array<{ date: string; count: number; intensity: number }> {
  const heatmapData = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(todayStart.getDate() - i);
    const dateStr = d.toDateString();
    const count = activityMap.get(dateStr) || 0;
    const intensity = getHeatmapIntensity(count);
    heatmapData.push({ date: dateStr, count, intensity });
  }
  return heatmapData;
}

export function calculateStreakFromActivityMap(
  activityMap: Map<string, number>,
  todayStart: Date
): number {
  let streakCount = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(todayStart);
    d.setDate(todayStart.getDate() - i);
    if (activityMap.has(d.toDateString())) {
      streakCount++;
      continue;
    }
    if (i === 0) continue;
    break;
  }
  return streakCount;
}

export function getEmptyStats(title: string): HistoryStats {
  return {
    weeklyTotal: 0,
    weeklyTotalLastWeek: 0,
    graphPercentage: 0,
    wrongAnswers: 0,
    dailyCounts: [],
    weekDays: [],
    monthlyTotal: 0,
    monthlyTotalLastMonth: 0,
    monthlyDailyCounts: [],
    monthlyDays: [],
    categoryLevels: [],
    recentRecords: [],
    totalAltitude: 0,
    userTitle: title,
    totalCorrect: 0,
    averageAccuracy: 0,
    maxCombo: 0,
    nextTierGoal: 1000,
    nextTierName: '베이스캠프',
    streakCount: 0,
    heatmapData: [],
    smartComment: '등반을 시작해보세요!',
    allActivities: [],
  };
}

export function calculateLocalStats(
  history: LocalHistoryRecord[],
  _userTitle: string
): HistoryStats {
  const records = history;
  const categoryMap = APP_CONFIG.CATEGORY_MAP as Record<string, string>;

  // 1. 기본 집계
  const totalAltitude = records.reduce((sum, r) => sum + (r.score || 0), 0);
  const totalCorrect = records.reduce((sum, r) => sum + (r.correctCount || 0), 0);

  // 정확도 계산
  let totalAccuracySum = 0;
  let accuracyCount = 0;
  records.forEach((r) => {
    if (r.total && r.total > 0) {
      totalAccuracySum += ((r.correctCount || 0) / r.total) * 100;
      accuracyCount++;
    }
  });
  const averageAccuracy = accuracyCount > 0 ? Math.round(totalAccuracySum / accuracyCount) : 0;

  // 2. 활동 로그 변환
  const allActivities: HistoryStats['allActivities'] = records.map((r, idx) => ({
    type: 'game',
    id: `local-game-${idx}-${r.date}`,
    title: `${Object.prototype.hasOwnProperty.call(categoryMap, r.category) ? categoryMap[r.category] : r.category} 등반`,
    description: `Level ${r.level} (${r.mode === 'survival' ? 'Survival' : 'Normal'})`,
    value: `+${r.score.toLocaleString()}m`,
    timeAgo: getTimeAgo(r.date),
    icon: '🧗',
    timestamp: r.date,
  }));

  // 3. Heatmap
  const activityMap = new Map<string, number>();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  records.forEach((r) => {
    const d = new Date(r.date).toDateString();
    activityMap.set(d, (activityMap.get(d) || 0) + 1);
  });

  const heatmapData = buildHeatmapData(activityMap, todayStart);

  // 4. Streak
  let streakCount = calculateStreakFromActivityMap(activityMap, todayStart);

  // 5. 숙련도 (Category Levels) - 최고 레벨 추출
  const bestLevels = new Map<string, { level: number; category: string }>();
  records.forEach((r) => {
    const key = r.category;
    const existing = bestLevels.get(key);
    if (!existing || r.level > existing.level) {
      bestLevels.set(key, { level: r.level, category: r.category });
    }
  });

  const categoryLevels = Array.from(bestLevels.values())
    .map((r) => ({
      themeCode: 0,
      themeId: r.category,
      categoryName: Object.prototype.hasOwnProperty.call(categoryMap, r.category)
        ? categoryMap[r.category]
        : r.category,
      subCategoryName: '',
      level: r.level,
      levelName: getLevelBadgeName(r.level),
      progress: Math.min(Math.round((r.level / 15) * 100), 100),
    }))
    .sort((a, b) => b.level - a.level);

  const currentTier = getTierInfo(totalAltitude);

  return {
    weeklyTotal: records.filter((r) => {
      const d = new Date(r.date);
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }).length,
    weeklyTotalLastWeek: 0,
    graphPercentage: 0,
    wrongAnswers: 0,
    dailyCounts: [0, 0, 0, 0, 0, 0, 0],
    weekDays: ['월', '화', '수', '목', '금', '토', '일'],
    monthlyTotal: 0,
    monthlyTotalLastMonth: 0,
    monthlyDailyCounts: [],
    monthlyDays: [],
    categoryLevels,
    recentRecords: [],
    totalAltitude,
    userTitle: getUserTitle(totalAltitude),
    totalCorrect,
    averageAccuracy,
    maxCombo: 0,
    nextTierGoal: currentTier.nextGoal,
    nextTierName: currentTier.nextTierName,
    streakCount,
    heatmapData,
    smartComment: getSmartComment({ streakCount, averageAccuracy, maxCombo: 0, totalAltitude }),
    allActivities,
  };
}

export function calculateAuthenticatedStats(params: {
  recordsData: DbLevelRecord[] | null;
  sessionsData: SessionRow[] | null;
  profileData: DbProfile | null;
}): HistoryStats {
  const { recordsData, sessionsData, profileData } = params;

  const records: EnrichedRecord[] = (recordsData || []).map((r: DbLevelRecord) => ({
    ...r,
    themeId: `${r.category_id}_${r.subject_id}`,
    themeName:
      APP_CONFIG.CATEGORY_MAP[r.subject_id as keyof typeof APP_CONFIG.CATEGORY_MAP] || r.subject_id,
  }));

  // 세션 데이터를 기록 포맷으로 정규화 (활동 추적용)
  const sessionsAsRecords = (sessionsData || []).map((s: SessionRow) => {
    const themeId = `${s.category}_${s.subject}`;
    return {
      world_id: s.subject,
      category_id: s.category,
      subject_id: s.subject,
      themeId,
      level: s.level,
      mode_code: s.game_mode === 'timeattack' ? 1 : 2,
      best_score: s.score || 0,
      updated_at: s.created_at || new Date().toISOString(),
      isFromSession: true,
    };
  });

  // 전체 활동 로그 (신기록 + 일반 플레이)
  const allActivities = [...sessionsAsRecords, ...records]
    .filter((r) => r.updated_at)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // 누적 고도 (기록 합산과 프로필 점수 중 큰 값 사용)
  const altitudeFromRecords = records.reduce((sum, r) => sum + (r.best_score || 0), 0);
  const totalAltitude = Math.max(altitudeFromRecords, profileData?.total_mastery_score || 0);
  const userLevelCount = records.filter((r) => (r.best_score || 0) > 0).length;

  // 정밀 통계 계산 (정확도 & 정답 수 추정)
  let totalEstimatedCorrect = 0;
  let totalAccuracySum = 0;
  let accuracyRecordCount = 0;

  records.forEach((r) => {
    if (r.best_score <= 0) return;

    // 레벨별 기본 점수 계산 (constants/game.ts 로직 재현)
    const baseLevelScore = 10 + (r.level - 1) * 5;
    const multiplier = getThemeScoreMultiplier(r.themeId);

    // 예상 정답 수 = 점수 / (기본점수 * 배율)
    const estimatedCorrect = r.best_score / (baseLevelScore * multiplier);
    const cappedCorrect = Math.min(Math.max(estimatedCorrect, 0), 10);

    totalEstimatedCorrect += cappedCorrect;
    totalAccuracySum += (cappedCorrect / 10) * 100;
    accuracyRecordCount++;
  });

  const averageAccuracy =
    accuracyRecordCount > 0 ? Math.round(totalAccuracySum / accuracyRecordCount) : 0;
  const totalCorrect = Math.round(totalEstimatedCorrect);

  // 최근 플레이 기록 (전체 활동 로그에서 추출)
  const recentRecords = allActivities
    .slice(0, 15)
    .map((r) => {
      const modeName = r.mode_code === 1 ? '타임어택' : '서바이벌';
      const [cat, sub] = r.themeId.split('_');
      const categoryName =
        APP_CONFIG.CATEGORY_MAP[cat as keyof typeof APP_CONFIG.CATEGORY_MAP] || cat;

      return {
        themeId: r.themeId,
        categoryName,
        subCategoryName: sub,
        level: r.level,
        modeCode: r.mode_code,
        modeName,
        bestScore: r.best_score,
        count: 1,
        timeAgo: getTimeAgo(r.updated_at || ''),
      };
    })
    .slice(0, 10);

  // --- 일관된 활동 로그 생성 ---
  const formattedActivities: HistoryStats['allActivities'] = allActivities
    .filter((r) => r.updated_at)
    .map((r) => {
      const [cat, sub] = r.themeId.split('_');
      const categoryName =
        APP_CONFIG.CATEGORY_MAP[cat as keyof typeof APP_CONFIG.CATEGORY_MAP] || cat;
      return {
        type: 'game' as const,
        id: `game-${r.updated_at}`,
        title: `${categoryName} 등반`,
        description: `${sub} - Lv.${r.level}`,
        value: `+${r.best_score}m`,
        timeAgo: getTimeAgo(r.updated_at!),
        icon: '🧗',
        timestamp: r.updated_at!,
      };
    });

  // 오늘 출석 보상이 있었다면 로그 추가
  if (profileData?.last_login_at) {
    const lastLoginDate = new Date(profileData.last_login_at).toDateString();
    const todayStr = new Date().toDateString();
    if (lastLoginDate === todayStr) {
      formattedActivities.unshift({
        type: 'reward',
        id: `reward-${profileData.last_login_at}`,
        title: '데일리 접속 보상',
        description: `${profileData.login_streak}일 연속 등반 중!`,
        value: '수령 완료',
        timeAgo: '오늘',
        icon: '🎁',
        timestamp: profileData.last_login_at,
      });
    }
  }

  // 활동 잔디 & 스트릭 (allActivities 기준)
  const activityMap = new Map<string, number>();
  allActivities.forEach((r) => {
    if (r.updated_at) {
      const d = new Date(r.updated_at).toDateString();
      activityMap.set(d, (activityMap.get(d) || 0) + 1);
    }
  });

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const heatmapData = buildHeatmapData(activityMap, todayStart);

  // 스트릭 (DB에서 가져온 값을 우선 사용, 없으면 계산된 값 사용)
  let streakCount = profileData?.login_streak || 0;
  if (streakCount === 0) {
    streakCount = calculateStreakFromActivityMap(activityMap, todayStart);
  }

  // 티어 정보 (동적 사이클 계산)
  const currentTier = getTierInfo(totalAltitude);

  // 분야별 숙련도 (Map 사용으로 object-injection 경고 회피)
  const recordMap = records.reduce((map, r) => {
    const key = `${r.themeId}-${r.level}`;
    const existing = map.get(key);
    if (!existing || r.best_score > existing.best_score) map.set(key, r);
    return map;
  }, new Map<string, EnrichedRecord>());
  const categoryLevels = Array.from(recordMap.values())
    .map((r) => {
      const [cat, sub] = r.themeId.split('_');
      const categoryName =
        APP_CONFIG.CATEGORY_MAP[cat as keyof typeof APP_CONFIG.CATEGORY_MAP] || cat;
      return {
        themeId: r.themeId,
        categoryName,
        subCategoryName: sub,
        level: r.level,
        levelName: getLevelBadgeName(r.level),
        progress: Math.min(Math.round((r.level / 15) * 100), 100),
      };
    })
    .sort((a, b) => b.level - a.level);

  return {
    weeklyTotal: userLevelCount,
    weeklyTotalLastWeek: 0,
    graphPercentage: 0,
    wrongAnswers: 0,
    dailyCounts: [0, 0, 0, 0, 0, 0, 0],
    weekDays: ['월', '화', '수', '목', '금', '토', '일'],
    monthlyTotal: 0,
    monthlyTotalLastMonth: 0,
    monthlyDailyCounts: [],
    monthlyDays: [],
    categoryLevels: categoryLevels,
    recentRecords: recentRecords,
    totalAltitude,
    userTitle: getUserTitle(totalAltitude),
    totalCorrect,
    averageAccuracy,
    maxCombo: 0,
    nextTierGoal: currentTier.nextGoal,
    nextTierName: currentTier.nextTierName,
    streakCount,
    heatmapData,
    smartComment: getSmartComment({ streakCount, averageAccuracy, maxCombo: 0, totalAltitude }),
    allActivities: formattedActivities,
  };
}
