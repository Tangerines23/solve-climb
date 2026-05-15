import { useCallback } from 'react';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { APP_CONFIG } from '@/config/app';
import { useNavigate } from 'react-router-dom';

export function useStatusCard() {
  const navigate = useNavigate();

  // 모든 레벨 기록 중 최고 점수를 Selector에서 계산하여 구독
  const bestScore = useLevelProgressStore((state) => {
    let max = 0;
    Object.values(state.records).forEach((record) => {
      const { 'time-attack': ta, survival: sv } = record.bestScore;
      if (ta) max = Math.max(max, ta);
      if (sv) max = Math.max(max, sv);
    });
    return max;
  });

  const navigateToMyPage = useCallback(() => {
    navigate(APP_CONFIG.ROUTES.MY_PAGE);
  }, [navigate]);

  return {
    bestScore,
    navigateToMyPage,
  };
}
