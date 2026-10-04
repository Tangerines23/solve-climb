import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/stores/useGameStore';
import { useQuizStore } from '@/stores/useQuizStore';
import { analytics } from '@/services/analytics';
import { urls } from '@/utils/navigation';
import { LANDMARK_MAPPING } from '@/constants/game';
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
  setShowStaminaModal: (v: boolean) => void;
}

/**
 * 시작 시 적용될 제한 시간(초)을 계산하는 순수 함수 (Zero-Else 준수)
 * - 산소통(oxygen_tank) 장착 시 서바이벌은 20초(기본 10초), 일반/타임어택은 기본 60초 + 10초
 */
export function computeInitialTimeLimit(gameMode: string, equippedCodes: string[]): number {
  const hasOxygenTank = equippedCodes.includes('oxygen_tank');
  if (gameMode === 'survival') {
    if (hasOxygenTank) {
      return 20;
    }
    return 10;
  }
  const extraTime = hasOxygenTank ? 10 : 0;
  return 60 + extraTime;
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
  setShowStaminaModal,
}: UseQuizStartLogicProps) {
  const navigate = useNavigate();
  const [promiseData] = useState({ rule: '', example: '' });
  const [activeLandmark, setActiveLandmark] = useState<{ icon: string; text: string } | null>(null);
  // 광고 중복 호출 방지: 광고가 이미 실행 중일 때 추가 클릭 무시
  const isAdRecovering = useRef(false);
  const selectedItemsRef = useRef<number[]>([]);

  const { setExhausted, setStaminaConsumed } = useGameStore();

  const altitudePhase = useMemo(() => {
    if (totalQuestions <= 10) return 'forest';
    if (totalQuestions <= 25) return 'rock';
    if (totalQuestions <= 45) return 'clouds';
    return 'space';
  }, [totalQuestions]);

  useEffect(() => {
    const landmark = safeAccess(LANDMARK_MAPPING, totalQuestions) as
      { icon: string; text: string } | undefined;
    if (landmark) {
      setActiveLandmark(landmark);
      setTimeout(() => setActiveLandmark(null), 3000);
    }
  }, [totalQuestions]);

  const handleStartGame = useCallback(
    async (selectedItems: number[], forceExhausted = false) => {
      selectedItemsRef.current = selectedItems;
      if (gameMode === 'base-camp') {
        analytics.trackQuizStart(worldParam || '', categoryParam || '');
        quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'tip', show: false });
        return;
      }

      if (stamina <= 0 && !forceExhausted) {
        quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'stamina', show: true });
        return;
      }

      const applyEquippedItems = async (itemsToEquip: number[]) => {
        const equippedCodes: string[] = [];
        if (itemsToEquip && itemsToEquip.length > 0) {
          for (const itemId of itemsToEquip) {
            const item = inventory.find((it) => it.id === itemId);
            if (item && item.quantity > 0) {
              await consumeItem(itemId);
              equippedCodes.push(item.code);
            }
          }
        }

        // 인게임 세션에 장착된 아이템 등록
        useGameStore.getState().setActiveItems(equippedCodes);

        // 1. 산소통 (oxygen_tank) 시간 설정
        const timeLimit = computeInitialTimeLimit(gameMode, equippedCodes);
        useQuizStore.getState().setTimeLimit(timeLimit);

        // 2. 파워젤 (power_gel): 시작 시 콤보 1단계 즉시 부여
        if (equippedCodes.includes('power_gel')) {
          useGameStore.getState().setCombo(1);
        }
      };

      if (forceExhausted) {
        setStaminaConsumed(false);
        setExhausted(true);

        await applyEquippedItems(selectedItems);

        analytics.trackQuizStart(worldParam || '', categoryParam || '');
        quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'tip', show: false });
        return;
      }

      const staminaRes = await consumeStamina();

      if (!staminaRes.success) {
        quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'stamina', show: true });
        return;
      }

      setStaminaConsumed(true);
      setExhausted(false);

      await applyEquippedItems(selectedItems);

      analytics.trackQuizStart(worldParam || '', categoryParam || '');
      quizEventBus.emit('QUIZ:UI_MODAL_TOGGLE', { modal: 'tip', show: false });
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
      if (action === 'login') {
        // 로그인하고 기록 보호하기 → 마이페이지(로그인 화면)로 이동
        setShowStaminaModal(false);
        navigate(urls.myPage());
        return;
      }
      if (action === 'charge') {
        // 광고 보고 충전하기 → 중복 클릭 방지 후 광고 실행
        if (isAdRecovering.current) return;
        isAdRecovering.current = true;
        handleStaminaAdRecovery().finally(() => {
          isAdRecovering.current = false;
        });
        return;
      }
      if (action === 'play') {
        // 지친 상태로 진행 → 모달 닫고 지침 상태로 강제 시작
        setShowStaminaModal(false);
        handleStartGame(selectedItemsRef.current, true);
        return;
      }
      if (action === 'shop') {
        setShowStaminaModal(false);
        navigate(urls.shop());
        return;
      }
      if (action === 'back') {
        navigate(-1);
        return;
      }
    },
    [handleStaminaAdRecovery, navigate, setShowStaminaModal, handleStartGame]
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
