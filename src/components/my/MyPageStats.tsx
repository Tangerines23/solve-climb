interface MyPageStatsProps {
  loading: boolean;
  totalSolved: number;
  maxLevel?: number;
  bestSubject: string;
  isOpeningLeaderboard: boolean;
  retryCount: number;
  onNavigateHistory: () => void;
  onOpenLeaderboard: () => void;
}

export function MyPageStats({
  loading,
  totalSolved,
  maxLevel,
  bestSubject,
  isOpeningLeaderboard,
  retryCount,
  onNavigateHistory,
  onOpenLeaderboard,
}: MyPageStatsProps) {
  return (
    <div className="my-page-stats-grid">
      <div className="my-page-stat-card my-page-stat-card-clickable" onClick={onNavigateHistory}>
        <div className="my-page-stat-label">완등 문제</div>
        <div className="my-page-stat-value">
          {loading ? '...' : (totalSolved || 0).toLocaleString()}개
        </div>
      </div>
      <div className="my-page-stat-card my-page-stat-card-clickable" onClick={onNavigateHistory}>
        <div className="my-page-stat-label">최고 레벨</div>
        <div className="my-page-stat-value">
          {loading ? '...' : maxLevel ? `Lv. ${maxLevel}` : 'Lv. 0'}
        </div>
      </div>
      <div className="my-page-stat-card my-page-stat-card-clickable" onClick={onNavigateHistory}>
        <div className="my-page-stat-label">주력 분야</div>
        <div className="my-page-stat-value">{loading ? '...' : bestSubject}</div>
      </div>
      <div
        className={`my-page-stat-card my-page-stat-card-clickable ${isOpeningLeaderboard ? 'my-page-stat-card-loading' : ''}`}
        onClick={onOpenLeaderboard}
      >
        <div className="my-page-stat-label">내 랭킹</div>
        <div className="my-page-stat-value">
          {isOpeningLeaderboard
            ? retryCount > 0
              ? `재시도 중... (${retryCount}/${2})`
              : '열기 중...'
            : '명예의 전당 🏆'}
        </div>
      </div>
    </div>
  );
}
