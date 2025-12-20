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

        setStats({
          weeklyTotal,
          weeklyTotalLastWeek,
          graphPercentage,
          wrongAnswers,
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
                이번 주 총 <strong className="history-summary-highlight">
                  {loading ? '...' : stats?.weeklyTotal || 0}문제
                </strong>를 풀었어요!
              </div>
              {/* 그래프 영역 */}
              <div className="history-summary-graph">
                <div 
                  className="history-graph-bar" 
                  style={{ width: `${loading ? 0 : (stats?.graphPercentage || 0)}%` }}
                ></div>
              </div>
              {stats && stats.weeklyTotalLastWeek > 0 && (
                <div className="history-summary-comparison">
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

