import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { supabase } from '../utils/supabaseClient';
import { parseLocalSession } from '../utils/safeJsonParse';
import { storage, StorageKeys } from '../utils/storage';
import { APP_CONFIG } from '../config/app';
import type { Session } from '@supabase/supabase-js';
import './HistoryPage.css';

interface HistoryStats {
  weeklyTotal: number;
  weeklyTotalLastWeek: number;
  graphPercentage: number;
  wrongAnswers: number; // best_score = 0인 경우로 판단
  dailyCounts: number[]; // 최근 7일간 일별 문제 풀이 수 (0: 6일전, 6: 오늘)
  weekDays: string[]; // 최근 7일간 요일 라벨 (예: '월', '화')
  monthlyTotal: number;
  monthlyTotalLastMonth: number;
  monthlyDailyCounts: number[]; // 이번 달 일별 데이터
  monthlyDays: string[]; // 이번 달 날짜 라벨 (1일, 2일, ...)
  categoryLevels: Array<{
    themeCode: number;
    themeId: string;
    categoryName: string;
    subCategoryName?: string;
    level: number;
    levelName: string;
    progress: number; // 0-100
  }>;
  recentRecords: Array<{
    themeCode: number;
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
  // 신규 추가 필드
  totalAltitude: number;
  userTitle: string;
  totalCorrect: number;
  averageAccuracy: number;
  maxCombo: number;
}

const getUserTitle = (altitude: number): string => {
  if (altitude >= 10000) return '하늘 위의 신선';
  if (altitude >= 5000) return '구름을 뚫는 수학자';
  if (altitude >= 3000) return '절벽의 베테랑';
  if (altitude >= 1000) return '산중턱 탐험가';
  if (altitude >= 500) return '동네 뒷산 대장';
  return '초보 등반가';
};

export function HistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const fetchHistoryData = async () => {
      try {
        setLoading(true);

        // 세션 확인
        let currentSession = null;
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
            setSession(currentSession);
          }
        } catch (e) {
          console.warn('Failed to read local session:', e);
        }

        if (!currentSession) {
          const {
            data: { session: supabaseSession },
          } = await supabase.auth.getSession();
          currentSession = supabaseSession;
          setSession(supabaseSession);
        }

        if (!currentSession) {
          // 로그인하지 않은 경우 기본값
          setStats({
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
            userTitle: 'GUEST',
            totalCorrect: 0,
            averageAccuracy: 0,
            maxCombo: 0,
          });
          setLoading(false);
          return;
        }

        const user = currentSession.user;
        const user_id = userId || user.id;

        // 로컬 세션인 경우 기본값 반환
        const isLocalSession = user_id.startsWith('user_') || user_id.startsWith('game_');
        if (isLocalSession) {
          setStats({
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
            userTitle: '로컬 플레이어',
            totalCorrect: 0,
            averageAccuracy: 0,
            maxCombo: 0,
          });
          setLoading(false);
          return;
        }

        // 이번 주 시작일 계산 (월요일 기준)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 일요일이면 6일 전, 아니면 dayOfWeek - 1
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);

        // 이전 주 시작일 계산
        const lastWeekStart = new Date(weekStart);
        lastWeekStart.setDate(weekStart.getDate() - 7);
        const lastWeekEnd = new Date(weekStart);
        lastWeekEnd.setDate(weekStart.getDate() - 1);
        lastWeekEnd.setHours(23, 59, 59, 999);

        // theme_mapping 조회
        const { data: themeMapping, error: themeError } = await supabase
          .from('theme_mapping')
          .select('code, theme_id, name');

        if (themeError) {
          console.warn('[HistoryPage] theme_mapping 조회 실패:', themeError);
        }

        // theme_code -> theme_id, name 매핑 생성
        const themeCodeToId: Record<number, string> = {};
        const themeCodeToName: Record<number, string> = {};
        themeMapping?.forEach((tm) => {
          themeCodeToId[tm.code] = tm.theme_id;
          themeCodeToName[tm.code] = tm.name;
        });

        // user_level_records 조회
        const { data: levelRecords, error } = await supabase
          .from('user_level_records')
          .select('theme_code, level, mode_code, best_score, updated_at')
          .eq('user_id', user_id)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // theme_mapping 정보 매핑
        const recordsWithTheme = (levelRecords || []).map((record) => {
          const themeId = themeCodeToId[record.theme_code] || '';
          const themeName = themeCodeToName[record.theme_code] || '';
          return {
            ...record,
            themeId,
            themeName,
          };
        });

        // 이번 주 총 문제 수 계산 (best_score > 0인 고유한 레벨)
        const weeklyRecords = recordsWithTheme.filter((record) => {
          if (!record.updated_at || record.best_score === 0) return false;
          const recordDate = new Date(record.updated_at);
          return recordDate >= weekStart;
        });

        // 고유한 (theme_code, level) 조합 개수
        const uniqueWeeklyRecords = new Set(
          weeklyRecords.map((r) => `${r.theme_code}-${r.level}`)
        );
        const weeklyTotal = uniqueWeeklyRecords.size;

        // 이전 주 총 문제 수 계산
        const lastWeekRecords = recordsWithTheme.filter((record) => {
          if (!record.updated_at || record.best_score === 0) return false;
          const recordDate = new Date(record.updated_at);
          return recordDate >= lastWeekStart && recordDate <= lastWeekEnd;
        });

        // 고유한 (theme_code, level) 조합 개수
        const uniqueLastWeekRecords = new Set(
          lastWeekRecords.map((r) => `${r.theme_code}-${r.level}`)
        );
        const weeklyTotalLastWeek = uniqueLastWeekRecords.size;

        // 그래프 비율 계산 (이전 주 대비 또는 최소 50문제 기준)
        const maxValue = Math.max(weeklyTotal, weeklyTotalLastWeek, 50); // 최소 50문제 기준
        const graphPercentage = maxValue > 0 ? Math.min((weeklyTotal / maxValue) * 100, 100) : 0;

        // 오답 노트 (best_score = 0인 최근 기록)
        // 주의: user_level_records에는 best_score = 0인 레코드가 없을 수 있음
        // 실제 오답은 game_sessions나 별도 테이블에 있을 수 있음
        const wrongRecords = recordsWithTheme.filter((record) => record.best_score === 0);
        const wrongAnswers = wrongRecords.length;

        // 분야별 최고 레벨 계산
        const themeMap: Record<number, { level: number; themeId: string; themeName: string }> = {};

        recordsWithTheme.forEach((record) => {
          if (record.best_score === 0) return;
          const themeCode = record.theme_code;
          if (!themeMap[themeCode] || record.level > themeMap[themeCode].level) {
            themeMap[themeCode] = {
              level: record.level,
              themeId: record.themeId,
              themeName: record.themeName,
            };
          }
        });

        // theme_id 파싱하여 category/subcategory 분리
        const categoryLevels = Object.entries(themeMap)
          .map(([themeCodeStr, { level, themeId }]) => {
            const [category, subcategory] = themeId.split('_');
            const categoryName =
              APP_CONFIG.CATEGORY_MAP[category as keyof typeof APP_CONFIG.CATEGORY_MAP] || category;

            let levelName = 'Beginner';
            if (level >= 15) levelName = 'Master';
            else if (level >= 10) levelName = 'Expert';
            else if (level >= 5) levelName = 'Intermediate';

            return {
              themeCode: parseInt(themeCodeStr, 10),
              themeId,
              categoryName,
              subCategoryName: subcategory,
              level,
              levelName,
              progress: Math.min(Math.round((level / 15) * 100), 100),
            };
          })
          .sort((a, b) => b.level - a.level);

        // 누적 고도 계산 (best_score 합산)
        const levelsWithBestScore = recordsWithTheme.filter(r => r.best_score > 0);
        const totalAltitude = levelsWithBestScore.reduce((sum: number, r) => sum + (r.best_score || 0), 0);
        const userTitle = getUserTitle(totalAltitude);

        // 총 정답 수 (best_score > 0인 레코드 개수 * 10문제 추정값)
        const totalCorrect = levelsWithBestScore.length * 10;
        const averageAccuracy = 95; // 임시값
        const maxCombo = 45; // 임시값

        // 최근 플레이 기록 (최근 10개, 중복 제거)
        const seenKeys = new Set<string>();
        const recentRecords = recordsWithTheme
          .filter((record) => {
            if (record.best_score === 0) return false;
            const key = `${record.theme_code}-${record.level}-${record.mode_code}`;
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
          })
          .slice(0, 10)
          .map((record) => {
            const timeAgo = getTimeAgo(record.updated_at || '');
            const modeName = record.mode_code === 1 ? '타임어택' : '서바이벌';
            const [category, subcategory] = record.themeId.split('_');
            const categoryName =
              APP_CONFIG.CATEGORY_MAP[category as keyof typeof APP_CONFIG.CATEGORY_MAP] || category;

            // 같은 theme_code, level, mode_code의 기록 개수 계산
            const sameRecords = recordsWithTheme.filter(
              (r) =>
                r.theme_code === record.theme_code &&
                r.level === record.level &&
                r.mode_code === record.mode_code &&
                r.best_score > 0
            );

            return {
              themeCode: record.theme_code,
              themeId: record.themeId,
              categoryName,
              subCategoryName: subcategory,
              level: record.level,
              modeCode: record.mode_code,
              modeName,
              bestScore: record.best_score,
              count: sameRecords.length,
              timeAgo,
            };
          });

        // 최근 7일간 일별 데이터 계산
        const dailyCounts = [0, 0, 0, 0, 0, 0, 0];
        const weekDays = ['', '', '', '', '', '', ''];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 요일 라벨 생성 (6일 전 ~ 오늘)
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - (6 - i));
          weekDays[i] = days[d.getDay()];
        }

        // 일별 카운트 집계 (고유한 레벨 조합으로 집계)
        const dailyUniqueSets = [
          new Set<string>(),
          new Set<string>(),
          new Set<string>(),
          new Set<string>(),
          new Set<string>(),
          new Set<string>(),
          new Set<string>(),
        ];

        recordsWithTheme.forEach((record) => {
          if (record.best_score === 0 || !record.updated_at) return;
          const date = new Date(record.updated_at);
          date.setHours(0, 0, 0, 0);

          const diffTime = today.getTime() - date.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0 && diffDays < 7) {
            const key = `${record.theme_code}-${record.level}`;
            dailyUniqueSets[6 - diffDays].add(key);
          }
        });

        dailyCounts.forEach((_, index) => {
          dailyCounts[index] = dailyUniqueSets[index].size;
        });

        // 월간 통계 계산
        const monthNow = new Date();
        const monthStart = new Date(monthNow.getFullYear(), monthNow.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);

        const lastMonthStart = new Date(monthNow.getFullYear(), monthNow.getMonth() - 1, 1);
        const lastMonthEnd = new Date(monthNow.getFullYear(), monthNow.getMonth(), 0);
        lastMonthEnd.setHours(23, 59, 59, 999);

        // 이번 달 총 문제 수 계산
        const monthlyRecords = recordsWithTheme.filter((record) => {
          if (!record.updated_at || record.best_score === 0) return false;
          const recordDate = new Date(record.updated_at);
          return recordDate >= monthStart;
        });

        const uniqueMonthlyRecords = new Set(
          monthlyRecords.map((r) => `${r.theme_code}-${r.level}`)
        );
        const monthlyTotal = uniqueMonthlyRecords.size;

        // 지난 달 총 문제 수 계산
        const lastMonthRecords = recordsWithTheme.filter((record) => {
          if (!record.updated_at || record.best_score === 0) return false;
          const recordDate = new Date(record.updated_at);
          return recordDate >= lastMonthStart && recordDate <= lastMonthEnd;
        });

        const uniqueLastMonthRecords = new Set(
          lastMonthRecords.map((r) => `${r.theme_code}-${r.level}`)
        );
        const monthlyTotalLastMonth = uniqueLastMonthRecords.size;

        // 이번 달 일별 데이터 계산
        const daysInMonth = new Date(monthNow.getFullYear(), monthNow.getMonth() + 1, 0).getDate();
        const monthlyDailyCounts = Array(daysInMonth).fill(0);
        const monthlyDailySets = Array(daysInMonth)
          .fill(null)
          .map(() => new Set<string>());
        const monthlyDays = Array(daysInMonth)
          .fill(null)
          .map((_, index) => `${index + 1}일`);

        recordsWithTheme.forEach((record) => {
          if (record.best_score === 0 || !record.updated_at) return;
          const date = new Date(record.updated_at);
          date.setHours(0, 0, 0, 0);

          if (date >= monthStart && date < new Date(monthNow.getFullYear(), monthNow.getMonth() + 1, 1)) {
            const dayOfMonth = date.getDate() - 1; // 0-based index
            if (dayOfMonth >= 0 && dayOfMonth < daysInMonth) {
              const key = `${record.theme_code}-${record.level}`;
              monthlyDailySets[dayOfMonth].add(key);
            }
          }
        });

        monthlyDailyCounts.forEach((_, index) => {
          monthlyDailyCounts[index] = monthlyDailySets[index].size;
        });

        setStats({
          weeklyTotal,
          weeklyTotalLastWeek,
          graphPercentage,
          wrongAnswers,
          dailyCounts,
          weekDays,
          monthlyTotal,
          monthlyTotalLastMonth,
          monthlyDailyCounts,
          monthlyDays,
          categoryLevels,
          recentRecords,
          totalAltitude,
          userTitle,
          totalCorrect,
          averageAccuracy,
          maxCombo,
        });
      } catch (err) {
        console.error('Failed to fetch history data:', err);
        setStats({
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
          userTitle: 'ERROR',
          totalCorrect: 0,
          averageAccuracy: 0,
          maxCombo: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, []);

  const getTimeAgo = (dateString: string): string => {
    if (!dateString) return '';
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return new Date(dateString).toLocaleDateString('ko-KR');
  };



  // 필터링된 통계 계산
  const filteredStats = useMemo(() => {
    return stats;
  }, [stats]);

  // 로그인하지 않은 경우
  if (!session && !loading) {
    return (
      <div className="history-page">
        <Header />
        <main className="history-main">
          <div className="history-content">
            <div className="history-guest-view">
              <div className="history-guest-icon">🔒</div>
              <h1 className="history-guest-title">
                로그인하고
                <br />
                <strong className="history-guest-highlight">나의 등반 기록을 확인하세요.</strong>
              </h1>
              <button
                className="history-guest-button"
                onClick={() => navigate(APP_CONFIG.ROUTES.MY_PAGE)}
              >
                로그인하기
              </button>
            </div>
          </div>
        </main>
        <FooterNav />
      </div>
    );
  }

  return (
    <div className="history-page">
      <Header />
      <main className="history-main">
        <div className="history-content">
          <h1 className="history-header-title">나의 등반 기록</h1>

          {/* 카드 1: 프로필 & 종합 등반 고도 (Summary Card) */}
          <div className="history-summary-card">
            <div className="history-profile-section">
              <div className="history-avatar">🏔️</div>
              <div className="history-profile-info">
                <div className="history-user-title">{loading ? '분석 중...' : stats?.userTitle}</div>
                <div className="history-user-altitude">
                  누적 고도 <strong className="altitude-value">{loading ? '...' : stats?.totalAltitude.toLocaleString()}m</strong>
                </div>
              </div>
            </div>

            <div className="history-stats-grid">
              <div className="history-stat-item">
                <span className="stat-label">총 정답 수</span>
                <span className="stat-value">{loading ? '...' : stats?.totalCorrect.toLocaleString()}개</span>
              </div>
              <div className="history-stat-item">
                <span className="stat-label">평균 정확도</span>
                <span className="stat-value">{loading ? '...' : stats?.averageAccuracy}%</span>
              </div>
              <div className="history-stat-item">
                <span className="stat-label">최고 콤보</span>
                <span className="stat-value">{loading ? '...' : stats?.maxCombo}회</span>
              </div>
            </div>

            <div className="history-card-divider" />

            <div className="history-card-header no-border">
              <h2 className="history-card-title">
                {timeRange === 'week' ? '주간 학습 리포트' : '월간 학습 리포트'}
              </h2>
              <div className="history-time-range-tabs">
                <button
                  className={`history-tab ${timeRange === 'week' ? 'active' : ''}`}
                  onClick={() => setTimeRange('week')}
                >
                  주간
                </button>
                <button
                  className={`history-tab ${timeRange === 'month' ? 'active' : ''}`}
                  onClick={() => setTimeRange('month')}
                >
                  월간
                </button>
              </div>
            </div>

            <div className="history-summary-content mini">
              <div className="history-summary-text">
                {timeRange === 'week' ? '이번 주' : '이번 달'}{' '}
                <strong className="history-summary-highlight">
                  {loading
                    ? '...'
                    : timeRange === 'week'
                      ? stats?.weeklyTotal || 0
                      : stats?.monthlyTotal || 0}
                  개 레벨
                </strong>
                을 정복했어요!
              </div>

              {/* SVG 막대 그래프 (최근 7일) */}
              <div
                className="history-summary-graph-container"
                style={{ height: '100px', marginTop: '12px', position: 'relative' }}
              >
                {loading ? (
                  <div className="history-graph-loading">트렌드 분석 중...</div>
                ) : (
                  <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                    {/* Y축 가이드라인 */}
                    <line
                      x1="0"
                      y1="80"
                      x2="300"
                      y2="80"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="1"
                    />

                    {/* 데이터 바 렌더링 */}
                    {timeRange === 'week'
                      ? (stats?.dailyCounts || []).map((count, index) => {
                        // 최대값 기준으로 높이 계산 (최소 10)
                        const dailyCounts = stats?.dailyCounts || [0, 0, 0, 0, 0, 0, 0];
                        const max = Math.max(...dailyCounts, 10);
                        const height = Math.min((count / max) * 80, 80); // 최대 높이 80
                        const x = index * (300 / 7) + 300 / 14 - 10; // 7등분 후 중앙 정렬, 바 너비 20 보정

                        return (
                          <g key={index}>
                            {/* 막대 (최소 높이 4px 보장) */}
                            <rect
                              x={x}
                              y={80 - Math.max(height, count > 0 ? 4 : 0)}
                              width="20"
                              height={Math.max(height, count > 0 ? 4 : 0)}
                              fill={index === 6 ? '#4cd964' : 'rgba(255, 255, 255, 0.2)'}
                              rx="4"
                            />
                            {/* 요일 라벨 */}
                            <text
                              x={x + 10}
                              y="95"
                              textAnchor="middle"
                              fill={index === 6 ? '#fff' : 'rgba(255,255,255,0.4)'}
                              fontSize="10"
                              fontWeight={index === 6 ? 'bold' : 'normal'}
                            >
                              {stats?.weekDays?.[index] || ''}
                            </text>
                          </g>
                        );
                      })
                      : (stats?.monthlyDailyCounts || []).length > 0
                        ? (stats?.monthlyDailyCounts || []).map((count, index) => {
                          const monthlyCounts = stats?.monthlyDailyCounts || [];
                          const max = Math.max(...monthlyCounts, 10);
                          const height = Math.min((count / max) * 80, 80);
                          const x = (index / monthlyCounts.length) * 300;
                          const barWidth = Math.max(2, 300 / monthlyCounts.length - 2);

                          return (
                            <g key={index}>
                              <rect
                                x={x}
                                y={80 - Math.max(height, count > 0 ? 4 : 0)}
                                width={barWidth}
                                height={Math.max(height, count > 0 ? 4 : 0)}
                                fill={
                                  index === monthlyCounts.length - 1
                                    ? '#4cd964'
                                    : 'rgba(255, 255, 255, 0.2)'
                                }
                                rx="2"
                              />
                              {index % Math.ceil(monthlyCounts.length / 7) === 0 && (
                                <text
                                  x={x + barWidth / 2}
                                  y="95"
                                  textAnchor="middle"
                                  fill={
                                    index === monthlyCounts.length - 1
                                      ? '#fff'
                                      : 'rgba(255,255,255,0.4)'
                                  }
                                  fontSize="8"
                                  fontWeight={index === monthlyCounts.length - 1 ? 'bold' : 'normal'}
                                >
                                  {stats?.monthlyDays?.[index] || ''}
                                </text>
                              )}
                            </g>
                          );
                        })
                        : null}
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* 카드 2: 분야별 숙련 분석 (Analysis Card) */}
          <div className="history-analysis-card">
            <div className="history-card-header no-border">
              <h2 className="history-card-title">분야별 숙련도</h2>
            </div>
            <div className="history-proficiency-list">
              {loading ? (
                <div className="history-loading">로딩 중...</div>
              ) : stats && stats.categoryLevels.length > 0 ? (
                stats.categoryLevels.slice(0, 5).map((item) => (
                  <div key={item.themeId} className="history-proficiency-item">
                    <div className="proficiency-info">
                      <span className="proficiency-name">{item.categoryName} - {item.subCategoryName}</span>
                      <span className="proficiency-level">Lv.{item.level}</span>
                    </div>
                    <div className="proficiency-bar-container">
                      <div
                        className="proficiency-bar-fill"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="history-empty">기록이 부족합니다.</div>
              )}
            </div>
          </div>

          {/* 카드 3: 명예의 전당 (Best Records Card) */}
          <div className="history-best-records-card">
            <div className="history-card-header no-border">
              <h2 className="history-card-title">명예의 전당</h2>
            </div>
            <div className="history-best-grid">
              <div className="history-best-item survival">
                <div className="best-icon">🔥</div>
                <div className="best-label">서바이벌 최장</div>
                <div className="best-value">{loading ? '...' : `${stats?.maxCombo || 0}콤보`}</div>
              </div>
              <div className="history-best-item timeattack">
                <div className="best-icon">⚡</div>
                <div className="best-label">타임어택 최고</div>
                <div className="best-value">{loading ? '...' : 'Lv.15'}</div>
              </div>
            </div>
          </div>

          {/* 카드 4: 오답 노트 & 최근 이력 (Activity List) */}
          <div className="history-card no-padding">
            <div className="history-card-header padding-16">
              <h2 className="history-card-title">최근 등반 이력</h2>
              <button
                className="history-review-climb-button"
                onClick={() => {
                  if (stats && stats.wrongAnswers > 0) {
                    // 오답 등반 로직 (추후 구현)
                    alert('오답 문제를 모아 등반을 시작합니다!');
                  }
                }}
                disabled={!stats || stats.wrongAnswers === 0}
              >
                오답 등반하기
              </button>
            </div>
            <div className="history-recent-list border-top">
              {loading ? (
                <div className="history-loading">로딩 중...</div>
              ) : filteredStats && filteredStats.recentRecords.length > 0 ? (
                filteredStats.recentRecords.map((record, index) => {
                  const [category, subCategory] = record.themeId.split('_');
                  return (
                    <div
                      key={index}
                      className="history-recent-item-new"
                      onClick={() => {
                        if (subCategory) {
                          navigate(`/level-select?category=${category}&sub=${subCategory}`);
                        } else {
                          navigate(`/subcategory?category=${category}`);
                        }
                      }}
                    >
                      <div className="history-recent-icon-small">
                        {category === 'math' ? '🔢' : '🇯🇵'}
                      </div>
                      <div className="history-recent-content">
                        <div className="history-recent-title-row">
                          <span className="history-recent-name">{record.categoryName} {record.subCategoryName} Lv.{record.level}</span>
                          <span className="history-recent-time-new">{record.timeAgo}</span>
                        </div>
                        <div className="history-recent-score-row">
                          <span className="history-recent-mode">{record.modeName}</span>
                          <span className="history-recent-best">{record.bestScore}점</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="history-empty">최근 활동이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </main>
      <FooterNav />
    </div>
  );
}
