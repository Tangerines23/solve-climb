import { useState, useEffect, useRef, useCallback } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { urls } from '@/utils/navigation';
import { Category } from '@/types/quiz';
import { UI_MESSAGES } from '@/constants/ui';

interface UseQuizNavigationProps {
  totalQuestions: number;
  showTipModal: boolean;
  refundStamina: () => Promise<{ success: boolean; message: string }>;
  navigate: NavigateFunction;
  smartHandleGameOver: (reason?: string) => void;
  mountainParam: string | null;
  worldParam: string | null;
  categoryParam: string | null;
  searchParams: URLSearchParams;
}

export function useQuizNavigation({
  totalQuestions,
  showTipModal,
  refundStamina,
  navigate,
  smartHandleGameOver,
  mountainParam,
  worldParam,
  categoryParam,
  searchParams,
}: UseQuizNavigationProps) {
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [toastValue, setToastValue] = useState('');

  const showExitConfirmRef = useRef(false);
  const exitConfirmTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleBack = useCallback(() => {
    // 1. 아직 한 문제도 풀지 않았거나 팁 화면인 경우, 확인 없이 바로 섹션 선택으로 이동
    if (totalQuestions === 0 || showTipModal) {
      if (exitConfirmTimeoutRef.current) clearTimeout(exitConfirmTimeoutRef.current);

      // 환불 로직 실행
      refundStamina().catch(console.error);

      // 오늘의 챌린지인 경우 홈으로 이동
      const isTodayChallenge = searchParams.get('challenge') === 'today';
      if (isTodayChallenge) {
        navigate(urls.home(), { replace: true });
        return;
      }

      // 이전 선택 화면으로 이동
      if (mountainParam && worldParam && categoryParam) {
        navigate(
          urls.levelSelect({
            mountain: mountainParam,
            world: worldParam,
            category: categoryParam as Category,
          }),
          { replace: true }
        );
      } else {
        navigate(urls.home(), { replace: true });
      }
      return;
    }

    // 2. 게임 도중인 경우 안전 장치(2번 누르기) 작동
    if (showExitConfirmRef.current) {
      if (exitConfirmTimeoutRef.current) clearTimeout(exitConfirmTimeoutRef.current);
      smartHandleGameOver('manual_exit');
    } else {
      setToastValue(UI_MESSAGES.BACK_NAV_CONFIRM);
      setShowExitConfirm(true);
      showExitConfirmRef.current = true;
      setTimeout(() => setIsFadingOut(true), 2500);
      exitConfirmTimeoutRef.current = setTimeout(() => {
        setShowExitConfirm(false);
        showExitConfirmRef.current = false;
        setIsFadingOut(false);
      }, 3000);
    }
  }, [
    totalQuestions,
    showTipModal,
    refundStamina,
    mountainParam,
    worldParam,
    categoryParam,
    navigate,
    smartHandleGameOver,
    searchParams,
  ]);

  // 브라우저 뒤로가기 가로채기 및 UI 뒤로가기(handleBack)와 동기화
  useEffect(() => {
    // 빌드 타임 혹은 초기 팁 화면에서는 가로채지 않음 (자유로운 이탈 허용)
    if (showTipModal) return;

    // 퀴즈 진행 중일 때만 히스토리 스택에 더미 상태 추가
    window.history.pushState({ protected: true }, '', window.location.href);

    const handlePopState = () => {
      // popstate가 발생했다는 것은 브라우저가 이미 한 단계 뒤로 이동했다는 뜻 (dummy -> original)
      handleBack();
      // 강제로 다시 dummy를 밀어넣어 페이지 유지
      window.history.pushState({ protected: true }, '', window.location.href);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handleBack, showTipModal]);

  return {
    showExitConfirm,
    isFadingOut,
    toastValue,
    setToastValue,
    handleBack,
  };
}
