import { useEffect, useState } from 'react';
import { useStatusCard } from '../hooks/bridge/useStatusCard';
import { STATUS, StatusType } from '@/constants/status';
import { BaseCard } from '@/components/BaseCard';
import './StatusCard.css';

interface UserStatus {
  totalRank: number;
  rankPercent: number;
  rankChange: number;
}

type LoadingState = StatusType;

export function StatusCard() {
  const { bestScore, navigateToMyPage } = useStatusCard();
  const [state, setState] = useState<LoadingState>('loading');
  const [status, setStatus] = useState<UserStatus | null>(null);

  useEffect(() => {
    const fetchUserData = () => {
      try {
        setState(STATUS.LOADING);

        // 로컬 데이터 기반 순위 산출 로직 (v2.0 고도화 예정)
        // 현재는 bestScore를 사용하여 로직을 확장할 수 있는 기반만 마련
        console.debug('Current best score from local records:', bestScore);

        const userStatus: UserStatus = {
          totalRank: 0,
          rankPercent: 0,
          rankChange: 0,
        };

        setStatus(userStatus);
        setState(STATUS.SUCCESS);
      } catch (error) {
        console.error('Failed to calculate user data:', error);
        setState(STATUS.ERROR);
      }
    };

    fetchUserData();
  }, [bestScore]);

  const handleDetailClick = () => {
    navigateToMyPage();
  };

  const formatRank = (rank: number) => {
    return rank.toLocaleString('ko-KR');
  };

  return (
    <BaseCard className={`status-card ${state}`} padding="none">
      {state === STATUS.LOADING && (
        <div className="status-card-skeleton">
          <div className="skeleton-line short"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line medium"></div>
        </div>
      )}

      {state === STATUS.ERROR && (
        <div className="status-card-error">
          <p>정보를 불러올 수 없습니다</p>
        </div>
      )}

      {state === STATUS.SUCCESS && status && (
        <>
          <div className="status-card-header">
            <span className="status-subtitle">나의 랭킹</span>
            <button className="status-detail-link" onClick={handleDetailClick}>
              더보기 &gt;
            </button>
          </div>
          <div className="status-main">
            <h2 className="status-rank">
              {status.totalRank > 0
                ? `종합 ${formatRank(status.totalRank)}위`
                : '기록 측정 중... 🏔️'}
            </h2>
            <p className="status-info">
              {status.totalRank > 0
                ? `상위 ${status.rankPercent}% ・ 어제보다 ${status.rankChange}계단 올랐어요!`
                : '첫 문제를 풀고 등반 기록을 남겨보세요!'}
            </p>
          </div>
        </>
      )}
    </BaseCard>
  );
}
