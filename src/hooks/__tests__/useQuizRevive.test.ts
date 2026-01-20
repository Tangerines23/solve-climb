import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizRevive } from '../useQuizRevive';
import { useQuizStore, type QuizState } from '../../stores/useQuizStore';
import type { InventoryItem } from '../../types/user';

// Mock dependencies
vi.mock('../../stores/useQuizStore', () => ({
  useQuizStore: {
    getState: vi.fn(() => ({
      setTimeLimit: vi.fn(),
    })),
  },
}));

describe('useQuizRevive', () => {
  const mockProps = {
    gameMode: 'survival' as const,
    inventory: [{ id: 1, code: 'flare', count: 1 }] as unknown as InventoryItem[], // flare for survival
    minerals: 1000,
    consumeItem: vi.fn(),
    setShowLastChanceModal: vi.fn(),
    setTimerResetKey: vi.fn(),
    setShowCountdown: vi.fn(),
    generateNewQuestion: vi.fn(),
    animations: { setIsError: vi.fn() } as unknown as any,
    setDisplayValue: vi.fn(),
    handleGameOver: vi.fn(),
    setIsSubmitting: vi.fn(),
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
    expect(mockProps.handleGameOver).not.toHaveBeenCalled();
  });

  it('stableHandleGameOver should exit directly on manual exit', () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    act(() => {
      result.current.stableHandleGameOver('manual_exit');
    });

    expect(mockProps.setShowLastChanceModal).not.toHaveBeenCalled();
    expect(mockProps.handleGameOver).toHaveBeenCalledWith('manual_exit');
  });

  it('stableHandleGameOver should exit directly if revive already used', async () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    // Use revive first
    await act(async () => {
      await result.current.handleRevive(false);
    });

    expect(result.current.hasUsedLastChance).toBe(true);

    // Clear mock history from handleRevive (which calls setShowLastChanceModal(false))
    mockProps.setShowLastChanceModal.mockClear();

    // Fail again
    act(() => {
      result.current.stableHandleGameOver('timeout');
    });

    expect(mockProps.setShowLastChanceModal).toHaveBeenCalledTimes(0);
    expect(mockProps.handleGameOver).toHaveBeenCalledWith('timeout');
  });

  it('handleRevive should consume item if useItem is true', async () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    await act(async () => {
      await result.current.handleRevive(true);
    });

    expect(mockProps.consumeItem).toHaveBeenCalledWith(1); // flare id
    expect(mockProps.generateNewQuestion).toHaveBeenCalled();
  });

  it('handleRevive (Survival) should reset question state', async () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    await act(async () => {
      await result.current.handleRevive(false);
    });

    expect(mockProps.generateNewQuestion).toHaveBeenCalled();
    expect(mockProps.animations.setIsError).toHaveBeenCalledWith(false);
    expect(mockProps.setDisplayValue).toHaveBeenCalledWith('');
  });

  it('handleRevive (Time Attack) should add time', async () => {
    const timeAttackProps = {
      ...mockProps,
      gameMode: 'time-attack' as const,
      inventory: [{ id: 2, code: 'last_spurt', count: 1 }] as unknown as InventoryItem[],
    };
    const setTimeLimitMock = vi.fn();
    vi.mocked(useQuizStore.getState).mockReturnValue({
      setTimeLimit: setTimeLimitMock,
    } as unknown as QuizState);

    const { result } = renderHook(() => useQuizRevive(timeAttackProps));

    await act(async () => {
      await result.current.handleRevive(false);
    });

    expect(setTimeLimitMock).toHaveBeenCalledWith(15);
    expect(mockProps.setTimerResetKey).toHaveBeenCalled();
    expect(mockProps.setShowCountdown).toHaveBeenCalledWith(true);
  });

  it('handleGiveUp should close modal and end game', () => {
    const { result } = renderHook(() => useQuizRevive(mockProps));

    act(() => {
      result.current.handleGiveUp();
    });

    expect(mockProps.setShowLastChanceModal).toHaveBeenCalledWith(false);
    expect(mockProps.handleGameOver).toHaveBeenCalled();
  });
});
