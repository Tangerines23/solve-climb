import { renderHook, act } from '@testing-library/react';
import { useQuizRevive } from '../useQuizRevive';
import { quizEventBus } from '@/lib/eventBus';
import { sound } from '@/utils/sound';
import { vi } from 'vitest';

vi.mock('@/lib/eventBus', () => ({
  quizEventBus: {
    emit: vi.fn(),
    on: vi.fn(),
  },
}));

vi.mock('@/utils/sound', () => ({
  sound: {
    playRevive: vi.fn(),
  },
}));

const mockPurchaseItem = vi.fn();
vi.mock('@/stores/useUserStore', () => ({
  useUserStore: {
    getState: () => ({
      purchaseItem: mockPurchaseItem,
    }),
  },
}));

describe('useQuizRevive', () => {
  const params: UseQuizReviveParams = {
    gameMode: 'survival',
    inventory: [{ id: 1, code: 'flare', name: 'Flare', quantity: 1 }],
    minerals: 5000,
    consumeItem: vi.fn().mockResolvedValue({ success: true, message: 'Item consumed' }),
    onWatchAd: vi.fn(),
    isPreview: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('stableHandleGameOver', () => {
    it('shows modal on failure when hasUsedLastChance is false and isPreview is false', () => {
      const { result } = renderHook(() => useQuizRevive(params));
      result.current.stableHandleGameOver();
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:UI_MODAL_TOGGLE', {
        modal: 'lastChance',
        show: true,
      });
    });

    it('skips modal on "manual_exit"', () => {
      const { result } = renderHook(() => useQuizRevive(params));
      result.current.stableHandleGameOver('manual_exit');
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:GAME_OVER', { reason: 'manual_exit' });
    });

    it('skips modal when isPreview is true', () => {
      const { result } = renderHook(() => useQuizRevive({ ...params, isPreview: true }));
      result.current.stableHandleGameOver('timeout');
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:GAME_OVER', { reason: 'timeout' });
    });

    it('skips modal when hasUsedLastChance is true', async () => {
      const { result } = renderHook(() => useQuizRevive(params));
      await act(async () => {
        await result.current.handleRevive(false);
      });
      vi.mocked(quizEventBus.emit).mockClear();
      result.current.stableHandleGameOver('timeout');
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:GAME_OVER', { reason: 'timeout' });
    });
  });

  describe('handleRevive', () => {
    it('consumes item when useItem=true and item exists in inventory', async () => {
      const { result } = renderHook(() => useQuizRevive(params));
      await act(async () => {
        await result.current.handleRevive(true);
      });
      expect(params.consumeItem).toHaveBeenCalledWith(1);
    });

    it('skips consumeItem when useItem=true but item is NOT in inventory', async () => {
      const { result } = renderHook(() => useQuizRevive({ ...params, inventory: [] }));
      await act(async () => {
        await result.current.handleRevive(true);
      });
      expect(params.consumeItem).not.toHaveBeenCalled();
    });

    it('in survival mode: emits "QUIZ:NEXT_QUESTION_REQUESTED", "QUIZ:REVIVE_SUCCESS", countdown toggle', async () => {
      const { result } = renderHook(() => useQuizRevive(params));
      await act(async () => {
        await result.current.handleRevive(false);
      });
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:NEXT_QUESTION_REQUESTED');
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:REVIVE_SUCCESS');
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:UI_MODAL_TOGGLE', {
        modal: 'countdown',
        show: true,
      });
    });

    it('in time-attack mode: emits "QUIZ:LAST_SPURT", "QUIZ:REVIVE_SUCCESS", countdown toggle', async () => {
      const { result } = renderHook(() => useQuizRevive({ ...params, gameMode: 'time-attack' }));
      await act(async () => {
        await result.current.handleRevive(false);
      });
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:LAST_SPURT');
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:REVIVE_SUCCESS');
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:UI_MODAL_TOGGLE', {
        modal: 'countdown',
        show: true,
      });
    });

    it('plays revive sound: sound.playRevive()', async () => {
      const { result } = renderHook(() => useQuizRevive(params));
      await act(async () => {
        await result.current.handleRevive(false);
      });
      expect(sound.playRevive).toHaveBeenCalled();
    });

    it('sets hasUsedLastChance to true', async () => {
      const { result } = renderHook(() => useQuizRevive(params));
      await act(async () => {
        await result.current.handleRevive(false);
      });
      expect(result.current.hasUsedLastChance).toBe(true);
    });
  });

  describe('handlePurchaseAndRevive', () => {
    it('survival mode with minerals >= 3000: calls mockPurchaseItem(4), params.consumeItem(4), and handleRevive', async () => {
      const { result } = renderHook(() =>
        useQuizRevive({ ...params, gameMode: 'survival', minerals: 3000 })
      );
      await act(async () => {
        await result.current.handlePurchaseAndRevive();
      });
      expect(mockPurchaseItem).toHaveBeenCalledWith(4);
      expect(params.consumeItem).toHaveBeenCalledWith(4);
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:REVIVE_SUCCESS');
      expect(result.current.hasUsedLastChance).toBe(true);
    });

    it('time-attack mode with minerals >= 1600: calls mockPurchaseItem(202), params.consumeItem(202), and handleRevive', async () => {
      const { result } = renderHook(() =>
        useQuizRevive({ ...params, gameMode: 'time-attack', minerals: 1600 })
      );
      await act(async () => {
        await result.current.handlePurchaseAndRevive();
      });
      expect(mockPurchaseItem).toHaveBeenCalledWith(202);
      expect(params.consumeItem).toHaveBeenCalledWith(202);
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:REVIVE_SUCCESS');
      expect(result.current.hasUsedLastChance).toBe(true);
    });

    it('with insufficient minerals (e.g. 500): does NOT call purchaseItem or consumeItem', async () => {
      const { result } = renderHook(() => useQuizRevive({ ...params, minerals: 500 }));
      await act(async () => {
        await result.current.handlePurchaseAndRevive();
      });
      expect(mockPurchaseItem).not.toHaveBeenCalled();
      expect(params.consumeItem).not.toHaveBeenCalled();
    });

    it('when mockPurchaseItem rejects: catches error and still proceeds to revive', async () => {
      mockPurchaseItem.mockRejectedValueOnce(new Error('Purchase failed'));
      const { result } = renderHook(() =>
        useQuizRevive({ ...params, gameMode: 'survival', minerals: 3000 })
      );
      await act(async () => {
        await result.current.handlePurchaseAndRevive();
      });
      expect(mockPurchaseItem).toHaveBeenCalledWith(4);
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:REVIVE_SUCCESS');
      expect(result.current.hasUsedLastChance).toBe(true);
    });
  });

  describe('handleWatchAdAndRevive', () => {
    it('calls onWatchAd callback', async () => {
      const { result } = renderHook(() => useQuizRevive(params));
      await act(async () => {
        await result.current.handleWatchAdAndRevive();
      });
      expect(params.onWatchAd).toHaveBeenCalled();
    });
  });

  describe('handleGiveUp', () => {
    it('closes lastChance modal and emits "QUIZ:GAME_OVER" with reason "manual_exit"', () => {
      const { result } = renderHook(() => useQuizRevive(params));
      result.current.handleGiveUp();
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:UI_MODAL_TOGGLE', {
        modal: 'lastChance',
        show: false,
      });
      expect(quizEventBus.emit).toHaveBeenCalledWith('QUIZ:GAME_OVER', { reason: 'manual_exit' });
    });
  });
});
