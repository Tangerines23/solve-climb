import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import './StatusCard.css';

interface UserStatus {
  totalRank: number;
  rankPercent: number;
  rankChange: number;
}

type LoadingState = 'loading' | 'success' | 'error';

export function StatusCard() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadingState>('loading');
  const [status, setStatus] = useState<UserStatus | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setState('loading');
      // TODO: 실제 API 호출로 대체
      // const response = await fetch(`${APP_CONFIG.API_BASE_URL}/user/status`);
      // const data = await response.json();
      
      // 임시 데이터
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockData: UserStatus = {
        totalRank: 1234,
        rankPercent: 15,
        rankChange: 50,
      };
      
      setStatus(mockData);
      setState('success');
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setState('error');
    }
  };

  const handleDetailClick = () => {
    navigate(APP_CONFIG.ROUTES.MY_PAGE);
  };

  const formatRank = (rank: number) => {
    return rank.toLocaleString('ko-KR');
  };

  return (
    <div className={`status-card ${state}`}>
      {state === 'loading' && (
        <div className="status-card-skeleton">
          <div className="skeleton-line short"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line medium"></div>
        </div>
      )}
      
      {state === 'error' && (
        <div className="status-card-error">
          <p>정보를 불러올 수 없습니다</p>
        </div>
      )}
      
      {state === 'success' && status && (
        <>
          <div className="status-card-header">
            <span className="status-subtitle">나의 랭킹</span>
            <button className="status-detail-link" onClick={handleDetailClick}>
              자세히 &gt;
            </button>
          </div>
          <div className="status-main">
            <h2 className="status-rank">종합 {formatRank(status.totalRank)}위</h2>
            <p className="status-info">
              상위 {status.rankPercent}% ・ 어제보다 {status.rankChange}계단 올랐어요!
            </p>
          </div>
        </>
      )}
    </div>
  );
}

