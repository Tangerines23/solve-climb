import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizNavigation } from '../useQuizNavigation';
import { quizEventBus } from '@/lib/eventBus';
import { UI_MESSAGES } from '@/constants/ui';
import { Capacitor } from '@capacitor/core';

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

describe('useQuizNavigation', () => {
  const mockNavigate = vi.fn();
  const mockRefundStamina = vi.fn().mockResolvedValue({ success: true, message: 'ok' });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should immediately navigate and refund stamina when totalQuestions is 0', async () => {
    const { result } = renderHook(() =>
      useQuizNavigation({
        totalQuestions: 0,
        showTipModal: false,
        refundStamina: mockRefundStamina,
        navigate: mockNavigate,
        mountainParam: 'math',
        worldParam: 'World1',
        categoryParam: '기초',
        searchParams: new URLSearchParams(),
      })
    );

    act(() => {
      result.current.handleBack();
    });

    expect(mockRefundStamina).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('should navigate to home when challenge is today and totalQuestions is 0', () => {
    const { result } = renderHook(() =>
      useQuizNavigation({
        totalQuestions: 0,
        showTipModal: false,
        refundStamina: mockRefundStamina,
        navigate: mockNavigate,
        mountainParam: 'math',
        worldParam: 'World1',
        categoryParam: '기초',
        searchParams: new URLSearchParams('challenge=today'),
      })
    );

    act(() => {
      result.current.handleBack();
    });

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('should show exit confirmation on first back press during active game', () => {
    const { result } = renderHook(() =>
      useQuizNavigation({
        totalQuestions: 3,
        showTipModal: false,
        refundStamina: mockRefundStamina,
        navigate: mockNavigate,
        mountainParam: 'math',
        worldParam: 'World1',
        categoryParam: '기초',
        searchParams: new URLSearchParams(),
      })
    );

    act(() => {
      result.current.handleBack();
    });

    expect(result.current.showExitConfirm).toBe(true);
    expect(result.current.toastValue).toBe(UI_MESSAGES.BACK_NAV_CONFIRM);
  });

  it('should emit QUIZ:GAME_OVER on second back press within timeout', () => {
    const emitSpy = vi.spyOn(quizEventBus, 'emit');

    const { result } = renderHook(() =>
      useQuizNavigation({
        totalQuestions: 3,
        showTipModal: false,
        refundStamina: mockRefundStamina,
        navigate: mockNavigate,
        mountainParam: 'math',
        worldParam: 'World1',
        categoryParam: '기초',
        searchParams: new URLSearchParams(),
      })
    );

    act(() => {
      result.current.handleBack();
    });
    expect(result.current.showExitConfirm).toBe(true);

    act(() => {
      result.current.handleBack();
    });
    expect(emitSpy).toHaveBeenCalledWith('QUIZ:GAME_OVER', { reason: 'manual_exit' });
  });

  it('should reset exit confirmation after 3 seconds', () => {
    const { result } = renderHook(() =>
      useQuizNavigation({
        totalQuestions: 3,
        showTipModal: false,
        refundStamina: mockRefundStamina,
        navigate: mockNavigate,
        mountainParam: 'math',
        worldParam: 'World1',
        categoryParam: '기초',
        searchParams: new URLSearchParams(),
      })
    );

    act(() => {
      result.current.handleBack();
    });
    expect(result.current.showExitConfirm).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(result.current.showExitConfirm).toBe(false);
  });

  it('should cancel exit confirm when cancelExitConfirm is called', () => {
    const { result } = renderHook(() =>
      useQuizNavigation({
        totalQuestions: 3,
        showTipModal: false,
        refundStamina: mockRefundStamina,
        navigate: mockNavigate,
        mountainParam: 'math',
        worldParam: 'World1',
        categoryParam: '기초',
        searchParams: new URLSearchParams(),
      })
    );

    act(() => {
      result.current.handleBack();
    });
    expect(result.current.showExitConfirm).toBe(true);

    act(() => {
      result.current.cancelExitConfirm();
      vi.advanceTimersByTime(350);
    });
    expect(result.current.showExitConfirm).toBe(false);
  });

  it('should register and clean up popstate listener', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useQuizNavigation({
        totalQuestions: 2,
        showTipModal: false,
        refundStamina: mockRefundStamina,
        navigate: mockNavigate,
        mountainParam: 'math',
        worldParam: 'World1',
        categoryParam: '기초',
        searchParams: new URLSearchParams(),
      })
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
  });
});
