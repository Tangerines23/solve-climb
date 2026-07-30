import { quizEventBus } from '@/lib/eventBus';
import { useToastStore } from '@/stores/useToastStore';
import { vibrateLong } from '@/utils/haptic';

/**
 * 퀴즈 이벤트 리스너 등록 서비스
 * - QuizContext나 useQuizSubmit에 강결합되어 있던 사이드 이펙트(진동, Toast, 오답노트 저장)를
 *   이벤트 수신 방식으로 분리하여 구독합니다.
 */
export function setupQuizEventListeners(): () => void {
  const unsubscribers: Array<() => void> = [];

  // 1. 정답 제출 이벤트 수신 (사이드 이펙트: 햅틱 진동)
  const unsubscribeSubmitted = quizEventBus.on('QUIZ:ANSWER_SUBMITTED', ({ isCorrect }) => {
    if (!isCorrect) {
      // Haptic feedback (오답 진동)
      try {
        vibrateLong();
      } catch {
        // Ignore haptic errors on non-supported environments
      }
    }
  });
  unsubscribers.push(unsubscribeSubmitted);

  // 2. 잘못된 입력 이벤트 수신 (사이드 이펙트: Toast 표출)
  const unsubscribeInvalidInput = quizEventBus.on('QUIZ:INVALID_INPUT', ({ reason }) => {
    if (reason) {
      useToastStore.getState().showToast(reason);
    }
  });
  unsubscribers.push(unsubscribeInvalidInput);

  // 3. 게임 오버 이벤트 수신
  const unsubscribeGameOver = quizEventBus.on('QUIZ:GAME_OVER', ({ reason }) => {
    if (reason) {
      useToastStore.getState().showToast(reason);
    }
  });
  unsubscribers.push(unsubscribeGameOver);

  // cleanup 함수 반환
  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}
