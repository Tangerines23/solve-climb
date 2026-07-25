import React from 'react';

export interface ResultStatItem {
  label: string;
  value: string;
  isHighlight?: boolean;
}

interface ResultScoreCardProps {
  finalScore: number;
  isNewRecord: boolean;
  statsList: ResultStatItem[];
}

export const ResultScoreCard: React.FC<ResultScoreCardProps> = ({
  finalScore,
  isNewRecord,
  statsList,
}) => {
  return (
    <div className="score-card-section">
      <div className="score-display">
        <span className="score-label">최종 점수</span>
        <div className="score-value-wrapper">
          <span className="score-value">{finalScore.toLocaleString()}</span>
          <span className="score-unit">점</span>
        </div>
        {isNewRecord && <div className="new-record-badge">NEW RECORD! 🎉</div>}
      </div>

      <div className="result-stats-grid">
        {statsList.map((stat, idx) => (
          <div key={idx} className={`stat-box ${stat.isHighlight ? 'highlight' : ''}`}>
            <span className="stat-label">{stat.label}</span>
            <span className="stat-value">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
