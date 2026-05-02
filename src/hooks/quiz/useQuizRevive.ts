import { useState, useCallback } from 'react';
import { InventoryItem } from '@/types/user';
import { GameMode } from '@/types/quiz';
import { quizEventBus } from '@/lib/eventBus';

interface UseQuizReviveParams {
  gameMode: GameMode;
  inventory: InventoryItem[];
  minerals: number;
  consumeItem: (itemId: number) => Promise<{ success: boolean; message: string }>;
  onWatchAd: () => void;
  isPreview: boolean;
}

import { ITEM_MAP, ItemMetadata } from '@/constants/items';
import { safeAccess } from '@/utils/validation';

export function useQuizRevive({
  gameMode,
  inventory,
  minerals,
  consumeItem,
  onWatchAd,
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

      quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'lastChance', show: false });
      setHasUsedLastChance(true);

      // Notify success
      quizEventBus.emit('QUIZ:REVIVE_SUCCESS');

      // v2.2: Countdown before resuming correctly for BOTH modes
      quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'countdown', show: true });

      if (gameMode === 'time-attack') {
        // 타임어택: 라스트 스퍼트 사용 시 이벤트를 통해 처리
        quizEventBus.emit('QUIZ:LAST_SPURT');
      } else {
        // 서바이벌: 새 문제 요청
        quizEventBus.emit('QUIZ:NEXT_QUESTION_REQUESTED');
      }
    },
    [gameMode, inventory, consumeItem]
  );

  const handlePurchaseAndRevive = useCallback(async () => {
    const itemType = gameMode === 'time-attack' ? 'last_spurt' : 'flare';
    const itemMeta = safeAccess(ITEM_MAP, itemType) as ItemMetadata | undefined;
    const basePrice = itemMeta?.price || 800;
    const targetPrice = basePrice * 2; // "즉시 구매 & 사용"은 상점가의 2배 (긴급 할증)

    if (minerals >= targetPrice) {
      console.log(`Simulating purchase of ${itemType} for ${targetPrice} minerals`);
      await handleRevive(false);
    }
  }, [minerals, gameMode, handleRevive]);

  const handleWatchAdAndRevive = useCallback(async () => {
    onWatchAd();
  }, [onWatchAd]);

  const handleGiveUp = useCallback(() => {
    quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'lastChance', show: false });
    quizEventBus.emit('QUIZ:GAME_OVER', { reason: 'manual_exit' });
  }, []);

  const stableHandleGameOver = useCallback(
    (reason?: string) => {
      if (hasUsedLastChance || isPreview) {
        quizEventBus.emit('QUIZ:GAME_OVER', { reason });
        return;
      }
      if (reason === 'manual_exit') {
        quizEventBus.emit('QUIZ:GAME_OVER', { reason });
        return;
      }
      quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'lastChance', show: true });
    },
    [hasUsedLastChance, isPreview]
  );

  return {
    hasUsedLastChance,
    handleRevive,
    handlePurchaseAndRevive,
    handleWatchAdAndRevive,
    handleGiveUp,
    stableHandleGameOver,
  };
}
