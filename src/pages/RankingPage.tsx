import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header';
import { FooterNav } from '../components/FooterNav';
import { supabase } from '../utils/supabaseClient';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import { TierBadge } from '../components/TierBadge';
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

  const { fetchRanking, rankings } = useLevelProgressStore();

  // Fetch ranking data (category is not used by RPC)
  const currentRankings = useMemo(() => {
    // Use a simple key without category since RPC doesn't filter by it
    const key = `${activePeriod}-${activeType}`;
    return rankings[key] || [];
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
      setLoading(true);
      // Note: passing null for world and category since RPC doesn't use them
      await fetchRanking(null, null, activePeriod, activeType);
      setLoading(false);
    };
    loadRanking();
  }, [activeType, activePeriod, fetchRanking]);

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
        {/* Layer 1: 종목 선택 (Tabs) */}
        <div className="ranking-tabs-container">
          <div className="ranking-tabs">
            <button
              className={`ranking-tab ${activeType === 'total' ? 'active' : ''}`}
              onClick={() => setActiveType('total')}
            >
              종합
            </button>
            <button
              className={`ranking-tab ${activeType === 'time-attack' ? 'active' : ''}`}
              onClick={() => setActiveType('time-attack')}
            >
              타임어택
            </button>
            <button
              className={`ranking-tab ${activeType === 'survival' ? 'active' : ''}`}
              onClick={() => setActiveType('survival')}
            >
              서바이벌
            </button>
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
            <p>성실함 & 노력! 이번 주 획득한 모든 점수의 합산</p>
          ) : (
            <p>
              {activeType === 'total'
                ? '티어 정복! 모든 레벨별 최고 기록의 총합'
                : '역대 최고 기록! 단일 판 기록 기준'}
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
                  key={item.user_id}
                  className={`ranking-item ${Number(item.rank) <= 3 ? `top-rank rank-${item.rank}` : ''} ${item.user_id === currentUserId ? 'my-item' : ''}`}
                >
                  <div className="ranking-item-left">
                    <span className="ranking-rank">{getMedalIcon(Number(item.rank))}</span>
                    <span className="ranking-nickname">{item.nickname}</span>
                    {/* 명예의 전당 종합에만 티어 표시 */}
                    {activePeriod === 'all-time' && activeType === 'total' && (
                      <TierBadge
                        totalScore={Number(item.score)}
                        size="small"
                        showLabel={false}
                        showStars={true}
                      />
                    )}
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
            <div className="ranking-item my-item">
              <div className="ranking-item-left">
                <span className="ranking-rank">{getMedalIcon(Number(myRank.rank))}</span>
                <span className="ranking-nickname">나 ({myRank.nickname})</span>
                {/* 명예의 전당 종합에만 티어 표시 */}
                {activePeriod === 'all-time' && activeType === 'total' && (
                  <TierBadge
                    totalScore={Number(myRank.score)}
                    size="small"
                    showLabel={false}
                    showStars={true}
                  />
                )}
              </div>
              <div className="ranking-score">{Number(myRank.score).toLocaleString()}점</div>
            </div>
          </div>
        )}
      </main>
      <FooterNav />
    </div>
  );
}
