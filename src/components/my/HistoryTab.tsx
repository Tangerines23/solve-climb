import { MyPageStats } from '../../hooks/useMyPageStats';

interface HistoryTabProps {
  stats: MyPageStats | null;
  loading: boolean;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="history-tab-loading">
        <div className="loading-spinner"></div>
        <p>기록을 불러오는 중...</p>
      </div>
    );
  }

  if (!stats) {
    return <div className="history-tab-empty">기록 데이터가 없습니다.</div>;
  }

  // 승률 계산
  const winRate =
    stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;

  // 평균 풀이 시간 포맷팅
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}초`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}분 ${secs}초`;
  };

  return (
    <div className="history-tab">
      <div className="stats-summary-grid">
        <div className="stats-main-card">
          <div className="stats-main-header">
            <span className="stats-main-icon">🏆</span>
            <span className="stats-main-label">종합 정답률</span>
          </div>
          <div className="stats-main-value">{winRate}%</div>
          <div className="stats-main-progress">
            <div
              className="progress-bar"
              style={{ '--win-rate': `${winRate}%` } as React.CSSProperties}
            ></div>
          </div>
        </div>

        <div className="stats-mini-grid">
          <div className="stats-mini-card">
            <div className="stats-mini-label">총 플레이</div>
            <div className="stats-mini-value">{stats.totalGames}회</div>
          </div>
          <div className="stats-mini-card">
            <div className="stats-mini-label">맞힌 문제</div>
            <div className="stats-mini-value">{stats.totalCorrect}개</div>
          </div>
          <div className="stats-mini-card">
            <div className="stats-mini-label">최대 연승</div>
            <div className="stats-mini-value">{stats.bestStreak}연승</div>
          </div>
          <div className="stats-mini-card">
            <div className="stats-mini-label">평균 속도</div>
            <div className="stats-mini-value">{formatTime(stats.avgSolveTime)}</div>
          </div>
        </div>
      </div>

      <div className="history-info-section">
        <h3 className="section-title">성장 리포트</h3>
        <ul className="report-list">
          <li className="report-item">
            <span className="report-icon">✨</span>
            <div className="report-content">
              <span className="report-text">
                지금까지 <strong>{stats.totalQuestions}문항</strong>을 성공적으로 풀이했습니다.
              </span>
            </div>
          </li>
          {stats.lastPlayedAt && (
            <li className="report-item">
              <span className="report-icon">📅</span>
              <div className="report-content">
                <span className="report-text">
                  마지막 학습일:{' '}
                  <strong>{new Date(stats.lastPlayedAt).toLocaleDateString()}</strong>
                </span>
              </div>
            </li>
          )}
        </ul>
      </div>

      <div className="history-tip-card">
        <div className="tip-icon">💡</div>
        <p className="tip-text">
          매일 조금씩 꾸준히 학습하는 것이 실력 향상의 지름길입니다! 다음 목표인{' '}
          <strong>티어 승급</strong>을 향해 달려보세요.
        </p>
      </div>
    </div>
  );
};
