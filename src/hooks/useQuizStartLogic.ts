import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/useGameStore';
import { analytics } from '@/services/analytics';
import { urls } from '@/utils/navigation';
import { LANDMARK_MAPPING } from '@/constants/game';
import { safeAccess } from '@/utils/validation';
import { InventoryItem } from '@/types/user';

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
  const [showTipModal, setShowTipModal] = useState(true);
  const [showStaminaModal, setShowStaminaModal] = useState(false);
  const [showPromise, setShowPromise] = useState(false);
  const [promiseData] = useState({ rule: '', example: '' });
  const [activeLandmark, setActiveLandmark] = useState<{ icon: string; text: string } | null>(null);

  const { setExhausted, setStaminaConsumed } = useGameStore();

  const altitudePhase = useMemo(() => {
    if (totalQuestions <= 3) return 'forest';
    if (totalQuestions <= 7) return 'cliff';
    return 'peak';
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
        setShowTipModal(false);
        return;
      }

      if (stamina <= 0) {
        setShowStaminaModal(true);
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
        setShowTipModal(false);
      } else {
        setShowStaminaModal(true);
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
    setShowPromise(false);
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
    showTipModal,
    setShowTipModal,
    showStaminaModal,
    setShowStaminaModal,
    showPromise,
    promiseData,
    activeLandmark,
    altitudePhase,
    handleStartGame,
    handlePromiseComplete,
    onAlertAction,
  };
}
