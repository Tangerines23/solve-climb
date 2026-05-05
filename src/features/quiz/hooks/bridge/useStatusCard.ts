import { useCallback } from 'react';
import { useLevelProgressStore } from '../../stores/useLevelProgressStore';
import { APP_CONFIG } from '@/config/app';
import { useNavigate } from 'react-router-dom';

export function useStatusCard() {
  const navigate = useNavigate();

  const getBestScore = useCallback(() => {
    const { progress } = useLevelProgressStore.getState();
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

    return bestScore;
  }, []);

  const navigateToMyPage = useCallback(() => {
    navigate(APP_CONFIG.ROUTES.MY_PAGE);
  }, [navigate]);

  return {
    getBestScore,
    navigateToMyPage,
  };
}
