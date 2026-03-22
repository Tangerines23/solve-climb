import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { supabase } from '../utils/supabaseClient';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { TierBadge } from '../components/TierBadge';
import { SegmentedControl } from '../components/SegmentedControl';
import './RankingPage.css';

type RankingType = 'total' | 'time-attack' | 'survival';

// Helper functions for validation

const validateModeParam = (param: string | null): RankingType | null => {
  if (param === 'total' || param === 'time-attack' || param === 'survival') {
    return param as RankingType;
  }
  return null;
};

export function RankingPage() {
  const [searchParams] = useSearchParams();

  // URL 파라미터에서 정보 추출 (기본값 설정)
  // Note: category param is ignored because get_ranking_v2 doesn't filter by category
  // It only tracks overall weekly scores, not per-category
  const modeParam = validateModeParam(searchParams.get('mode'));

  const [activePeriod, setActivePeriod] = useState<'weekly' | 'all-time'>('weekly');
  const [activeType, setActiveType] = useState<RankingType>(
    modeParam === 'time-attack' ? 'time-attack' : modeParam === 'survival' ? 'survival' : 'total'
  );
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const {
    fetchRanking,
    rankings,
    subscribeToRankingUpdates,
    unsubscribeFromRankingUpdates,
    rankingVersion,
  } = useLevelProgressStore();

  // Fetch ranking data (category is not used by RPC)
  const currentRankings = useMemo(() => {
    const key = `${activePeriod}-${activeType}`;
    const entry = Object.entries(rankings).find(([k]) => k === key);
    return entry ? entry[1] : [];
  }, [rankings, activePeriod, activeType]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
    });
  }, []);

  useEffect(() => {
    const loadRanking = async () => {
      // Don't show loading spinner for realtime updates (rankingVersion > 0)
      if (rankingVersion === 0) setLoading(true);

      // Note: passing null for world and category since RPC doesn't use them
      await fetchRanking(null, null, activePeriod, activeType);

      if (rankingVersion === 0) setLoading(false);
    };
    loadRanking();
  }, [activeType, activePeriod, fetchRanking, rankingVersion]);

  // Realtime Subscription
  useEffect(() => {
    // Only subscribe in Weekly mode (All-time doesn't change often/needs complex listener)
    if (activePeriod === 'weekly') {
      subscribeToRankingUpdates();
      return () => {
        unsubscribeFromRankingUpdates();
      };
    }
  }, [activePeriod, subscribeToRankingUpdates, unsubscribeFromRankingUpdates]);

  // 디버그 로그 추가
  useEffect(() => {
    console.log('[RankingPage] Active Params:', { activePeriod, activeType });
    console.log('[RankingPage] Current User ID:', currentUserId);
    console.log('[RankingPage] Current Rankings Count:', currentRankings.length);
    if (currentUserId && currentRankings.length > 0) {
      const found = currentRankings.find((r) => r.user_id === currentUserId);
      console.log('[RankingPage] User found in rankings:', found);
    }
  }, [activePeriod, activeType, currentUserId, currentRankings]);

  // 내 랭킹 찾기
  const myRank = currentUserId
    ? currentRankings.find((item) => item.user_id === currentUserId)
    : null;

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return rank;
    }
  };

  return (
    <div className="ranking-page">
      <Header />
      <main className="ranking-main">
        <div className="ranking-content">
          {/* Layer 1: 종목 선택 (Tabs) */}
          <div className="ranking-tabs-container">
            <div className="ranking-tabs-wrapper" style={{ marginTop: 'var(--spacing-md)' }}>
              <SegmentedControl
                options={[
                  { value: 'total', label: '종합' },
                  { value: 'time-attack', label: '타임어택' },
                  { value: 'survival', label: '서바이벌' },
                ]}
                value={activeType}
                onChange={(val) => setActiveType(val as 'total' | 'time-attack' | 'survival')}
              />
            </div>
          </div>

          {/* Layer 2: 기간 선택 (Pill Switch) */}
          <div className="ranking-switch-container">
            <div className="ranking-switch">
              <div className={`switch-bg ${activePeriod}`} />
              <button
                className={`switch-option ${activePeriod === 'weekly' ? 'active' : ''}`}
                onClick={() => setActivePeriod('weekly')}
              >
                🔥 이번 주 리그
              </button>
              <button
                className={`switch-option ${activePeriod === 'all-time' ? 'active' : ''}`}
                onClick={() => setActivePeriod('all-time')}
              >
                👑 명예의 전당
              </button>
            </div>
          </div>

          {/* Info Text */}
          <div className="ranking-info">
            {activePeriod === 'weekly' ? (
              <p className="flex items-center gap-2">
                <span>🔥 이번 주 리그: 성실함과 노력의 결과!</span>
                <span className="live-badge">🔴 LIVE</span>
              </p>
            ) : (
              <p className="hof-text">
                {activeType === 'total'
                  ? '🏛️ 명예의 전당: 역대 주간 시즌 1~3위의 전설적인 기록'
                  : '⚡ 레전드 기록: 각 분야별 역대 최고의 플레이'}
              </p>
            )}
          </div>

          {/* Layer 3: 랭킹 리스트 */}
          <div className="ranking-list-container">
            {loading ? (
              <div className="ranking-loading">
                <div className="spinner"></div>
                <p>랭킹 불러오는 중...</p>
              </div>
            ) : currentRankings.length > 0 ? (
              <div className="ranking-list">
                {currentRankings.map((item) => (
                  <div
                    key={item?.user_id}
                    className={`ranking-item card-interactive ${item?.rank && Number(item.rank) <= 3 ? `top-rank rank-${item.rank}` : ''} ${item?.user_id === currentUserId ? 'my-item' : ''}`}
                  >
                    <div className="ranking-item-left">
                      <span className="ranking-rank">{getMedalIcon(Number(item.rank))}</span>
                      <span className="ranking-nickname">
                        {item.nickname}
                        {/* 명예의 전당 시즌 뱃지 */}
                        {item.week_start_date && (
                          <span
                            className="season-badge"
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-gray-100)',
                              marginLeft: 'var(--spacing-sm)',
                              background: 'rgba(255, 255, 255, 0.1)',
                              padding: 'var(--spacing-xs) var(--spacing-tiny)',
                              borderRadius: 'var(--rounded-2xs)',
                              fontWeight: 'normal',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item?.week_start_date
                              ? (() => {
                                  try {
                                    const date = new Date(item.week_start_date);
                                    const month = date.getMonth() + 1;
                                    const firstDay = new Date(
                                      date.getFullYear(),
                                      date.getMonth(),
                                      1
                                    );
                                    const week = Math.ceil(
                                      (date.getDate() + firstDay.getDay()) / 7
                                    );
                                    return `${month}월 ${week}주차 시즌`;
                                  } catch (_e) {
                                    return '시즌 정보 없음';
                                  }
                                })()
                              : '시즌 정보 없음'}
                          </span>
                        )}
                      </span>
                      {/* 티어 뱃지: 명예의 전당은 박제된 티어 정보를 사용, 주간 랭킹은 점수 기반 계산 */}
                      <TierBadge
                        fixedTierLevel={item.tier_level}
                        fixedTierStars={item.tier_stars}
                        totalScore={item.tier_level === undefined ? Number(item.score) : undefined}
                        size="small"
                        showLabel={false}
                        showStars={true}
                      />
                    </div>
                    <div className="ranking-score">{Number(item.score).toLocaleString()}점</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ranking-empty">
                <span className="empty-icon">🏜️</span>
                <p>아직 등록된 랭킹이 없어요.</p>
                <p>첫 번째 주인공이 되어보세요!</p>
              </div>
            )}
          </div>

          {/* 내 랭킹 (스티키) */}
          {myRank && (
            <div className="my-rank-sticky">
              <div className="my-rank-sticky-content">
                <div className="ranking-item my-item">
                  <div className="ranking-item-left">
                    <span className="ranking-rank">{getMedalIcon(Number(myRank.rank))}</span>
                    <span className="ranking-nickname">나 ({myRank.nickname})</span>
                    {/* 티어 뱃지 항상 표시 */}
                    <TierBadge
                      fixedTierLevel={myRank.tier_level}
                      fixedTierStars={myRank.tier_stars}
                      totalScore={
                        myRank.tier_level === undefined ? Number(myRank.score) : undefined
                      }
                      size="small"
                      showLabel={false}
                      showStars={true}
                    />
                  </div>
                  <div className="ranking-score">{Number(myRank.score).toLocaleString()}점</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <FooterNav />
    </div>
  );
}
