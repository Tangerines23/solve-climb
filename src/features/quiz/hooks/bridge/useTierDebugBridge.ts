import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { useMyPageStats } from '@/hooks/useMyPageStats';
import {
  loadTierDefinitions,
  calculateTier,
  type TierInfo,
  type TierLevel,
} from '../../constants/tiers';
import { calculateScoreForTier } from '../../utils/tierUtils';
import { STATUS, type StatusType } from '@/constants/status';

export function useTierDebugBridge() {
  const { stats, refetch } = useMyPageStats();
  const [tierDefinitions, setTierDefinitions] = useState<TierInfo[]>([]);
  const [selectedTierLevel, setSelectedTierLevel] = useState<TierLevel>(0);
  const [masteryInput, setMasteryInput] = useState('0');
  const [calculationResult, setCalculationResult] = useState<{
    level: TierLevel;
    stars: number;
    currentCycleScore: number;
  } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: StatusType; text: string } | null>(null);

  // 티어 업그레이드 시뮬레이션 상태
  const [previousTierLevel, setPreviousTierLevel] = useState<TierLevel>(0);
  const [currentTierLevel, setCurrentTierLevel] = useState<TierLevel>(1);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [previousScore, setPreviousScore] = useState(0);
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    loadTierDefinitions().then(setTierDefinitions);
  }, []);

  useEffect(() => {
    if (stats) {
      const masteryScore = stats.totalMasteryScore ?? 0;
      setMasteryInput(masteryScore.toString());
      if (stats.currentTierLevel !== null) {
        setSelectedTierLevel(stats.currentTierLevel as TierLevel);
      }
      // 계산 결과 업데이트
      calculateTier(masteryScore).then((result) => {
        setCalculationResult({
          level: result.level,
          stars: result.stars,
          currentCycleScore: result.currentCycleScore,
        });
      });
    }
  }, [stats]);

  const handleTierChange = useCallback(async () => {
    if (isUpdating) return;

    try {
      setIsUpdating(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: STATUS.ERROR, text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      const { error } = await supabase.rpc('debug_set_tier', {
        p_user_id: user.id,
        p_level: selectedTierLevel,
      });

      if (error) {
        setMessage({ type: STATUS.ERROR, text: `티어 변경 실패: ${error.message}` });
        return;
      }

      setMessage({ type: STATUS.SUCCESS, text: '티어가 변경되었습니다.' });
      await refetch();
    } catch (err) {
      setMessage({
        type: STATUS.ERROR,
        text: `오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, selectedTierLevel, refetch]);

  const handleMasterySet = useCallback(async () => {
    if (isUpdating) return;

    const numValue = parseInt(masteryInput, 10);
    if (isNaN(numValue) || numValue < 0) {
      setMessage({ type: STATUS.ERROR, text: '유효한 점수를 입력하세요.' });
      return;
    }

    try {
      setIsUpdating(true);
      setMessage(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setMessage({ type: STATUS.ERROR, text: '로그인이 필요합니다.' });
        return;
      }
      const user = session.user;

      const { error } = await supabase.rpc('debug_set_mastery_score', {
        p_user_id: user.id,
        p_score: numValue,
      });

      if (error) {
        setMessage({ type: STATUS.ERROR, text: `점수 설정 실패: ${error.message}` });
        return;
      }

      setMessage({ type: STATUS.SUCCESS, text: '마스터리 점수가 설정되었습니다.' });
      await refetch();
    } catch (err) {
      setMessage({
        type: STATUS.ERROR,
        text: `오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    } finally {
      setIsUpdating(false);
    }
  }, [isUpdating, masteryInput, refetch]);

  const handleMasteryChange = useCallback((delta: number) => {
    setMasteryInput((prev) => {
      const current = parseInt(prev, 10) || 0;
      const newValue = Math.max(0, current + delta);
      return newValue.toString();
    });
  }, []);

  const handleMasteryInputBlur = useCallback(() => {
    const numValue = parseInt(masteryInput, 10);
    if (isNaN(numValue) || numValue < 0) {
      const masteryScore = stats?.totalMasteryScore ?? 0;
      setMasteryInput(masteryScore.toString());
    }
  }, [masteryInput, stats]);

  const handleShowUpgradeModal = useCallback(async () => {
    try {
      const prevScore = await calculateScoreForTier(previousTierLevel, 0, 0);
      const currScore = await calculateScoreForTier(currentTierLevel, 0, 0);

      setPreviousScore(prevScore);
      setCurrentScore(currScore);
      setShowUpgradeModal(true);
    } catch (err) {
      setMessage({
        type: STATUS.ERROR,
        text: `점수 계산 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`,
      });
    }
  }, [previousTierLevel, currentTierLevel]);

  return {
    tierDefinitions,
    selectedTierLevel,
    setSelectedTierLevel,
    masteryInput,
    setMasteryInput,
    calculationResult,
    isUpdating,
    message,
    previousTierLevel,
    setPreviousTierLevel,
    currentTierLevel,
    setCurrentTierLevel,
    showUpgradeModal,
    setShowUpgradeModal,
    previousScore,
    currentScore,
    handleTierChange,
    handleMasterySet,
    handleMasteryChange,
    handleMasteryInputBlur,
    handleShowUpgradeModal,
    stats,
  };
}
