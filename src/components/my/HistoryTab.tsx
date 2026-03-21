import { useMyPageStats } from '../../hooks/useMyPageStats';
import { useGrowthJournal } from '../../hooks/useGrowthJournal';
import { useMemo, useState } from 'react';

export const HistoryTab: React.FC = () => {
  const { stats, loading: statsLoading } = useMyPageStats();
  const { logs, loading: logsLoading } = useGrowthJournal();
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loading = statsLoading || logsLoading;

  // 주당 요일별 활동량 계산 (최근 7일)
  const weeklyTrend = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map((date) => {
      const dayLogs = logs.filter((log) => log.created_at.startsWith(date));
      return {
        date: date.slice(5), // MM-DD
        count: dayLogs.length,
      };
    });
  }, [logs]);

  // 오답 모음 추출 (최근 30개 기록 중)
  const recentWrongAnswers = useMemo(() => {
    return logs.flatMap((log) => log.wrong_answers || []).slice(0, 5); // 상위 5개만 노출
  }, [logs]);

  if (loading && !stats) {
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
        <h3 className="section-title">주간 활동 추이</h3>
        <div className="trend-chart">
          {weeklyTrend.map((day, i) => (
            <div key={i} className="trend-bar-wrapper">
              <div
                className="trend-bar"
                style={
                  {
                    '--bar-height': `${Math.min(day.count * 20, 100)}%`,
                    opacity: day.count > 0 ? 1 : 0.3,
                  } as React.CSSProperties
                }
              >
                {day.count > 0 && <span className="trend-count">{day.count}</span>}
              </div>
              <span className="trend-label">{day.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="history-info-section">
        <h3 className="section-title">최근 성장 일지</h3>
        <div className="activity-log-list">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                className={`activity-log-item ${expandedLogId === log.id ? 'expanded' : ''}`}
                onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="log-header">
                  <span className="log-mode">
                    {log.game_mode === 'survival' ? '🔥 서바이벌' : '⏱️ 타임어택'}
                  </span>
                  <span className="log-date">{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
                <div className="log-content">
                  <div className="log-main">
                    <span className="log-world">
                      {log.world_id} - {log.category_id} (Lvl.{log.level})
                    </span>
                    <span className="log-score">{log.score.toLocaleString()}m</span>
                  </div>
                  <div className="log-details">
                    <span>
                      정답 {log.correct_count}/{log.total_questions}
                    </span>
                    <span>평균 {log.avg_solve_time.toFixed(1)}초</span>
                    <span className="log-expand-icon">{expandedLogId === log.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* 확장이 되었을 때 보이는 상세 뷰 */}
                {expandedLogId === log.id && (
                  <div className="log-details-expanded">
                    {log.wrong_answers && log.wrong_answers.length > 0 ? (
                      <div className="log-wrong-answers">
                        <h4 className="log-wrong-answers-title">오답 노트</h4>
                        {log.wrong_answers.map((wa, i) => (
                          <div key={i} className="log-wrong-answer-item">
                            <span className="log-wa-q">{wa.question}</span>
                            <span className="log-wa-wrong">오답: {wa.wrong_answer}</span>
                            <span className="log-wa-correct">정답: {wa.correct_answer}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="log-perfect-score">
                        <span className="perfect-icon">🎉</span> 모든 문제를 맞혔습니다!
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="empty-log-text">아직 기록된 일지가 없습니다.</p>
          )}
        </div>
      </div>

      {recentWrongAnswers.length > 0 && (
        <div className="history-info-section wrong-answer-section">
          <h3 className="section-title">오답 노트 (복습 필요 ⚠️)</h3>
          <div className="wrong-answer-grid">
            {recentWrongAnswers.map((wa, i) => (
              <div key={i} className="wrong-answer-card-mini">
                <p className="wa-q">{wa.question}</p>
                <div className="wa-footer">
                  <span className="wa-wrong">오답: {wa.wrong_answer}</span>
                  <span className="wa-correct">정답: {wa.correct_answer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
