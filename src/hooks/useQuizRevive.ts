import { useState, useCallback } from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { InventoryItem } from '../types/user';
import { GameMode } from '../types/quiz';

interface UseQuizReviveParams {
  gameMode: GameMode;
  inventory: InventoryItem[];
  minerals: number;
  consumeItem: (itemId: number) => Promise<{ success: boolean; message: string }>;
  setShowLastChanceModal: (show: boolean) => void;
  setTimerResetKey: (updater: (prev: number) => number) => void;
  setShowCountdown: (show: boolean) => void;
  generateNewQuestion: () => void;
  animations: {
    setIsError: (val: boolean) => void;
    [key: string]: unknown; // Safer than any
  };
  setDisplayValue: (val: string) => void;
  handleGameOver: (reason?: string) => void;
  setIsSubmitting: (val: boolean) => void;
  isPreview: boolean;
}

export function useQuizRevive({
  gameMode,
  inventory,
  minerals,
  consumeItem,
  setShowLastChanceModal,
  setTimerResetKey,
  setShowCountdown,
  generateNewQuestion,
  animations,
  setDisplayValue,
  handleGameOver,
  setIsSubmitting,
  isPreview,
}: UseQuizReviveParams) {
  const [hasUsedLastChance, setHasUsedLastChance] = useState(false);

  // Revive Logic
  const handleRevive = useCallback(
    async (useItem: boolean) => {
      const itemType = gameMode === 'time-attack' ? 'last_spurt' : 'flare';

      if (useItem) {
        const item = inventory.find((i) => i.code === itemType);
        if (item) {
          await consumeItem(item.id);
        }
      }

      setShowLastChanceModal(false);
      setHasUsedLastChance(true);
      setIsSubmitting(false);

      // v2.2: Countdown before resuming correctly for BOTH modes
      setShowCountdown(true);

      if (gameMode === 'time-attack') {
        // 타임어택: 라스트 스퍼트 사용 시 +15초 추가
        useQuizStore.getState().setTimeLimit(15);
        setTimerResetKey((prev) => prev + 1);
      } else {
        // 서바이벌: 새 문제로 진행
        generateNewQuestion();
        animations.setIsError(false);
        setDisplayValue('');
      }
    },
    [
      gameMode,
      inventory,
      consumeItem,
      setShowLastChanceModal,
      setTimerResetKey,
      setShowCountdown,
      generateNewQuestion,
      animations,
      setDisplayValue,
      setIsSubmitting,
    ]
  );

  const handlePurchaseAndRevive = useCallback(async () => {
    const itemType = gameMode === 'time-attack' ? 'last_spurt' : 'flare';
    const basePrice = itemType === 'last_spurt' ? 800 : 800;
    const targetPrice = basePrice * 2;

    if (minerals >= targetPrice) {
      console.log(`Simulating purchase of ${itemType} for ${targetPrice} minerals`);
      // TODO: 실제 구매 로직 연동
      await handleRevive(false);
    }
  }, [minerals, gameMode, handleRevive]);

  const handleGiveUp = useCallback(() => {
    setShowLastChanceModal(false);
    handleGameOver();
  }, [setShowLastChanceModal, handleGameOver]);

  // 안정적인 handleGameOver 함수 (QuizCard에 전달) - LAST CHANCE INTERCEPT
  const stableHandleGameOver = useCallback(
    (reason?: string) => {
      if (hasUsedLastChance || isPreview) {
        handleGameOver(reason);
        return;
      }

      if (reason === 'manual_exit') {
        handleGameOver(reason);
        return;
      }

      setShowLastChanceModal(true);
    },
    [hasUsedLastChance, isPreview, handleGameOver, setShowLastChanceModal]
  );

  return {
    hasUsedLastChance,
    handleRevive,
    handlePurchaseAndRevive,
    handleGiveUp,
    stableHandleGameOver,
  };
}
