import { LANDMARK_MAPPING } from '@/features/quiz/constants/game';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/features/quiz/stores/useGameStore';
import { analytics } from '@/services/analytics';
import { urls } from '@/utils/navigation';
import { safeAccess } from '@/utils/validation';
import { InventoryItem } from '@/types/user';
import { quizEventBus } from '@/lib/eventBus';

interface UseQuizStartLogicProps {
  stamina: number;
  inventory: InventoryItem[];
  consumeItem: (itemId: number) => Promise<{ success: boolean; message: string }>;
  consumeStamina: () => Promise<{ success: boolean; message: string }>;
  worldParam: string | null;
  categoryParam: string | null;
  gameMode: string;
  totalQuestions: number;
  handleStaminaAdRecovery: () => Promise<void>;
}

export function useQuizStartLogic({
  stamina,
  inventory,
  consumeItem,
  consumeStamina,
  worldParam,
  categoryParam,
  gameMode,
  totalQuestions,
  handleStaminaAdRecovery,
}: UseQuizStartLogicProps) {
  const navigate = useNavigate();
  const [promiseData] = useState({ rule: '', example: '' });
  const [activeLandmark, setActiveLandmark] = useState<{ icon: string; text: string } | null>(null);

  const { setExhausted, setStaminaConsumed } = useGameStore();

  const altitudePhase = useMemo(() => {
    if (totalQuestions <= 10) return 'forest';
    if (totalQuestions <= 25) return 'rock';
    if (totalQuestions <= 45) return 'clouds';
    return 'space';
  }, [totalQuestions]);

  useEffect(() => {
    const landmark = safeAccess(LANDMARK_MAPPING, totalQuestions) as
      | { icon: string; text: string }
      | undefined;
    if (landmark) {
      setActiveLandmark(landmark);
      setTimeout(() => setActiveLandmark(null), 3000);
    }
  }, [totalQuestions]);

  const handleStartGame = useCallback(
    async (selectedItems: number[]) => {
      if (gameMode === 'base-camp') {
        analytics.trackQuizStart(worldParam || '', categoryParam || '');
        quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'tip', show: false });
        return;
      }

      if (stamina <= 0) {
        quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'stamina', show: true });
        return;
      }

      const staminaRes = await consumeStamina();

      if (staminaRes.success) {
        setStaminaConsumed(true);
        setExhausted(false);

        if (selectedItems.length > 0) {
          for (const itemId of selectedItems) {
            const item = inventory.find((it) => it.id === itemId);
            if (item && item.quantity > 0) {
              await consumeItem(itemId);
            }
          }
        }

        analytics.trackQuizStart(worldParam || '', categoryParam || '');
        quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'tip', show: false });
      } else {
        quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'stamina', show: true });
      }
    },
    [
      stamina,
      gameMode,
      worldParam,
      categoryParam,
      consumeStamina,
      inventory,
      consumeItem,
      setStaminaConsumed,
      setExhausted,
    ]
  );

  const handlePromiseComplete = useCallback(() => {
    quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'promise', show: false });
  }, []);

  const onAlertAction = useCallback(
    (action: string) => {
      if (action === 'charge') handleStaminaAdRecovery();
      else if (action === 'shop') navigate(urls.shop());
      else if (action === 'back') navigate(-1);
    },
    [handleStaminaAdRecovery, navigate]
  );

  return {
    promiseData,
    activeLandmark,
    altitudePhase,
    handleStartGame,
    handlePromiseComplete,
    onAlertAction,
  };
}
