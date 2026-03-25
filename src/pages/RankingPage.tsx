import { Header } from '@/components/Header';
import { FooterNav } from '@/components/FooterNav';
import { TierBadge } from '@/components/TierBadge';
import { SegmentedControl } from '@/components/SegmentedControl';
import { GlassCard } from '@/components/common/GlassCard';
import { useRanking } from '@/hooks/useRanking';
import './RankingPage.css';

export function RankingPage() {
  const {
    activePeriod,
    setActivePeriod,
    activeType,
    setActiveType,
    loading,
    currentUserId,
    currentRankings,
    myRank,
  } = useRanking();

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
          <div className="ranking-tabs-container">
            <div className="ranking-tabs-wrapper">
              <SegmentedControl
                options={[
                  { value: 'total', label: '종합' },
                  { value: 'time-attack', label: '타임어택' },
                  { value: 'survival', label: '서바이벌' },
                ]}
                value={activeType}
                onChange={(val) => setActiveType(val as import('@/hooks/useRanking').RankingType)}
              />
            </div>
          </div>

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

          <div className="ranking-list-container">
            {loading ? (
              <div className="ranking-loading">
                <div className="spinner"></div>
                <p>랭킹 불러오는 중...</p>
              </div>
            ) : currentRankings.length > 0 ? (
              <div className="ranking-list">
                {currentRankings.map((item) => (
                  <GlassCard
                    key={`${item?.user_id}-${item?.week_start_date || ''}`}
                    className={`ranking-item card-interactive ${item?.rank && Number(item.rank) <= 3 ? `top-rank rank-${item.rank}` : ''} ${item?.user_id === currentUserId ? 'my-item' : ''}`}
                  >
                    <div className="ranking-item-left">
                      <span className="ranking-rank">{getMedalIcon(Number(item.rank))}</span>
                      <span className="ranking-nickname">
                        {item.nickname}
                        {item.week_start_date && (
                          <span className="season-badge">
                            {(() => {
                              try {
                                const date = new Date(item.week_start_date);
                                const month = date.getMonth() + 1;
                                const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
                                const week = Math.ceil((date.getDate() + firstDay.getDay()) / 7);
                                return `${month}월 ${week}주차 시즌`;
                              } catch {
                                return '시즌 정보 없음';
                              }
                            })()}
                          </span>
                        )}
                      </span>
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
                  </GlassCard>
                ))}
              </div>
            ) : (
              <div className="ranking-empty">
                <span className="empty-icon">Desert</span>
                <p>아직 등록된 랭킹이 없어요.</p>
                <p>첫 번째 주인공이 되어보세요!</p>
              </div>
            )}
          </div>

          {myRank && (
            <div className="my-rank-sticky">
              <div className="my-rank-sticky-content">
                <GlassCard className="ranking-item my-item">
                  <div className="ranking-item-left">
                    <span className="ranking-rank">{getMedalIcon(Number(myRank.rank))}</span>
                    <span className="ranking-nickname">나 ({myRank.nickname})</span>
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
                </GlassCard>
              </div>
            </div>
          )}
        </div>
      </main>
      <FooterNav />
    </div>
  );
}
