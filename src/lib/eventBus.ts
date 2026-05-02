import { Category, World } from '@/types/quiz';

/**
 * 전역 퀴즈 이벤트 타입 정의
 */
export type QuizEventMap = {
  // 정답 제출 이벤트
  'QUIZ:ANSWER_SUBMITTED': {
    questionId: string;
    category: Category;
    world: World;
    isCorrect: boolean;
    answer: string;
    score: number;
    combo: number;
    timestamp: number;
    solveTime: number;
  };

  // 제출 시작 이벤트
  'QUIZ:SUBMISSION_STARTED': void;

  // 잘못된 입력 이벤트 (범위 초과 등)
  'QUIZ:INVALID_INPUT': {
    answer: string;
    reason?: string;
  };

  // 레벨 진행 상황 업데이트 이벤트 (서버 동기화 성공 시)
  'LEVEL:PROGRESS_UPDATED': {
    levelId: string;
    newProgress: number;
    isCleared: boolean;
  };

  // 게임 종료 이벤트
  'QUIZ:GAME_OVER': {
    reason?: string;
  };

  // 다음 문제 요청 이벤트
  'QUIZ:NEXT_QUESTION_REQUESTED': void;

  // 페널티 발생 이벤트 (시간 차감 등)
  'QUIZ:PENALTY': {
    amount: number;
  };

  // 특수 아이템/기능 사용 이벤트
  'QUIZ:SAFETY_ROPE_USED': void;
  'QUIZ:LAST_SPURT': void;

  // 타이머 종료 이벤트
  'QUIZ:TIMER_UP': void;

  // 문제 생성 완료 이벤트
  'QUIZ:QUESTION_GENERATED': {
    question: any;
    questionId: string;
  };

  // 카운트다운 완료 이벤트
  'QUIZ:COUNTDOWN_COMPLETE': void;

  // UI 상태 토글 이벤트
  'QUIZ:UI_MODAL_TOGGLE': {
    modal:
      | 'lastChance'
      | 'countdown'
      | 'safetyRope'
      | 'tip'
      | 'pause'
      | 'stamina'
      | 'tutorial'
      | 'promise';
    show: boolean;
  };

  // 부활 성공 이벤트
  'QUIZ:REVIVE_SUCCESS': void;
};

type Handler<T = any> = (data: T) => void;

/**
 * 경량 타입 세이프 이벤트 버스
 */
class EventBus<Events extends Record<string, any>> {
  private handlers: Map<keyof Events, Set<Handler>> = new Map();

  /**
   * 이벤트 구독
   */
  on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);

    // Unsubscribe function
    return () => this.off(type, handler);
  }

  /**
   * 이벤트 구독 해제
   */
  off<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void {
    const set = this.handlers.get(type);
    if (set) {
      set.delete(handler);
    }
  }

  /**
   * 이벤트 발행
   */
  emit<Key extends keyof Events>(
    type: Key,
    ...args: Events[Key] extends void ? [] : [Events[Key]]
  ): void {
    const data = args[0];
    const set = this.handlers.get(type);
    if (set) {
      set.forEach((handler) => handler(data));
    }
  }

  /**
   * 모든 핸들러 제거 (테스트 용도)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// 싱글톤 인스턴스 수출
export const quizEventBus = new EventBus<QuizEventMap>();
