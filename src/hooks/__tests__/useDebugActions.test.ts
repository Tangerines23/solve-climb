import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebugActions } from '../useDebugActions';
import type { DebugAction } from '../../types/debug';
import { supabase } from '../../utils/supabaseClient';
import { useUserStore } from '../../stores/useUserStore';
import type { Session } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('../../utils/supabaseClient', () => {
  const mockChain = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
    single: vi.fn(),
  };
  mockChain.select.mockReturnValue(mockChain);
  mockChain.eq.mockReturnValue(mockChain);
  mockChain.order.mockReturnValue(mockChain);
  mockChain.limit.mockReturnValue(mockChain);
  mockChain.single.mockReturnValue(mockChain);

  return {
    supabase: {
      rpc: vi.fn(),
      from: vi.fn(() => mockChain),
      auth: {
        getUser: vi.fn(),
      },
      ...mockChain,
    },
  };
});

vi.mock('../../stores/useUserStore', () => {
  const mockState = {
    userId: 'test-user',
    fetchUserData: vi.fn(),
    debugSetMinerals: vi.fn(),
    debugSetStamina: vi.fn(),
  };
  const mockStore = vi.fn((selector) => (selector ? selector(mockState) : mockState));
  vi.mocked(mockStore).getState = vi.fn(() => mockState);
  return { useUserStore: mockStore };
});

vi.mock('../../stores/useQuizStore', () => ({
  useQuizStore: vi.fn(() => ({
    setTimeLimit: vi.fn(),
  })),
}));

vi.mock('../../stores/useDailyRewardStore', () => ({
  useDailyRewardStore: vi.fn(() => ({
    checkDailyLogin: vi.fn(),
  })),
}));

vi.mock('../../stores/useNotificationStore', () => ({
  useNotificationStore: vi.fn(() => ({
    markAllAsRead: vi.fn(),
    setNotifications: vi.fn(),
  })),
}));

vi.mock('../../stores/useDebugStore', () => ({
  useDebugStore: vi.fn(() => ({
    setShowReturnFloater: vi.fn(),
    setBypassLevelLock: vi.fn(),
    setShowSafeAreaGuide: vi.fn(),
    setShowComponentBorders: vi.fn(),
    setNetworkLatency: vi.fn(),
    setForceNetworkError: vi.fn(),
  })),
}));

describe('useDebugActions hook', () => {
  const userId = 'test-user';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'test-user' } },
      error: null,
    } as unknown as { data: { user: { id: string } }; error: null });
  });

  describe('executeDebugAction', () => {
    it('should call debug_reset_profile for reset action', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null });
      const { result } = renderHook(() => useDebugActions());

      await act(async () => {
        await result.current.executeDebugAction({ type: 'reset', target: 'score' }, userId);
      });

      expect(supabase.rpc).toHaveBeenCalledWith(
        'debug_reset_profile',
        expect.objectContaining({
          p_reset_type: 'score',
        })
      );
    });

    it('should throw error if setTier level is missing', async () => {
      const { result } = renderHook(() => useDebugActions());
      await expect(
        result.current.executeDebugAction({ type: 'setTier' } as unknown as DebugAction, userId)
      ).rejects.toThrow('setTier action requires level');
    });

    it('should grant all items by calling rpc for each item', async () => {
      vi.mocked(supabase.from)().select.mockResolvedValueOnce({
        data: [{ id: 'item1' }, { id: 'item2' }],
        error: null,
      });
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useDebugActions());

      await act(async () => {
        await result.current.executeDebugAction({ type: 'grantAllItems', quantity: 5 }, userId);
      });

      expect(supabase.rpc).toHaveBeenCalledTimes(2);
    });

    it('should handle grantAllBadges with successes and failures', async () => {
      vi.mocked(supabase.from)().select.mockResolvedValueOnce({
        data: [{ id: 'badge1' }, { id: 'badge2' }],
        error: null,
      });
      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({ error: null })
        .mockRejectedValueOnce(new Error('Bad error'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useDebugActions());

      await act(async () => {
        await result.current.executeDebugAction({ type: 'grantAllBadges' }, userId);
      });

      expect(supabase.rpc).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('applyPreset', () => {
    it('should sequentially execute actions in a preset', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null });
      const userStore = useUserStore.getState();
      const fetchSpy = vi.spyOn(userStore, 'fetchUserData').mockResolvedValue();

      const { result } = renderHook(() => useDebugActions());

      await act(async () => {
        await result.current.applyPreset('newbie');
      });

      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should throw error for unknown preset', async () => {
      const { result } = renderHook(() => useDebugActions());
      await expect(result.current.applyPreset('invalid')).rejects.toThrow('Preset not found');
    });

    it('should handle veteran preset with dynamic mastery score', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null });
      const userStore = useUserStore.getState();
      vi.spyOn(userStore, 'fetchUserData').mockResolvedValue();

      const { result } = renderHook(() => useDebugActions());

      await act(async () => {
        await result.current.applyPreset('veteran');
      });

      expect(supabase.rpc).toHaveBeenCalledWith('debug_set_mastery_score', expect.any(Object));
    });
  });

  describe('executeDebugAction - missing cases', () => {
    it('should handle setTier, setMinerals, setStamina', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null });
      const userStore = useUserStore.getState();
      const mineralSpy = vi.spyOn(userStore, 'debugSetMinerals').mockResolvedValue();
      const staminaSpy = vi.spyOn(userStore, 'debugSetStamina').mockResolvedValue();

      const { result } = renderHook(() => useDebugActions());

      await act(async () => {
        await result.current.executeDebugAction({ type: 'setTier', level: 5 }, userId);
      });
      expect(supabase.rpc).toHaveBeenCalledWith('debug_set_tier', {
        p_user_id: userId,
        p_level: 5,
      });

      await act(async () => {
        await result.current.executeDebugAction({ type: 'setMinerals', value: 100 }, userId);
      });
      expect(mineralSpy).toHaveBeenCalledWith(100);

      await act(async () => {
        await result.current.executeDebugAction({ type: 'setStamina', value: 10 }, userId);
      });
      expect(staminaSpy).toHaveBeenCalledWith(10);
    });

    it('should handle setGameTime with active session', async () => {
      vi.mocked(supabase.from)().select.mockReturnThis();
      vi.mocked(supabase.from)().eq.mockReturnThis();
      vi.mocked(supabase.from)().order.mockReturnThis();
      vi.mocked(supabase.from)().limit.mockReturnThis();
      vi.mocked(supabase.from)().maybeSingle.mockResolvedValue({
        data: { id: 'session1' },
        error: null,
      });
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useDebugActions());

      await act(async () => {
        await result.current.executeDebugAction({ type: 'setGameTime', seconds: 30 }, userId);
      });

      expect(supabase.rpc).toHaveBeenCalledWith('debug_set_session_timer', {
        p_session_id: 'session1',
        p_seconds: 30,
      });
    });
  });
});
