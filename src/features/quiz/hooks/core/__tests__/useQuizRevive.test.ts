import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizRevive } from '@/features/quiz/hooks/core/useQuizRevive';
import type { InventoryItem } from '@/types/user';
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

    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:UI_MODAL_TOGGLE', {
      modal: 'lastChance',
      show: true,
    });
    expect(quizEventBus.emit).not.toHaveBeenCalledWith('QUIZ:GAME_OVER', expect.any(Object));
  });

  it('stableHandleGameOver should exit directly on manual exit', () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    act(() => {
      result.current.stableHandleGameOver('manual_exit');
    });

    expect(quizEventBus.emit).not.toHaveBeenCalledWith('QUIZ:UI_MODAL_TOGGLE', {
      modal: 'lastChance',
      show: true,
    });
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
    vi.mocked(quizEventBus.emit).mockClear();

    // Fail again
    act(() => {
      result.current.stableHandleGameOver('timeout');
    });

    expect(quizEventBus.emit).not.toHaveBeenCalledWith('QUIZ:UI_MODAL_TOGGLE', {
      modal: 'lastChance',
      show: true,
    });
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
    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:REVIVE_SUCCESS');
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
    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:UI_MODAL_TOGGLE', {
      modal: 'countdown',
      show: true,
    });
  });

  it('handleGiveUp should close modal and end game', () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    act(() => {
      result.current.handleGiveUp();
    });

    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:UI_MODAL_TOGGLE', {
      modal: 'lastChance',
      show: false,
    });
    expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:GAME_OVER', { reason: 'manual_exit' });
  });
});
