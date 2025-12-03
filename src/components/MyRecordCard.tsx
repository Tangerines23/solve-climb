import React, { useEffect, useState } from 'react';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
import './MyRecordCard.css';

interface MyRecordCardProps {
  category: string;
  subTopic: string;
  subTopicName: string;
}

export function MyRecordCard({ category, subTopic, subTopicName }: MyRecordCardProps) {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<{
    'time-attack': number | null;
    'survival': number | null;
  }>({ 'time-attack': null, 'survival': null });

  const getBestRecords = useLevelProgressStore((state) => state.getBestRecords);

  useEffect(() => {
    // 비동기 로딩 시뮬레이션 (실제로는 API 호출)
    setLoading(true);
    setTimeout(() => {
      const bestRecords = getBestRecords(category, subTopic);
      // 점수를 그대로 사용 (미터 단위)
      setRecords({
        'time-attack': bestRecords['time-attack'],
        'survival': bestRecords['survival'],
      });
      setLoading(false);
    }, 300);
  }, [category, subTopic, getBestRecords]);

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
    <div className="my-record-card">
      <h3 className="my-record-card-title">{subTopicName} 최고 기록</h3>
      <div className="my-record-card-content">
        <div className="my-record-item">
          <span className="my-record-icon">⏱️</span>
          <span className="my-record-label">타임 어택:</span>
          <span className="my-record-value">
            {records['time-attack'] !== null ? `${records['time-attack'].toLocaleString()}m` : '기록 없음'}
          </span>
        </div>
        <div className="my-record-item">
          <span className="my-record-icon">♾️</span>
          <span className="my-record-label">서바이벌:</span>
          <span className="my-record-value">
            {records['survival'] !== null ? `${records['survival'].toLocaleString()}m` : '기록 없음'}
          </span>
        </div>
      </div>
    </div>
  );
}

