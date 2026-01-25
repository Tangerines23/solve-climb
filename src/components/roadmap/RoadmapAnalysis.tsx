import React from 'react';
import { HistoryStats } from '../../hooks/useHistoryData';

interface RoadmapAnalysisProps {
  stats: HistoryStats;
}

export const RoadmapAnalysis: React.FC<RoadmapAnalysisProps> = ({ stats }) => {
  const maxLevel = 15;
  const categoryData = stats.categoryLevels.slice(0, 5);

  return (
    <div className="history-analysis-container fade-in">
      <div className="history-analysis-card">
        <div className="history-card-header no-border">
          <h3 className="history-card-title">등반 성과 📊</h3>
        </div>
        <div className="analysis-summary-grid">
          <div className="analysis-stat-item">
            <div className="stat-label">정답률</div>
            <div className="stat-value highlight">{stats.averageAccuracy}%</div>
          </div>
          <div className="analysis-stat-item">
            <div className="stat-label">완등 문제</div>
            <div className="stat-value">{stats.weeklyTotal}개</div>
          </div>
          <div className="analysis-stat-item">
            <div className="stat-label">연속 등반</div>
            <div className="stat-value">{stats.streakCount}일</div>
          </div>
        </div>
      </div>

      <div className="history-analysis-card">
        <div className="history-card-header">
          <h3 className="history-card-title">분야별 숙련도</h3>
        </div>
        <div className="skill-chart-container">
          {categoryData.length > 0 ? (
            categoryData.map((cat) => (
              <div key={cat.themeId} className="skill-bar-row">
                <div className="skill-info">
                  <span className="skill-name">
                    {cat.categoryName} - {cat.subCategoryName}
                  </span>
                  <span className="skill-level">Lv.{cat.level}</span>
                </div>
                <div className="skill-track">
                  <div
                    className="skill-bar"
                    style={{
                      width: `${(cat.level / maxLevel) * 100}%`,
                      backgroundColor:
                        cat.level >= 10
                          ? 'var(--color-success)'
                          : cat.level >= 5
                            ? 'var(--color-info)'
                            : 'var(--color-warning)',
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-chart-message">
              아직 데이터가 충분하지 않습니다.
              <br />
              다양한 문제를 풀어보세요!
            </div>
          )}
        </div>
      </div>

      <div className="history-analysis-card">
        <div className="history-card-header">
          <h3 className="history-card-title">최근 등반 활동</h3>
        </div>
        <div className="activity-heatmap-container">
          <div className="heatmap-grid">
            {stats.heatmapData.map((day, idx) => (
              <div
                key={idx}
                className={`heatmap-cell intensity-${day.intensity}`}
                title={`${day.date}: ${day.count}문제`}
              />
            ))}
          </div>
          <div className="heatmap-legend">
            <span>Less</span>
            <div className="legend-cells">
              <div className="heatmap-cell intensity-0" />
              <div className="heatmap-cell intensity-1" />
              <div className="heatmap-cell intensity-2" />
              <div className="heatmap-cell intensity-3" />
              <div className="heatmap-cell intensity-4" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};
