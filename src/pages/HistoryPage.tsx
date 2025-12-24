import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { supabase } from '../utils/supabaseClient';
import { parseLocalSession } from '../utils/safeJsonParse';
import { storage, StorageKeys } from '../utils/storage';
import { APP_CONFIG } from '../config/app';
import type { GameRecord } from '../types';
import './HistoryPage.css';

interface HistoryStats {
  weeklyTotal: number;
  weeklyTotalLastWeek: number;
  graphPercentage: number;
  wrongAnswers: number;
  dailyCounts: number[]; // 최근 7일간 일별 문제 풀이 수 (0: 6일전, 6: 오늘)
  weekDays: string[];    // 최근 7일간 요일 라벨 (예: '월', '화')
  categoryLevels: Array<{
    category: string;
    categoryName: string;
    level: number;
    levelName: string;
  }>;
  recentRecords: Array<{
    category: string;
    categoryName: string;
    subject: string;
    level: number;
    mode: string;
    count: number;
    timeAgo: string;
  }>;
}

export function HistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [session, setSession] = useState<any>(null);

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
            } as any;
            setSession(currentSession);
          }
        } catch (e) {
          console.warn('Failed to read local session:', e);
        }

        if (!currentSession) {
          const { data: { session: supabaseSession } } = await supabase.auth.getSession();
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
            categoryLevels: [],
            recentRecords: [],
          });
          setLoading(false);
          return;
        }

        const user = currentSession.user;
        const user_id = userId || user.id;

        // 로컬 세션인 경우 기본값 반환
        const isLocalSession = user_id === 'tester' || user_id.startsWith('tester_') || user_id.startsWith('user_') || user_id.startsWith('game_');
        if (isLocalSession) {
          setStats({
            weeklyTotal: 0,
            weeklyTotalLastWeek: 0,
            graphPercentage: 0,
            wrongAnswers: 0,
            categoryLevels: [],
            recentRecords: [],
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

        // 게임 기록 가져오기
        const { data: records, error } = await supabase
          .from('game_records')
          .select('*')
          .eq('user_id', user_id)
          .order('cleared_at', { ascending: false });

        if (error) throw error;

        // 이번 주 총 문제 수 계산
        const weeklyRecords = records?.filter(record => {
          if (!record.cleared_at) return false;
          const recordDate = new Date(record.cleared_at);
          return recordDate >= weekStart;
        }) || [];

        // 이전 주 총 문제 수 계산
        const lastWeekRecords = records?.filter(record => {
          if (!record.cleared_at) return false;
          const recordDate = new Date(record.cleared_at);
          return recordDate >= lastWeekStart && recordDate <= lastWeekEnd;
        }) || [];

        // 그래프 비율 계산 (이전 주 대비 또는 최소 50문제 기준)
        const weeklyTotal = weeklyRecords.length;
        const weeklyTotalLastWeek = lastWeekRecords.length;
        const maxValue = Math.max(weeklyTotal, weeklyTotalLastWeek, 50); // 최소 50문제 기준
        const graphPercentage = maxValue > 0 ? Math.min((weeklyTotal / maxValue) * 100, 100) : 0;

        // 오답 노트 (cleared가 false인 최근 기록)
        const wrongRecords = records?.filter(record => record.cleared === false) || [];
        const wrongAnswers = wrongRecords.length;

        // 분야별 최고 레벨 계산
        const categoryMap: Record<string, { level: number; records: GameRecord[] }> = {};
        records?.forEach(record => {
          if (record.cleared) {
            const key = record.category;
            if (!categoryMap[key]) {
              categoryMap[key] = { level: 0, records: [] };
            }
            categoryMap[key].records.push(record);
            if (record.level > categoryMap[key].level) {
              categoryMap[key].level = record.level;
            }
          }
        });

        const categoryLevels = Object.entries(categoryMap).map(([category, data]) => {
          const categoryName = APP_CONFIG.CATEGORY_MAP[category as keyof typeof APP_CONFIG.CATEGORY_MAP] || category;
          let levelName = 'Beginner';
          if (data.level >= 15) levelName = 'Master';
          else if (data.level >= 10) levelName = 'Expert';
          else if (data.level >= 5) levelName = 'Intermediate';

          return {
            category,
            categoryName,
            level: data.level,
            levelName,
          };
        }).sort((a, b) => b.level - a.level);

        // 최근 플레이 기록 (최근 10개, 중복 제거)
        const seenKeys = new Set<string>();
        const recentRecords = (records || [])
          .filter(record => {
            if (!record.cleared) return false;
            const key = `${record.category}-${record.subject}-${record.level}-${record.mode}`;
            if (seenKeys.has(key)) return false;
            seenKeys.add(key);
            return true;
          })
          .slice(0, 10)
          .map(record => {
            const categoryName = APP_CONFIG.CATEGORY_MAP[record.category as keyof typeof APP_CONFIG.CATEGORY_MAP] || record.category;
            const timeAgo = getTimeAgo(record.cleared_at || record.updated_at || '');
            const modeName = record.mode === 'time-attack' ? '타임어택' : '서바이벌';

            // 같은 category, subject, level, mode의 기록 개수 계산
            const sameRecords = records?.filter(r =>
              r.category === record.category &&
              r.subject === record.subject &&
              r.level === record.level &&
              r.mode === record.mode &&
              r.cleared
            ) || [];

            return {
              category: record.category,
              categoryName,
              subject: record.subject,
              level: record.level,
              mode: record.mode,
              count: sameRecords.length,
              timeAgo,
              modeName,
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

        // 일별 카운트 집계
        records?.forEach(record => {
          if (!record.cleared || !record.cleared_at) return;
          const date = new Date(record.cleared_at);
          date.setHours(0, 0, 0, 0);

          const diffTime = today.getTime() - date.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays >= 0 && diffDays < 7) {
            dailyCounts[6 - diffDays]++;
          }
        });

        setStats({
          weeklyTotal,
          weeklyTotalLastWeek,
          graphPercentage,
          wrongAnswers,
          dailyCounts,
          weekDays,
          categoryLevels,
          recentRecords,
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
          categoryLevels: [],
          recentRecords: [],
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

  const handleReviewClick = () => {
    // 오답 노트 복습 페이지로 이동 (나중에 구현)
    navigate(APP_CONFIG.ROUTES.HOME);
  };

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
                로그인하고<br />
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

          {/* 카드 1: 요약 */}
          <div className="history-card">
            <div className="history-card-header">
              <h2 className="history-card-title">이번 주 요약</h2>
            </div>
            <div className="history-summary-content">
              <div className="history-summary-text">
                이번 주 <strong className="history-summary-highlight">
                  {loading ? '...' : stats?.weeklyTotal || 0}문제
                </strong>를 풀었어요!
              </div>

              {/* SVG 막대 그래프 (최근 7일) */}
              <div className="history-summary-graph-container" style={{ height: '120px', marginTop: '16px', position: 'relative' }}>
                {loading ? (
                  <div className="history-graph-loading">트렌드 분석 중...</div>
                ) : (
                  <svg width="100%" height="100%" viewBox="0 0 300 100" preserveAspectRatio="none">
                    {/* Y축 가이드라인 */}
                    <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                    {/* 데이터 바 렌더링 */}
                    {stats?.dailyCounts?.map((count, index) => {
                      // 최대값 기준으로 높이 계산 (최소 10)
                      const max = Math.max(...(stats.dailyCounts || [0]), 10);
                      const height = Math.min((count / max) * 80, 80); // 최대 높이 80
                      const x = (index * (300 / 7)) + (300 / 14) - 10; // 7등분 후 중앙 정렬, 바 너비 20 보정

                      return (
                        <g key={index}>
                          {/* 막대 (최소 높이 4px 보장) */}
                          <rect
                            x={x}
                            y={80 - Math.max(height, count > 0 ? 4 : 0)}
                            width="20"
                            height={Math.max(height, count > 0 ? 4 : 0)}
                            fill={index === 6 ? "#4cd964" : "rgba(255, 255, 255, 0.3)"}
                            rx="4"
                          />
                          {/* 수치 라벨 (값이 있을 때만) */}
                          {count > 0 && (
                            <text
                              x={x + 10}
                              y={80 - height - 5}
                              textAnchor="middle"
                              fill="rgba(255,255,255,0.8)"
                              fontSize="10"
                            >
                              {count}
                            </text>
                          )}
                          {/* 요일 라벨 */}
                          <text
                            x={x + 10}
                            y="95"
                            textAnchor="middle"
                            fill={index === 6 ? "#fff" : "rgba(255,255,255,0.5)"}
                            fontSize="10"
                            fontWeight={index === 6 ? "bold" : "normal"}
                          >
                            {stats?.weekDays?.[index] || ''}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>

              {stats && stats.weeklyTotalLastWeek > 0 && (
                <div className="history-summary-comparison" style={{ marginTop: '8px' }}>
                  지난주 대비 {stats.weeklyTotal >= stats.weeklyTotalLastWeek ? '+' : ''}
                  {stats.weeklyTotal - stats.weeklyTotalLastWeek}문제
                </div>
              )}
            </div>
          </div>

          {/* 카드 2: 오답 노트 */}
          <div className="history-card">
            <div className="history-card-header">
              <h2 className="history-card-title">오답 노트</h2>
            </div>
            <div className="history-wrong-answer-content">
              <div className="history-wrong-answer-text">
                최근 틀린 문제가 <strong className="history-wrong-answer-highlight">
                  {loading ? '...' : stats?.wrongAnswers || 0}개
                </strong> 있어요.
              </div>
              <button
                className="history-review-button"
                onClick={handleReviewClick}
                disabled={!stats || stats.wrongAnswers === 0}
              >
                복습하러 가기 &gt;
              </button>
            </div>
          </div>

          {/* 카드 3: 분야별 분석 */}
          <div className="history-card">
            <div className="history-card-header">
              <h2 className="history-card-title">분야별 분석</h2>
            </div>
            <div className="history-category-list">
              {loading ? (
                <div className="history-loading">로딩 중...</div>
              ) : stats && stats.categoryLevels.length > 0 ? (
                stats.categoryLevels.map((item) => (
                  <div key={item.category} className="history-category-item">
                    <span className="history-category-name">{item.categoryName}</span>
                    <span className="history-category-level">
                      Lv.{item.level} ({item.levelName})
                    </span>
                  </div>
                ))
              ) : (
                <div className="history-empty">아직 기록이 없어요.</div>
              )}
            </div>
          </div>

          {/* 카드 4: 최근 플레이 기록 */}
          <div className="history-card">
            <div className="history-card-header">
              <h2 className="history-card-title">최근 플레이 기록</h2>
            </div>
            <div className="history-recent-list">
              {loading ? (
                <div className="history-loading">로딩 중...</div>
              ) : stats && stats.recentRecords.length > 0 ? (
                stats.recentRecords.map((record, index) => (
                  <div key={index} className="history-recent-item">
                    <div className="history-recent-info">
                      <span className="history-recent-category">[{record.categoryName}]</span>
                      <span className="history-recent-details">
                        {record.subject} Lv.{record.level} ({record.modeName}) - {record.count}개
                      </span>
                    </div>
                    <span className="history-recent-time">{record.timeAgo}</span>
                  </div>
                ))
              ) : (
                <div className="history-empty">아직 기록이 없어요.</div>
              )}
            </div>
          </div>
        </div>
      </main>
      <FooterNav />
    </div>
  );
}

