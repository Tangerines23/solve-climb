import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizRevive } from '../useQuizRevive';
import type { InventoryItem } from '../../types/user';
import { quizEventBus } from '@/lib/eventBus';

// Mock dependencies
vi.mock('@/lib/eventBus', () => ({
  quizEventBus: {
    emit: vi.fn(),
    on: vi.fn(),
  },
}));

describe('useQuizRevive', () => {
  const mockProps = {
    gameMode: 'survival' as const,
    inventory: [{ id: 1, code: 'flare', count: 1 }] as unknown as InventoryItem[], // flare for survival
    minerals: 1000,
    consumeItem: vi.fn().mockResolvedValue({ success: true }),
    setShowLastChanceModal: vi.fn(),
    setShowCountdown: vi.fn(),
    animations: { setIsError: vi.fn() } as unknown as any,
    setDisplayValue: vi.fn(),
    setIsSubmitting: vi.fn(),
    onWatchAd: vi.fn(),
    isPreview: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stableHandleGameOver should show modal on first failure', () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    act(() => {
      result.current.stableHandleGameOver('wrong_answer');
    });

    expect(mockProps.setShowLastChanceModal).toHaveBeenCalledWith(true);
    expect(quizEventBus.emit).not.toHaveBeenCalledWith('QUIZ:GAME_OVER', expect.any(Object));
  });

  it('stableHandleGameOver should exit directly on manual exit', () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    act(() => {
      result.current.stableHandleGameOver('manual_exit');
    });

    expect(mockProps.setShowLastChanceModal).not.toHaveBeenCalled();
    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:GAME_OVER', { reason: 'manual_exit' });
  });

  it('stableHandleGameOver should exit directly if revive already used', async () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    // Use revive first
    await act(async () => {
      await result.current.handleRevive(false);
    });

    expect(result.current.hasUsedLastChance).toBe(true);

    // Clear mock history from handleRevive
    mockProps.setShowLastChanceModal.mockClear();
    vi.mocked(quizEventBus.emit).mockClear();

    // Fail again
    act(() => {
      result.current.stableHandleGameOver('timeout');
    });

    expect(mockProps.setShowLastChanceModal).toHaveBeenCalledTimes(0);
    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:GAME_OVER', { reason: 'timeout' });
  });

  it('handleRevive should consume item if useItem is true', async () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    await act(async () => {
      await result.current.handleRevive(true);
    });

    expect(mockProps.consumeItem).toHaveBeenCalledWith(1); // flare id
    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:NEXT_QUESTION_REQUESTED');
  });

  it('handleRevive (Survival) should reset question state', async () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    await act(async () => {
      await result.current.handleRevive(false);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:NEXT_QUESTION_REQUESTED');
    expect(mockProps.animations.setIsError).toHaveBeenCalledWith(false);
    expect(mockProps.setDisplayValue).toHaveBeenCalledWith('');
  });

  it('handleRevive (Time Attack) should emit LAST_SPURT event', async () => {
    const timeAttackProps = {
      ...mockProps,
      gameMode: 'time-attack' as const,
      inventory: [{ id: 2, code: 'last_spurt', count: 1 }] as unknown as InventoryItem[],
    };

    const { result } = renderHook(() => useQuizRevive(timeAttackProps));

    await act(async () => {
      await result.current.handleRevive(false);
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:LAST_SPURT');
    expect(mockProps.setShowCountdown).toHaveBeenCalledWith(true);
  });

  it('handleGiveUp should close modal and end game', () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    act(() => {
      result.current.handleGiveUp();
    });

    expect(mockProps.setShowLastChanceModal).toHaveBeenCalledWith(false);
    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:GAME_OVER', { reason: 'manual_exit' });
  });
});
