import { useState, useCallback } from 'react';
import { InventoryItem } from '@/types/user';
import { GameMode } from '../types/quiz';
import { quizEventBus } from '@/lib/eventBus';
import { sound } from '@/utils/sound';
import { ITEM_MAP, ItemMetadata } from '@/constants/items';
import { safeAccess } from '@/utils/validation';
import { useUserStore } from '@/stores/useUserStore';

interface UseQuizReviveParams {
  gameMode: GameMode;
  inventory: InventoryItem[];
  minerals: number;
  consumeItem: (itemId: number) => Promise<{ success: boolean; message: string }>;
  onWatchAd: () => void;
  isPreview: boolean;
}

/**
 * 라스트 찬스 & 부활 생명주기 관리 훅
 * @calls src/stores/useUserStore.ts#purchaseItem
 * @calls src/utils/sound/index.ts#sound.playRevive
 * @emits QUIZ:UI_MODAL_TOGGLE
 * @emits QUIZ:REVIVE_SUCCESS
 * @emits QUIZ:LAST_SPURT
 * @emits QUIZ:NEXT_QUESTION_REQUESTED
 * @emits QUIZ:GAME_OVER
 */
export function useQuizRevive({
  gameMode,
  inventory,
  minerals,
  consumeItem,
  onWatchAd,
  isPreview,
}: UseQuizReviveParams) {
  const [hasUsedLastChance, setHasUsedLastChance] = useState(false);

  /**
   * 부활 실행 로직 (아이템 소모 또는 직접 부활)
   */
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

      // Sound & notify success
      sound.playRevive();
      quizEventBus.emit('QUIZ:REVIVE_SUCCESS');

      // v2.2: Countdown before resuming correctly for BOTH modes
      quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'countdown', show: true });

      if (gameMode === 'time-attack') {
        // 타임어택: 라스트 스퍼트 이벤트 발생 (15초 충전 및 피버 발동)
        quizEventBus.emit('QUIZ:LAST_SPURT');
      } else {
        // 서바이벌: 새 문제 요청
        quizEventBus.emit('QUIZ:NEXT_QUESTION_REQUESTED');
      }
    },
    [gameMode, inventory, consumeItem]
  );

  /**
   * 미네랄로 즉시 구매 & 부활
   */
  const handlePurchaseAndRevive = useCallback(async () => {
    const itemType = gameMode === 'time-attack' ? 'last_spurt' : 'flare';
    const itemMeta = safeAccess(ITEM_MAP, itemType) as ItemMetadata | undefined;
    const basePrice = itemMeta?.price || 800;
    const targetPrice = basePrice * 2; // "즉시 구매 & 사용"은 상점가의 2배 (긴급 할증)

    if (minerals >= targetPrice) {
      if (itemMeta?.id) {
        try {
          await useUserStore.getState().purchaseItem(itemMeta.id);
          // 즉시 사용(소모) 처리하여 인벤토리에 공짜로 남지 않도록 보장
          await consumeItem(itemMeta.id);
        } catch {
          // 백엔드 RPC 실패 시에도 클라이언트 상태 진행 보장
        }
      }
      await handleRevive(false);
    }
  }, [minerals, gameMode, handleRevive, consumeItem]);

  /**
   * 광고 시청 후 무료 부활
   */
  const handleWatchAdAndRevive = useCallback(async () => {
    onWatchAd();
  }, [onWatchAd]);

  /**
   * 포기하고 결과 기록
   */
  const handleGiveUp = useCallback(() => {
    quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'lastChance', show: false });
    quizEventBus.emit('QUIZ:GAME_OVER', { reason: 'manual_exit' });
  }, []);

  /**
   * 게임 오버 인터셉트 및 라스트 찬스 모달 트리거
   */
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
