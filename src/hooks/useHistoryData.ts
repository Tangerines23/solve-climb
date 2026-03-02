// src/hooks/useHistoryData.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { safeSupabaseQuery } from '../utils/debugFetch';
import { APP_CONFIG } from '../config/app';
import { parseLocalSession } from '../utils/safeJsonParse';
import { storage, StorageKeys } from '../utils/storage';
import { Session } from '@supabase/supabase-js';
import { getTimeAgo } from '../utils/date';
import {
  getUserTitle,
  getSmartComment,
  getTierInfo,
  ANONYMOUS_USER_TITLE,
} from '../constants/history';

interface DbLevelRecord {
  world_id: string;
  category_id: string;
  subject_id: string;
  level: number;
  mode_code: number;
  best_score: number;
  updated_at: string;
}

interface DbProfile {
  total_mastery_score: number;
  login_streak: number;
  last_login_at: string | null;
}

type EnrichedRecord = DbLevelRecord & {
  themeId: string;
  themeName: string;
};

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

export function useHistoryData() {
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // --- 0. 세션 및 유저 ID 확인 (My Page와 로직 통합) ---
      let currentSession: Session | null = null;
      let userId = null;

      try {
        const localSessionStr = storage.getString(StorageKeys.LOCAL_SESSION);
        const localSession = parseLocalSession(localSessionStr);
        if (localSession) {
          userId = localSession.userId;
          currentSession = {
            user: {
              id: localSession.userId,
              email: null,
              user_metadata: {
                isAdmin: localSession.isAdmin || false,
              },
            },
            access_token: 'local',
            refresh_token: 'local',
            expires_in: 3600,
            token_type: 'bearer',
          } as unknown as Session;
        }
      } catch (e) {
        console.warn('Failed to read local session in useHistoryData:', e);
      }

      if (!currentSession) {
        const {
          data: { session: supabaseSession },
        } = await safeSupabaseQuery(supabase.auth.getSession());
        currentSession = supabaseSession;
      }

      if (!currentSession) {
        // [Anonymous/Local User Support]
        // DB 세션이 없어도 로컬 기록이 있으면 통계를 보여줌
        try {
          const localHistoryStr = localStorage.getItem(StorageKeys.LOCAL_HISTORY);
          if (localHistoryStr) {
            const localHistory = JSON.parse(localHistoryStr);
            if (Array.isArray(localHistory) && localHistory.length > 0) {
              // 로컬 데이터를 기반으로 통계 계산
              const stats = calculateLocalStats(localHistory, ANONYMOUS_USER_TITLE);
              setStats(stats);
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to load local history:', e);
        }

        setStats(getEmptyStats(ANONYMOUS_USER_TITLE));
        setLoading(false);
        return;
      }

      const currentUserId = userId || currentSession.user.id;
      // 로컬 플레이어 필터링 제거 (DB에 데이터가 있다면 보여줌)

      // --- 1. 날짜 기준 설정 ---
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - diff);
      weekStart.setHours(0, 0, 0, 0);

      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(weekStart.getDate() - 7);

      // --- 2. 데이터 페칭 ---
      const [recordsRes, sessionsRes, profileRes] = await Promise.all([
        safeSupabaseQuery(
          supabase
            .from('user_level_records')
            .select('world_id, category_id, subject_id, level, mode_code, best_score, updated_at')
            .eq('user_id', currentUserId)
            .order('updated_at', { ascending: false })
        ),
        safeSupabaseQuery(
          supabase
            .from('game_sessions')
            .select('category, subject, level, game_mode, score, created_at')
            .eq('user_id', currentUserId)
            .eq('status', 'completed')
            .order('created_at', { ascending: false })
            .limit(50)
        ),
        safeSupabaseQuery(
          supabase
            .from('profiles')
            .select('total_mastery_score, login_streak')
            .eq('id', currentUserId)
            .maybeSingle()
        ),
      ] as const);

      const recordsData = recordsRes.data;
      const sessionsData = sessionsRes.data;
      const profileData = profileRes.data as unknown as DbProfile | null;

      if (recordsRes.error) throw recordsRes.error;
      if (sessionsRes.error) throw sessionsRes.error;

      const records: EnrichedRecord[] = (recordsData || []).map((r: DbLevelRecord) => ({
        ...r,
        themeId: `${r.category_id}_${r.subject_id}`,
        themeName:
          APP_CONFIG.CATEGORY_MAP[r.subject_id as keyof typeof APP_CONFIG.CATEGORY_MAP] ||
          r.subject_id,
      }));

      // 세션 데이터를 기록 포맷으로 정규화 (활동 추적용)
      type SessionRow = {
        category: string;
        subject: string;
        level: number;
        game_mode?: string;
        score?: number;
        created_at?: string;
      };
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
        .filter((r) => r.updated_at) // updated_at이 있는 것만 필터링
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      // --- 3. 통계 집계 ---

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
        // v_base_level_score = 10 + (p_level - 1) * 5;
        const baseLevelScore = 10 + (r.level - 1) * 5;
        let multiplier = 1.5;
        if (r.themeId.includes('calculus')) multiplier = 3.0;
        else if (r.themeId.includes('arithmetic') || r.themeId.includes('japanese'))
          multiplier = 1.0;

        // 예상 정답 수 = 점수 / (기본점수 * 배율)
        // 10문제 풀이 기준이므로 accuracy = (estimated_correct / 10) * 100
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
        .slice(0, 15) // 더 넉넉하게 추출 후 정제
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
            count: 1, // 개별 세션 단위이므로 1
            timeAgo: getTimeAgo(r.updated_at || ''),
          };
        })
        .slice(0, 10);

      // --- 일관된 활동 로그 생성 ---
      const formattedActivities: HistoryStats['allActivities'] = allActivities
        .filter((r) => r.updated_at) // updated_at이 있는 것만 필터링
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

      const heatmapData = [];
      for (let i = 27; i >= 0; i--) {
        const d = new Date(todayStart);
        d.setDate(todayStart.getDate() - i);
        const dateStr = d.toDateString();
        const count = activityMap.get(dateStr) || 0;
        let intensity = 0;
        if (count > 10) intensity = 4;
        else if (count > 5) intensity = 3;
        else if (count > 2) intensity = 2;
        else if (count > 0) intensity = 1;
        heatmapData.push({ date: dateStr, count, intensity });
      }

      // 스트릭 (DB에서 가져온 값을 우선 사용, 없으면 계산된 값 사용)
      let streakCount = profileData?.login_streak || 0;
      if (streakCount === 0) {
        for (let i = 0; i < 30; i++) {
          const d = new Date(todayStart);
          d.setDate(todayStart.getDate() - i);
          if (activityMap.has(d.toDateString())) {
            streakCount++;
          } else {
            if (i === 0) continue;
            break;
          }
        }
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
            levelName: r.level >= 10 ? 'Expert' : r.level >= 5 ? 'Intermediate' : 'Beginner',
            progress: Math.min(Math.round((r.level / 15) * 100), 100),
          };
        })
        .sort((a, b) => b.level - a.level);

      const finalStats: HistoryStats = {
        weeklyTotal: userLevelCount, // 임시
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
        maxCombo: 0, // 추후 세션 데이터 연동 필요
        nextTierGoal: currentTier.nextGoal,
        nextTierName: currentTier.nextTierName,
        streakCount,
        heatmapData,
        smartComment: getSmartComment({ streakCount, averageAccuracy, maxCombo: 0, totalAltitude }),
        allActivities: formattedActivities,
      };

      setStats(finalStats);
    } catch (err: unknown) {
      console.error('History data error:', err);
      setError((err as Error).message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoryData();
  }, [fetchHistoryData]);

  return { stats, loading, error, refetch: fetchHistoryData };
}

function getEmptyStats(title: string): HistoryStats {
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

type LocalHistoryRecord = {
  score: number;
  date: string;
  category: string;
  world: string;
  level: number;
  mode: string;
  correctCount?: number;
  total?: number;
};

// 로컬 기록을 기반으로 HistoryStats 생성 (DB 로직 모방)
function calculateLocalStats(history: LocalHistoryRecord[], _userTitle: string): HistoryStats {
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

  const heatmapData = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(todayStart);
    d.setDate(todayStart.getDate() - i);
    const dateStr = d.toDateString();
    const count = activityMap.get(dateStr) || 0;
    let intensity = 0;
    if (count > 10) intensity = 4;
    else if (count > 5) intensity = 3;
    else if (count > 2) intensity = 2;
    else if (count > 0) intensity = 1;
    heatmapData.push({ date: dateStr, count, intensity });
  }

  // 4. Streak
  let streakCount = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(todayStart);
    d.setDate(todayStart.getDate() - i);
    if (activityMap.has(d.toDateString())) {
      streakCount++;
    } else {
      if (i === 0) continue; // 오늘은 아직 안 했을 수 있음
      break;
    }
  }

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
      levelName: r.level >= 10 ? 'Expert' : r.level >= 5 ? 'Intermediate' : 'Beginner',
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
    dailyCounts: [0, 0, 0, 0, 0, 0, 0], // 그래프용 상세 데이터는 생략 (복잡도 감소)
    weekDays: ['월', '화', '수', '목', '금', '토', '일'],
    monthlyTotal: 0,
    monthlyTotalLastMonth: 0,
    monthlyDailyCounts: [],
    monthlyDays: [],
    categoryLevels,
    recentRecords: [], // 상세 기록은 로그로 대체
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
