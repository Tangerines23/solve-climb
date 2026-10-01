import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupQuizEventListeners } from '../quizEventListener';
import { quizEventBus } from '@/lib/eventBus';
import { useToastStore } from '@/stores/useToastStore';
import { vibrateLong } from '@/utils/haptic';

vi.mock('@/lib/eventBus', () => ({
  quizEventBus: {
    on: vi.fn(),
  },
}));

vi.mock('@/stores/useToastStore', () => ({
  useToastStore: {
    getState: vi.fn(() => ({
      showToast: vi.fn(),
    })),
  },
}));

vi.mock('@/utils/haptic', () => ({
  vibrateLong: vi.fn(),
}));

describe('setupQuizEventListeners', () => {
  let unsubscribeSubmitted: () => void;
  let unsubscribeInvalidInput: () => void;
  let unsubscribeGameOver: () => void;
  let eventHandlers: Record<string, (payload: any) => void>;

  beforeEach(() => {
    unsubscribeSubmitted = vi.fn();
    unsubscribeInvalidInput = vi.fn();
    unsubscribeGameOver = vi.fn();
    eventHandlers = {};

    vi.mocked(quizEventBus.on).mockImplementation((event: string, handler: any) => {
      eventHandlers[event] = handler;
      if (event === 'QUIZ:ANSWER_SUBMITTED') return unsubscribeSubmitted;
      if (event === 'QUIZ:INVALID_INPUT') return unsubscribeInvalidInput;
      if (event === 'QUIZ:GAME_OVER') return unsubscribeGameOver;
      return vi.fn();
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('subscribes to QUIZ:ANSWER_SUBMITTED, QUIZ:INVALID_INPUT, QUIZ:GAME_OVER on quizEventBus', () => {
    setupQuizEventListeners();
    expect(quizEventBus.on).toHaveBeenCalledWith('QUIZ:ANSWER_SUBMITTED', expect.any(Function));
    expect(quizEventBus.on).toHaveBeenCalledWith('QUIZ:INVALID_INPUT', expect.any(Function));
    expect(quizEventBus.on).toHaveBeenCalledWith('QUIZ:GAME_OVER', expect.any(Function));
  });

  it('QUIZ:ANSWER_SUBMITTED handler triggers vibrateLong when isCorrect is false', () => {
    setupQuizEventListeners();
    const handler = eventHandlers['QUIZ:ANSWER_SUBMITTED'];
    expect(handler).toBeDefined();

    handler({ isCorrect: false });
    expect(vibrateLong).toHaveBeenCalledTimes(1);

    handler({ isCorrect: true });
    expect(vibrateLong).toHaveBeenCalledTimes(1); // Not called again
  });

  it('QUIZ:INVALID_INPUT handler calls showToast when reason is provided', () => {
    const showToastMock = vi.fn();
    vi.mocked(useToastStore.getState).mockReturnValue({
      showToast: showToastMock,
    } as unknown as ReturnType<typeof useToastStore.getState>);

    setupQuizEventListeners();
    const handler = eventHandlers['QUIZ:INVALID_INPUT'];
    expect(handler).toBeDefined();

    handler({ reason: '정답 범위를 초과했습니다.' });
    expect(showToastMock).toHaveBeenCalledWith('정답 범위를 초과했습니다.');

    handler({ reason: '' });
    expect(showToastMock).toHaveBeenCalledTimes(1); // Empty reason does not show toast
  });

  it('QUIZ:GAME_OVER handler calls showToast when reason is provided', () => {
    const showToastMock = vi.fn();
    vi.mocked(useToastStore.getState).mockReturnValue({
      showToast: showToastMock,
    } as unknown as ReturnType<typeof useToastStore.getState>);

    setupQuizEventListeners();
    const handler = eventHandlers['QUIZ:GAME_OVER'];
    expect(handler).toBeDefined();

    handler({ reason: '시간 초과!' });
    expect(showToastMock).toHaveBeenCalledWith('시간 초과!');
  });

  it('Cleanup: calling the returned cleanup function unsubscribes all 3 listeners', () => {
    const cleanup = setupQuizEventListeners();
    cleanup();

    expect(unsubscribeSubmitted).toHaveBeenCalled();
    expect(unsubscribeInvalidInput).toHaveBeenCalled();
    expect(unsubscribeGameOver).toHaveBeenCalled();
  });

  it('Idempotency: calling setupQuizEventListeners a second time triggers cleanup of the first registration', () => {
    setupQuizEventListeners();
    expect(unsubscribeSubmitted).not.toHaveBeenCalled();

    // Re-registering triggers previous cleanup
    setupQuizEventListeners();
    expect(unsubscribeSubmitted).toHaveBeenCalledTimes(1);
    expect(unsubscribeInvalidInput).toHaveBeenCalledTimes(1);
    expect(unsubscribeGameOver).toHaveBeenCalledTimes(1);
  });
});
