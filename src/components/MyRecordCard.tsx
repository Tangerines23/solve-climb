import { useMyRecordCardBridge } from '../hooks/useMyRecordCardBridge';
import { BaseCard } from './BaseCard';
import './MyRecordCard.css';

interface MyRecordCardProps {
  world: string;
  category: string;
  categoryName: string;
}

export function MyRecordCard({ world, category, categoryName }: MyRecordCardProps) {
  const { loading, records } = useMyRecordCardBridge({ world, category });

  if (loading) {
    return (
      <div className="my-record-card">
        <div className="my-record-card-skeleton">
          <div className="skeleton-title"></div>
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
        </div>
      </div>
    );
  }

  return (
    <BaseCard className="my-record-card" padding="none">
      <h3 className="my-record-card-title">{categoryName} 최고 기록</h3>
      <div className="my-record-card-content">
        <div className="my-record-item">
          <span className="my-record-icon">⏱️</span>
          <span className="my-record-label">타임 어택:</span>
          <span className="my-record-value">
            {records['time-attack'] !== null
              ? `${records['time-attack'].toLocaleString()}m`
              : '기록 없음'}
          </span>
        </div>
        <div className="my-record-item">
          <span className="my-record-icon">♾️</span>
          <span className="my-record-label">서바이벌:</span>
          <span className="my-record-value">
            {records['survival'] !== null
              ? `${records['survival'].toLocaleString()}m`
              : '기록 없음'}
          </span>
        </div>
      </div>
    </BaseCard>
  );
}
