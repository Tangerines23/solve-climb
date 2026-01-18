import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_CONFIG } from '../config/app';
import { useLevelProgressStore } from '../stores/useLevelProgressStore';
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

  const fetchUserData = () => {
    try {
      setState('loading');

      // 로컬 데이터로 통계 계산
      const { progress } = useLevelProgressStore.getState();

      // 모든 카테고리에서 최고 점수 찾기
      let bestScore = 0;

      Object.values(progress).forEach((categoryData) => {
        Object.values(categoryData).forEach((subTopicData) => {
          Object.values(subTopicData).forEach((levelRecord) => {
            if (levelRecord.bestScore['time-attack']) {
              bestScore = Math.max(bestScore, levelRecord.bestScore['time-attack']);
            }
            if (levelRecord.bestScore['survival']) {
              bestScore = Math.max(bestScore, levelRecord.bestScore['survival']);
            }
          });
        });
      });

      // 로컬 데이터만으로는 순위와 퍼센트를 계산할 수 없음
      const userStatus: UserStatus = {
        totalRank: 0, // 랭킹 정보 산출 불가 상황 (v2.0 고도화 예정)
        rankPercent: 0,
        rankChange: 0,
      };

      setStatus(userStatus);
      setState('success');
    } catch (error) {
      console.error('Failed to calculate user data:', error);
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
    </div>
  );
}
