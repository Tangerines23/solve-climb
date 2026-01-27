import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  exportCustomPresets,
  importCustomPresets,
  getPresetHistories,
  savePresetHistory,
  clearPresetHistory,
  executeDebugAction,
  applyPreset,
  type CustomPreset,
  type PresetHistory,
  type DebugAction,
} from '../debugPresets';
import { supabase } from '../supabaseClient';
import { useUserStore as _useUserStore } from '../../stores/useUserStore';
import { useQuizStore as _useQuizStore } from '../../stores/useQuizStore';
import { calculateScoreForTier } from '../tierUtils';
import type { PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js';

// --- Typed Mock Builders ---
const createMockQueryBuilder = (returnValue: any = { data: null, error: null }) => {
  const builder: any = {};
  const mockReturn = Promise.resolve(returnValue);

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.single = vi.fn(() => mockReturn);
  builder.maybeSingle = vi.fn(() => mockReturn);
  builder.upsert = vi.fn(() => mockReturn);
  builder.update = vi.fn(() => builder);
  builder.delete = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);

  // Make builder thenable
  builder.then = (
    onfulfilled?: ((value: any) => any) | null,
    onrejected?: ((reason: any) => any) | null
  ) => {
    return mockReturn.then(onfulfilled, onrejected);
  };

  return builder as unknown as ReturnType<SupabaseClient['from']>;
};

// Mock dependencies
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
    },
    rpc: vi.fn(),
    from: vi.fn(() => createMockQueryBuilder()),
  },
}));

const mockGetUserStoreState = vi.fn();
vi.mock('../../stores/useUserStore', () => ({
  useUserStore: {
    getState: () => mockGetUserStoreState(),
  },
}));

const mockGetQuizStoreState = vi.fn();
vi.mock('../../stores/useQuizStore', () => ({
  useQuizStore: {
    getState: () => mockGetQuizStoreState(),
  },
}));

vi.mock('../tierUtils', () => ({
  calculateScoreForTier: vi.fn(() => Promise.resolve(2850000)),
}));

describe('debugPresets tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Default mocks
    mockGetUserStoreState.mockReturnValue({
      fetchUserData: vi.fn(() => Promise.resolve()),
      setMinerals: vi.fn(() => Promise.resolve()),
      setStamina: vi.fn(() => Promise.resolve()),
      debugSetMinerals: vi.fn(() => Promise.resolve()),
      debugSetStamina: vi.fn(() => Promise.resolve()),
    });
    mockGetQuizStoreState.mockReturnValue({
      setTimeLimit: vi.fn(),
    });
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);
  });

  describe('Custom Presets Management', () => {
    it('should return empty array when localStorage is empty', () => {
      expect(getCustomPresets()).toEqual([]);
    });

    it('should save and load custom presets', () => {
      const preset: CustomPreset = {
        id: 'p1',
        name: 'Preset 1',
        description: 'Desc',
        actions: [],
        isCustom: true,
      };
      saveCustomPreset(preset);
      expect(getCustomPresets()).toContainEqual(preset);
    });

    it('should handle corrupted JSON in localStorage', () => {
      localStorage.setItem('debug_custom_presets', 'corrupted');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(getCustomPresets()).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should delete custom presets', () => {
      const preset: CustomPreset = {
        id: 'p1',
        name: 'Preset 1',
        description: 'Desc',
        actions: [],
        isCustom: true,
      };
      saveCustomPreset(preset);
      deleteCustomPreset('p1');
      expect(getCustomPresets()).toEqual([]);
    });

    it('should export presets to JSON string', () => {
      const preset: CustomPreset = {
        id: 'p1',
        name: 'Preset 1',
        description: 'Desc',
        actions: [],
        isCustom: true,
      };
      saveCustomPreset(preset);
      const exported = exportCustomPresets();
      expect(JSON.parse(exported)).toHaveLength(1);
    });

    it('should import presets from JSON string', () => {
      const preset: CustomPreset = {
        id: 'imported',
        name: 'Imported',
        description: 'Desc',
        actions: [],
        isCustom: true,
      };
      importCustomPresets(JSON.stringify([preset]));
      expect(getCustomPresets()).toContainEqual(preset);
    });
  });

  describe('Preset History', () => {
    it('should save and retrieve history', () => {
      const history: PresetHistory = {
        id: 'h1',
        presetId: 'p1',
        presetName: 'Preset 1',
        appliedAt: new Date(),
        userId: 'u1',
        success: true,
      };
      savePresetHistory(history);
      expect(getPresetHistories()).toHaveLength(1);
    });

    it('should clear history', () => {
      savePresetHistory({ id: 'h1' } as any);
      clearPresetHistory();
      expect(getPresetHistories()).toHaveLength(0);
    });
  });

  describe('executeDebugAction', () => {
    const userId = 'test-user';

    it('should handle reset action', async () => {
      await executeDebugAction({ type: 'reset', target: 'all' }, userId);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'debug_reset_profile',
        expect.objectContaining({
          p_reset_type: 'all',
        })
      );
    });

    it('should handle setTier action', async () => {
      await executeDebugAction({ type: 'setTier', level: 5 }, userId);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'debug_set_tier',
        expect.objectContaining({
          p_level: 5,
        })
      );
    });

    it('should handle setMinerals action via store', async () => {
      const mockDebugSetMinerals = vi.fn();
      mockGetUserStoreState.mockReturnValue({ debugSetMinerals: mockDebugSetMinerals });
      await executeDebugAction({ type: 'setMinerals', value: 100 }, userId);
      expect(mockDebugSetMinerals).toHaveBeenCalledWith(100);
    });

    it('should handle grantAllItems action with multiple items', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({
          data: [{ id: 'item1' }, { id: 'item2' }],
          error: null,
        })
      );

      await executeDebugAction({ type: 'grantAllItems', quantity: 99 }, userId);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'debug_set_inventory_quantity',
        expect.objectContaining({
          p_item_id: 'item1',
          p_quantity: 99,
        })
      );
      expect(supabase.rpc).toHaveBeenCalledWith(
        'debug_set_inventory_quantity',
        expect.objectContaining({
          p_item_id: 'item2',
          p_quantity: 99,
        })
      );
    });

    it('should handle grantAllBadges action', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({
          data: [{ id: 'badge1' }],
          error: null,
        })
      );

      await executeDebugAction({ type: 'grantAllBadges' }, userId);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'debug_grant_badge',
        expect.objectContaining({
          p_badge_id: 'badge1',
        })
      );
    });

    it('should handle setGameTime action with active session', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({
          data: { id: 'session1' },
          error: null,
        })
      );

      await executeDebugAction({ type: 'setGameTime', seconds: 10 }, userId);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'debug_set_session_timer',
        expect.objectContaining({
          p_session_id: 'session1',
          p_seconds: 10,
        })
      );
    });

    it('should handle setGameTime action without active session (updates store)', async () => {
      // Mock maybeSingle to return null (no session)
      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({
          data: null,
          error: null,
        })
      );

      const mockSetTimeLimit = vi.fn();
      mockGetQuizStoreState.mockReturnValue({ setTimeLimit: mockSetTimeLimit });

      await executeDebugAction({ type: 'setGameTime', seconds: 30 }, userId);
      expect(mockSetTimeLimit).toHaveBeenCalledWith(60); // 30 maps to 60
    });
  });

  describe('applyPreset', () => {
    const userId = 'test-user';

    it('should apply newbie preset successfully', async () => {
      await applyPreset('newbie', userId);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'debug_reset_profile',
        expect.objectContaining({
          p_reset_type: 'all',
        })
      );
      expect(getPresetHistories()[0].success).toBe(true);
    });

    it('should apply veteran preset with dynamic score', async () => {
      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: [], error: null }));

      await applyPreset('veteran', userId);
      expect(calculateScoreForTier).toHaveBeenCalled();
      expect(supabase.rpc).toHaveBeenCalledWith(
        'debug_set_mastery_score',
        expect.objectContaining({
          p_score: 2850000,
        })
      );
    });

    it('should record failure in history when application fails', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: { message: 'Failed' } } as any);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(applyPreset('newbie', userId)).rejects.toThrow();
      expect(getPresetHistories()[0].success).toBe(false);

      consoleSpy.mockRestore();
    });
  });
});
