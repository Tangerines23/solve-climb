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
  debugPresets,
  executeDebugAction,
  applyPreset,
  type CustomPreset,
  type PresetHistory,
  type DebugAction,
} from '../debugPresets';
import { supabase } from '../supabaseClient';
import { useUserStore } from '../../stores/useUserStore';
import { useQuizStore } from '../../stores/useQuizStore';
import { calculateScoreForTier } from '../tierUtils';

// Mock dependencies for executeDebugAction and applyPreset tests
vi.mock('../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
    },
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
      })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
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

vi.mock('../errorHandler', () => ({
  logError: vi.fn(),
}));

describe('debugPresets - Custom Presets', () => {
  beforeEach(() => {
    // 각 테스트 전 localStorage 초기화
    localStorage.clear();
  });

  describe('getCustomPresets', () => {
    it('should return empty array when localStorage is empty', () => {
      const presets = getCustomPresets();
      expect(presets).toEqual([]);
    });

    it('should return saved custom presets', () => {
      const preset: CustomPreset = {
        id: 'test-preset',
        name: 'Test Preset',
        description: 'Test Description',
        actions: [{ type: 'setTier', level: 5 }],
        isCustom: true,
      };

      saveCustomPreset(preset);
      const presets = getCustomPresets();

      expect(presets).toHaveLength(1);
      expect(presets[0]).toEqual(preset);
      expect(presets[0].isCustom).toBe(true);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('debug_custom_presets', 'invalid json');
      const presets = getCustomPresets();
      expect(presets).toEqual([]);
    });
  });

  describe('saveCustomPreset', () => {
    it('should save a new custom preset', () => {
      const preset: CustomPreset = {
        id: 'new-preset',
        name: 'New Preset',
        description: 'Description',
        actions: [{ type: 'setMinerals', value: 1000 }],
        isCustom: true,
      };

      saveCustomPreset(preset);
      const presets = getCustomPresets();

      expect(presets).toHaveLength(1);
      expect(presets[0].id).toBe('new-preset');
    });

    it('should update existing preset when id matches', () => {
      const preset1: CustomPreset = {
        id: 'same-id',
        name: 'Original',
        description: 'Original Desc',
        actions: [{ type: 'setTier', level: 1 }],
        isCustom: true,
      };

      const preset2: CustomPreset = {
        id: 'same-id',
        name: 'Updated',
        description: 'Updated Desc',
        actions: [{ type: 'setTier', level: 2 }],
        isCustom: true,
      };

      saveCustomPreset(preset1);
      saveCustomPreset(preset2);

      const presets = getCustomPresets();
      expect(presets).toHaveLength(1);
      expect(presets[0].name).toBe('Updated');
      expect(presets[0].actions[0]).toEqual({ type: 'setTier', level: 2 });
    });

    it('should throw error on localStorage failure', () => {
      // localStorage.setItem을 모킹하여 에러 발생시키기
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      const preset: CustomPreset = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        actions: [],
        isCustom: true,
      };

      expect(() => saveCustomPreset(preset)).toThrow();

      // 원상복구
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('deleteCustomPreset', () => {
    it('should delete existing preset', () => {
      const preset: CustomPreset = {
        id: 'to-delete',
        name: 'To Delete',
        description: 'Desc',
        actions: [],
        isCustom: true,
      };

      saveCustomPreset(preset);
      expect(getCustomPresets()).toHaveLength(1);

      deleteCustomPreset('to-delete');
      expect(getCustomPresets()).toHaveLength(0);
    });

    it('should not throw error when deleting non-existent preset', () => {
      expect(() => deleteCustomPreset('non-existent')).not.toThrow();
      expect(getCustomPresets()).toHaveLength(0);
    });

    it('should only delete the specified preset', () => {
      const preset1: CustomPreset = {
        id: 'preset-1',
        name: 'Preset 1',
        description: 'Desc',
        actions: [],
        isCustom: true,
      };

      const preset2: CustomPreset = {
        id: 'preset-2',
        name: 'Preset 2',
        description: 'Desc',
        actions: [],
        isCustom: true,
      };

      saveCustomPreset(preset1);
      saveCustomPreset(preset2);

      deleteCustomPreset('preset-1');

      const presets = getCustomPresets();
      expect(presets).toHaveLength(1);
      expect(presets[0].id).toBe('preset-2');
    });
  });

  describe('exportCustomPresets', () => {
    it('should export empty array when no presets exist', () => {
      const exported = exportCustomPresets();
      const parsed = JSON.parse(exported);
      expect(parsed).toEqual([]);
    });

    it('should export all custom presets as JSON', () => {
      const preset1: CustomPreset = {
        id: 'export-1',
        name: 'Export 1',
        description: 'Desc 1',
        actions: [{ type: 'setTier', level: 1 }],
        isCustom: true,
      };

      const preset2: CustomPreset = {
        id: 'export-2',
        name: 'Export 2',
        description: 'Desc 2',
        actions: [{ type: 'setMinerals', value: 500 }],
        isCustom: true,
      };

      saveCustomPreset(preset1);
      saveCustomPreset(preset2);

      const exported = exportCustomPresets();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe('export-1');
      expect(parsed[1].id).toBe('export-2');
    });
  });

  describe('importCustomPresets', () => {
    it('should import valid preset array', () => {
      const preset: CustomPreset = {
        id: 'imported',
        name: 'Imported',
        description: 'Desc',
        actions: [{ type: 'setTier', level: 3 }],
        isCustom: true,
      };

      const json = JSON.stringify([preset]);
      importCustomPresets(json);

      const presets = getCustomPresets();
      expect(presets).toHaveLength(1);
      expect(presets[0].id).toBe('imported');
      expect(presets[0].isCustom).toBe(true);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => importCustomPresets('invalid json')).toThrow();
    });

    it('should throw error when JSON is not an array', () => {
      const json = JSON.stringify({ id: 'not-array' });
      expect(() => importCustomPresets(json)).toThrow('Invalid preset format: must be an array');
    });

    it('should throw error when preset is missing required fields', () => {
      const invalidPreset = { id: 'invalid' }; // name, actions 누락
      const json = JSON.stringify([invalidPreset]);
      expect(() => importCustomPresets(json)).toThrow('Invalid preset format');
    });

    it('should merge with existing presets without duplicates', () => {
      const existing: CustomPreset = {
        id: 'existing',
        name: 'Existing',
        description: 'Desc',
        actions: [],
        isCustom: true,
      };

      const imported: CustomPreset = {
        id: 'imported',
        name: 'Imported',
        description: 'Desc',
        actions: [],
        isCustom: true,
      };

      saveCustomPreset(existing);
      importCustomPresets(JSON.stringify([imported]));

      const presets = getCustomPresets();
      expect(presets).toHaveLength(2);
    });

    it('should not duplicate presets with same id', () => {
      const preset: CustomPreset = {
        id: 'duplicate',
        name: 'Original',
        description: 'Desc',
        actions: [],
        isCustom: true,
      };

      saveCustomPreset(preset);
      importCustomPresets(JSON.stringify([preset]));

      const presets = getCustomPresets();
      expect(presets).toHaveLength(1);
    });

    it('should automatically add isCustom flag to imported presets', () => {
      const presetWithoutFlag = {
        id: 'no-flag',
        name: 'No Flag',
        description: 'Desc',
        actions: [],
        // isCustom 없음
      };

      importCustomPresets(JSON.stringify([presetWithoutFlag]));

      const presets = getCustomPresets();
      expect(presets[0].isCustom).toBe(true);
    });
  });
});

describe('debugPresets - Preset History', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('savePresetHistory and getPresetHistories', () => {
    it('should save and retrieve preset history', () => {
      const history: PresetHistory = {
        id: 'history-1',
        presetId: 'test-preset',
        presetName: 'Test Preset',
        appliedAt: new Date('2024-01-01'),
        userId: 'user-1',
        success: true,
      };

      savePresetHistory(history);
      const histories = getPresetHistories();

      expect(histories).toHaveLength(1);
      expect(histories[0].id).toBe('history-1');
      expect(histories[0].appliedAt).toBeInstanceOf(Date);
    });

    it('should maintain history order (newest first)', () => {
      const history1: PresetHistory = {
        id: 'history-1',
        presetId: 'preset-1',
        presetName: 'Preset 1',
        appliedAt: new Date('2024-01-01'),
        userId: 'user-1',
        success: true,
      };

      const history2: PresetHistory = {
        id: 'history-2',
        presetId: 'preset-2',
        presetName: 'Preset 2',
        appliedAt: new Date('2024-01-02'),
        userId: 'user-1',
        success: true,
      };

      savePresetHistory(history1);
      savePresetHistory(history2);

      const histories = getPresetHistories();
      expect(histories[0].id).toBe('history-2'); // 가장 최근 것
      expect(histories[1].id).toBe('history-1');
    });

    it('should limit history to MAX_HISTORY_COUNT (50)', () => {
      // 51개의 히스토리 생성
      for (let i = 0; i < 51; i++) {
        const history: PresetHistory = {
          id: `history-${i}`,
          presetId: 'preset',
          presetName: 'Preset',
          appliedAt: new Date(),
          userId: 'user-1',
          success: true,
        };
        savePresetHistory(history);
      }

      const histories = getPresetHistories();
      expect(histories).toHaveLength(50);
      // 가장 오래된 것은 제거되어야 함
      expect(histories[histories.length - 1].id).toBe('history-1');
    });

    it('should handle error history', () => {
      const history: PresetHistory = {
        id: 'error-history',
        presetId: 'failed-preset',
        presetName: 'Failed Preset',
        appliedAt: new Date(),
        userId: 'user-1',
        success: false,
        error: 'Some error occurred',
      };

      savePresetHistory(history);
      const histories = getPresetHistories();

      expect(histories[0].success).toBe(false);
      expect(histories[0].error).toBe('Some error occurred');
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('debug_preset_history', 'invalid json');
      const histories = getPresetHistories();
      expect(histories).toEqual([]);
    });
  });

  describe('clearPresetHistory', () => {
    it('should clear all preset history', () => {
      const history: PresetHistory = {
        id: 'history-1',
        presetId: 'preset',
        presetName: 'Preset',
        appliedAt: new Date(),
        userId: 'user-1',
        success: true,
      };

      savePresetHistory(history);
      expect(getPresetHistories()).toHaveLength(1);

      clearPresetHistory();
      expect(getPresetHistories()).toHaveLength(0);
    });
  });
});

describe('debugPresets - Default Presets', () => {
  it('should have predefined presets', () => {
    expect(debugPresets.length).toBeGreaterThan(0);
  });

  it('should have preset with id "newbie"', () => {
    const newbie = debugPresets.find((p) => p.id === 'newbie');
    expect(newbie).toBeDefined();
    expect(newbie?.name).toBe('뉴비 세팅');
  });

  it('should have preset with id "veteran"', () => {
    const veteran = debugPresets.find((p) => p.id === 'veteran');
    expect(veteran).toBeDefined();
    expect(veteran?.actions.some((a) => a.type === 'setMasteryScore' && a.value === -1)).toBe(true);
  });

  it('should have preset with id "crisis"', () => {
    const crisis = debugPresets.find((p) => p.id === 'crisis');
    expect(crisis).toBeDefined();
    expect(crisis?.description).toContain('엣지 케이스');
  });

  it('should have all presets with required fields', () => {
    debugPresets.forEach((preset) => {
      expect(preset.id).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.description).toBeDefined();
      expect(Array.isArray(preset.actions)).toBe(true);
    });
  });
});

describe('debugPresets - executeDebugAction', () => {
  const userId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset mocks to default
    mockGetUserStoreState.mockReturnValue({
      fetchUserData: vi.fn(() => Promise.resolve()),
      setMinerals: vi.fn(() => Promise.resolve()),
      setStamina: vi.fn(() => Promise.resolve()),
    });
    mockGetQuizStoreState.mockReturnValue({
      setTimeLimit: vi.fn(),
    });
    // Reset supabase.from mock
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    } as any);
  });

  describe('reset action', () => {
    it('should execute reset action with target "all"', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);

      const action: DebugAction = { type: 'reset', target: 'all' };
      await executeDebugAction(action, userId);

      expect(supabase.rpc).toHaveBeenCalledWith('debug_reset_profile', {
        p_user_id: userId,
        p_reset_type: 'all',
      });
    });

    it('should execute reset action with target "score"', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);

      const action: DebugAction = { type: 'reset', target: 'score' };
      await executeDebugAction(action, userId);

      expect(supabase.rpc).toHaveBeenCalledWith('debug_reset_profile', {
        p_user_id: userId,
        p_reset_type: 'score',
      });
    });

    it('should execute reset action with default target "all"', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);

      const action: DebugAction = { type: 'reset' };
      await executeDebugAction(action, userId);

      expect(supabase.rpc).toHaveBeenCalledWith('debug_reset_profile', {
        p_user_id: userId,
        p_reset_type: 'all',
      });
    });

    it('should execute reset action with target "minerals"', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);

      const action: DebugAction = { type: 'reset', target: 'minerals' };
      await executeDebugAction(action, userId);

      expect(supabase.rpc).toHaveBeenCalledWith('debug_reset_profile', {
        p_user_id: userId,
        p_reset_type: 'minerals',
      });
    });

    it('should execute reset action with target "tier"', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);

      const action: DebugAction = { type: 'reset', target: 'tier' };
      await executeDebugAction(action, userId);

      expect(supabase.rpc).toHaveBeenCalledWith('debug_reset_profile', {
        p_user_id: userId,
        p_reset_type: 'tier',
      });
    });

    it('should throw error when reset fails', async () => {
      const error = { message: 'Reset failed' };
      vi.mocked(supabase.rpc).mockResolvedValue({ error } as never);

      const action: DebugAction = { type: 'reset', target: 'all' };
      await expect(executeDebugAction(action, userId)).rejects.toEqual(error);
    });
  });

  describe('setTier action', () => {
    it('should execute setTier action with valid level', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);

      const action: DebugAction = { type: 'setTier', level: 3 };
      await executeDebugAction(action, userId);

      expect(supabase.rpc).toHaveBeenCalledWith('debug_set_tier', {
        p_user_id: userId,
        p_level: 3,
      });
    });

    it('should throw error when level is undefined', async () => {
      const action: DebugAction = { type: 'setTier' };
      await expect(executeDebugAction(action, userId)).rejects.toThrow(
        'setTier action requires level'
      );
    });

    it('should throw error when setTier fails', async () => {
      const error = { message: 'Set tier failed' };
      vi.mocked(supabase.rpc).mockResolvedValue({ error } as never);

      const action: DebugAction = { type: 'setTier', level: 3 };
      await expect(executeDebugAction(action, userId)).rejects.toEqual(error);
    });
  });

  describe('setMasteryScore action', () => {
    it('should execute setMasteryScore action with valid value', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);

      const action: DebugAction = { type: 'setMasteryScore', value: 100000 };
      await executeDebugAction(action, userId);

      expect(supabase.rpc).toHaveBeenCalledWith('debug_set_mastery_score', {
        p_user_id: userId,
        p_score: 100000,
      });
    });

    it('should throw error when value is undefined', async () => {
      const action: DebugAction = { type: 'setMasteryScore' };
      await expect(executeDebugAction(action, userId)).rejects.toThrow(
        'setMasteryScore action requires value'
      );
    });

    it('should throw error when setMasteryScore fails', async () => {
      const error = { message: 'Set mastery score failed' };
      vi.mocked(supabase.rpc).mockResolvedValue({ error } as never);

      const action: DebugAction = { type: 'setMasteryScore', value: 100000 };
      await expect(executeDebugAction(action, userId)).rejects.toEqual(error);
    });
  });

  describe('setMinerals action', () => {
    it('should execute setMinerals action with valid value', async () => {
      const mockSetMinerals = vi.fn(() => Promise.resolve());
      mockGetUserStoreState.mockReturnValue({
        setMinerals: mockSetMinerals,
      });
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          } as any;
        }
        return {} as any;
      });

      const action: DebugAction = { type: 'setMinerals', value: 5000 };
      await executeDebugAction(action, userId);

      expect(mockSetMinerals).toHaveBeenCalledWith(5000);
    });

    it('should throw error when value is undefined', async () => {
      const action: DebugAction = { type: 'setMinerals' };
      await expect(executeDebugAction(action, userId)).rejects.toThrow(
        'setMinerals action requires value'
      );
    });
  });

  describe('setStamina action', () => {
    it('should execute setStamina action with valid value', async () => {
      const mockSetStamina = vi.fn(() => Promise.resolve());
      mockGetUserStoreState.mockReturnValue({
        setStamina: mockSetStamina,
      });
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          } as any;
        }
        return {} as any;
      });

      const action: DebugAction = { type: 'setStamina', value: 5 };
      await executeDebugAction(action, userId);

      expect(mockSetStamina).toHaveBeenCalledWith(5);
    });

    it('should throw error when value is undefined', async () => {
      const action: DebugAction = { type: 'setStamina' };
      await expect(executeDebugAction(action, userId)).rejects.toThrow(
        'setStamina action requires value'
      );
    });
  });

  describe('grantAllItems action', () => {
    it('should execute grantAllItems action with default quantity', async () => {
      const mockItems = [{ id: 'item-1' }, { id: 'item-2' }];
      const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => Promise.resolve({ data: mockItems, error: null })),
        upsert: mockUpsert,
      } as never);

      const action: DebugAction = { type: 'grantAllItems' };
      await executeDebugAction(action, userId);

      expect(mockUpsert).toHaveBeenCalledWith(
        [
          { user_id: userId, item_id: 'item-1', quantity: 99 },
          { user_id: userId, item_id: 'item-2', quantity: 99 },
        ],
        { onConflict: 'user_id,item_id' }
      );
    });

    it('should execute grantAllItems action with custom quantity', async () => {
      const mockItems = [{ id: 'item-1' }];
      const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => Promise.resolve({ data: mockItems, error: null })),
        upsert: mockUpsert,
      } as never);

      const action: DebugAction = { type: 'grantAllItems', quantity: 50 };
      await executeDebugAction(action, userId);

      expect(mockUpsert).toHaveBeenCalledWith(
        [{ user_id: userId, item_id: 'item-1', quantity: 50 }],
        { onConflict: 'user_id,item_id' }
      );
    });

    it('should throw error when items query fails', async () => {
      const error = { message: 'Items query failed' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => Promise.resolve({ data: null, error })),
      } as never);

      const action: DebugAction = { type: 'grantAllItems' };
      await expect(executeDebugAction(action, userId)).rejects.toEqual(error);
    });

    it('should throw error when upsert fails', async () => {
      const mockItems = [{ id: 'item-1' }];
      const error = { message: 'Upsert failed' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => Promise.resolve({ data: mockItems, error: null })),
        upsert: vi.fn(() => Promise.resolve({ error })),
      } as never);

      const action: DebugAction = { type: 'grantAllItems' };
      await expect(executeDebugAction(action, userId)).rejects.toEqual(error);
    });

    it('should handle empty items array', async () => {
      const mockUpsert = vi.fn(() => Promise.resolve({ error: null }));

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => Promise.resolve({ data: [], error: null })),
        upsert: mockUpsert,
      } as never);

      const action: DebugAction = { type: 'grantAllItems' };
      await executeDebugAction(action, userId);

      expect(mockUpsert).toHaveBeenCalledWith([], { onConflict: 'user_id,item_id' });
    });
  });

  describe('grantAllBadges action', () => {
    it('should execute grantAllBadges action successfully', async () => {
      const mockBadges = [{ id: 'badge-1' }, { id: 'badge-2' }];

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => Promise.resolve({ data: mockBadges, error: null })),
      } as never);

      vi.mocked(supabase.rpc).mockImplementation((fnName: string) => {
        if (fnName === 'debug_grant_badge') {
          return Promise.resolve({ error: null } as never);
        }
        return Promise.resolve({ error: null } as never);
      });

      const action: DebugAction = { type: 'grantAllBadges' };
      await executeDebugAction(action, userId);

      expect(supabase.rpc).toHaveBeenCalledTimes(2);
    });

    it('should handle badge grant failures gracefully', async () => {
      const mockBadges = [{ id: 'badge-1' }, { id: 'badge-2' }];
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => Promise.resolve({ data: mockBadges, error: null })),
      } as never);

      // 첫 번째는 성공, 두 번째는 실패
      let callCount = 0;
      vi.mocked(supabase.rpc).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ error: null } as never);
        } else {
          return Promise.reject({ message: 'Badge grant failed' });
        }
      });

      const action: DebugAction = { type: 'grantAllBadges' };
      await executeDebugAction(action, userId);

      // 일부 실패해도 에러를 throw하지 않음 (내부에서 처리)
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should handle badge grant when result.value.success is false', async () => {
      const mockBadges = [{ id: 'badge-1' }];
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => Promise.resolve({ data: mockBadges, error: null })),
      } as never);

      // result.value.success가 false인 경우를 시뮬레이션
      // supabase.rpc가 reject되면 .then()의 두 번째 인자가 호출되어 { success: false, ... } 반환
      vi.mocked(supabase.rpc).mockImplementation(() => {
        return Promise.reject({ message: 'Badge grant failed' });
      });

      const action: DebugAction = { type: 'grantAllBadges' };
      await executeDebugAction(action, userId);

      // 일부 실패해도 에러를 throw하지 않음 (내부에서 처리)
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should throw error when badges query fails', async () => {
      const error = { message: 'Badges query failed' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => Promise.resolve({ data: null, error })),
      } as never);

      const action: DebugAction = { type: 'grantAllBadges' };
      await expect(executeDebugAction(action, userId)).rejects.toEqual(error);
    });
  });

  describe('setGameTime action', () => {
    it('should update existing game session', async () => {
      const mockSession = { id: 'session-1' };
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      }));

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockSession, error: null })),
                })),
              })),
            })),
          })),
        })),
        update: mockUpdate,
      } as never);

      const action: DebugAction = { type: 'setGameTime', seconds: 30 };
      await executeDebugAction(action, userId);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should set timeLimit when no active session', async () => {
      const mockSetTimeLimit = vi.fn();
      const error = { code: 'PGRST116' }; // No rows returned

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error })),
                })),
              })),
            })),
          })),
        })),
      } as never);

      mockGetQuizStoreState.mockReturnValue({
        setTimeLimit: mockSetTimeLimit,
      });

      const action: DebugAction = { type: 'setGameTime', seconds: 60 };
      await executeDebugAction(action, userId);

      expect(mockSetTimeLimit).toHaveBeenCalledWith(60);
    });

    it('should map seconds to correct TimeLimit value', async () => {
      const mockSetTimeLimit = vi.fn();
      const error = { code: 'PGRST116' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error })),
                })),
              })),
            })),
          })),
        })),
      } as never);

      mockGetQuizStoreState.mockReturnValue({
        setTimeLimit: mockSetTimeLimit,
      });

      // 5초 -> 10
      const action1: DebugAction = { type: 'setGameTime', seconds: 5 };
      await executeDebugAction(action1, userId);
      expect(mockSetTimeLimit).toHaveBeenCalledWith(10);

      // 12초 -> 15
      const action2: DebugAction = { type: 'setGameTime', seconds: 12 };
      await executeDebugAction(action2, userId);
      expect(mockSetTimeLimit).toHaveBeenCalledWith(15);

      // 30초 -> 60
      const action3: DebugAction = { type: 'setGameTime', seconds: 30 };
      await executeDebugAction(action3, userId);
      expect(mockSetTimeLimit).toHaveBeenCalledWith(60);

      // 100초 -> 120
      const action4: DebugAction = { type: 'setGameTime', seconds: 100 };
      await executeDebugAction(action4, userId);
      expect(mockSetTimeLimit).toHaveBeenCalledWith(120);

      // 150초 -> 180
      const action5: DebugAction = { type: 'setGameTime', seconds: 150 };
      await executeDebugAction(action5, userId);
      expect(mockSetTimeLimit).toHaveBeenCalledWith(180);
    });

    it('should use default seconds (5) when not provided', async () => {
      const mockSetTimeLimit = vi.fn();
      const error = { code: 'PGRST116' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error })),
                })),
              })),
            })),
          })),
        })),
      } as never);

      mockGetQuizStoreState.mockReturnValue({
        setTimeLimit: mockSetTimeLimit,
      });

      const action: DebugAction = { type: 'setGameTime' };
      await executeDebugAction(action, userId);

      expect(mockSetTimeLimit).toHaveBeenCalledWith(10); // 5초 -> 10
    });

    it('should throw error when sessionError code is not PGRST116', async () => {
      const error = { code: 'PGRST500', message: 'Server error' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  single: vi.fn(() => Promise.resolve({ data: null, error })),
                })),
              })),
            })),
          })),
        })),
      } as never);

      const action: DebugAction = { type: 'setGameTime', seconds: 30 };
      await expect(executeDebugAction(action, userId)).rejects.toEqual(error);
    });

    it('should throw error when session query fails (non-PGRST116)', async () => {
      const error = { code: 'PGRST500', message: 'Server error' };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error })),
                })),
              })),
            })),
          })),
        })),
      } as never);

      const action: DebugAction = { type: 'setGameTime', seconds: 30 };
      await expect(executeDebugAction(action, userId)).rejects.toEqual(error);
    });
  });

  describe('unknown action type', () => {
    it('should throw error for unknown action type', async () => {
      const action = { type: 'unknown' as any };
      await expect(executeDebugAction(action, userId)).rejects.toThrow('Unknown action type');
    });
  });
});

describe('debugPresets - applyPreset', () => {
  const userId = 'test-user-id';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset mocks to default
    mockGetUserStoreState.mockReturnValue({
      fetchUserData: vi.fn(() => Promise.resolve()),
      setMinerals: vi.fn(() => Promise.resolve()),
      setStamina: vi.fn(() => Promise.resolve()),
    });
    mockGetQuizStoreState.mockReturnValue({
      setTimeLimit: vi.fn(),
    });
    // Reset supabase.from mock
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    } as any);
  });

  it('should apply newbie preset successfully', async () => {
    const mockFetchUserData = vi.fn(() => Promise.resolve());
    const mockSetMinerals = vi.fn(() => Promise.resolve());
    const mockSetStamina = vi.fn(() => Promise.resolve());

    vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { minerals: 0, stamina: 5 }, error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        } as any;
      }
      if (table === 'inventory') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        } as any;
      }
      return {
        select: vi.fn(),
        upsert: vi.fn(() => Promise.resolve({ error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      } as any;
    });
    mockGetUserStoreState.mockReturnValue({
      fetchUserData: mockFetchUserData,
      setMinerals: mockSetMinerals,
      setStamina: mockSetStamina,
    });

    await applyPreset('newbie', userId);

    expect(supabase.rpc).toHaveBeenCalledWith('debug_reset_profile', {
      p_user_id: userId,
      p_reset_type: 'all',
    });
    expect(supabase.rpc).toHaveBeenCalledWith('debug_set_tier', {
      p_user_id: userId,
      p_level: 0,
    });
    expect(mockSetMinerals).toHaveBeenCalledWith(0);
    expect(mockSetStamina).toHaveBeenCalledWith(5);
    expect(mockFetchUserData).toHaveBeenCalled();

    const histories = getPresetHistories();
    expect(histories).toHaveLength(1);
    expect(histories[0].presetId).toBe('newbie');
    expect(histories[0].success).toBe(true);
  });

  it('should apply veteran preset with dynamic score calculation', async () => {
    const mockFetchUserData = vi.fn(() => Promise.resolve());
    const mockSetMinerals = vi.fn(() => Promise.resolve());
    const mockItems = [{ id: 'item-1' }, { id: 'item-2' }];
    const mockBadges = [{ id: 'badge-1' }];

    vi.mocked(supabase.rpc).mockImplementation((fnName: string) => {
      if (fnName === 'debug_set_mastery_score') {
        return Promise.resolve({ error: null } as never);
      }
      if (fnName === 'debug_set_tier') {
        return Promise.resolve({ error: null } as never);
      }
      if (fnName === 'debug_grant_badge') {
        return Promise.resolve({ error: null } as never);
      }
      return Promise.resolve({ error: null } as never);
    });

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'items') {
        return {
          select: vi.fn(() => Promise.resolve({ data: mockItems, error: null })),
          upsert: vi.fn(() => Promise.resolve({ error: null })),
        } as any;
      }
      if (table === 'badge_definitions') {
        return {
          select: vi.fn(() => Promise.resolve({ data: mockBadges, error: null })),
        } as any;
      }
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { minerals: 0, stamina: 5 }, error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        } as any;
      }
      if (table === 'inventory') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          upsert: vi.fn(() => Promise.resolve({ error: null })),
        } as any;
      }
      return {
        select: vi.fn(),
        upsert: vi.fn(() => Promise.resolve({ error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      } as any;
    });

    mockGetUserStoreState.mockReturnValue({
      fetchUserData: mockFetchUserData,
      setMinerals: mockSetMinerals,
    });

    await applyPreset('veteran', userId);

    expect(calculateScoreForTier).toHaveBeenCalledWith(6, 10, 100000);
    expect(supabase.rpc).toHaveBeenCalledWith('debug_set_mastery_score', {
      p_user_id: userId,
      p_score: 2850000,
    });
    expect(mockFetchUserData).toHaveBeenCalled();

    const histories = getPresetHistories();
    expect(histories[0].presetId).toBe('veteran');
    expect(histories[0].success).toBe(true);
  });

  it('should apply custom preset successfully', async () => {
    const mockFetchUserData = vi.fn(() => Promise.resolve());
    const mockSetMinerals = vi.fn(() => Promise.resolve());

    const customPreset: CustomPreset = {
      id: 'custom-test',
      name: 'Custom Test',
      description: 'Test',
      actions: [{ type: 'setMinerals', value: 1000 }],
      isCustom: true,
    };

    saveCustomPreset(customPreset);

    vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { minerals: 0, stamina: 5 }, error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        } as any;
      }
      if (table === 'inventory') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        } as any;
      }
      return {
        select: vi.fn(),
        upsert: vi.fn(() => Promise.resolve({ error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      } as any;
    });
    mockGetUserStoreState.mockReturnValue({
      fetchUserData: mockFetchUserData,
      setMinerals: mockSetMinerals,
    });

    await applyPreset('custom-test', userId);

    expect(mockSetMinerals).toHaveBeenCalledWith(1000);
    expect(mockFetchUserData).toHaveBeenCalled();

    const histories = getPresetHistories();
    expect(histories[0].presetId).toBe('custom-test');
    expect(histories[0].success).toBe(true);
  });

  it('should save failure history when action fails', async () => {
    const error = { message: 'Action failed' };

    vi.mocked(supabase.rpc).mockResolvedValue({ error } as never);

    await expect(applyPreset('newbie', userId)).rejects.toBeDefined();

    const histories = getPresetHistories();
    expect(histories).toHaveLength(1);
    expect(histories[0].success).toBe(false);
    expect(histories[0].error).toBeDefined();
  });

  it('should call refetch callback when provided', async () => {
    const mockRefetch = vi.fn(() => Promise.resolve());
    const mockFetchUserData = vi.fn(() => Promise.resolve());
    const mockSetMinerals = vi.fn(() => Promise.resolve());
    const mockSetStamina = vi.fn(() => Promise.resolve());

    vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { minerals: 0, stamina: 5 }, error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        } as any;
      }
      if (table === 'inventory') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        } as any;
      }
      return {
        select: vi.fn(),
        upsert: vi.fn(() => Promise.resolve({ error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      } as any;
    });
    mockGetUserStoreState.mockReturnValue({
      fetchUserData: mockFetchUserData,
      setMinerals: mockSetMinerals,
      setStamina: mockSetStamina,
    });

    await applyPreset('newbie', userId, mockRefetch);

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('should not call refetch when not provided', async () => {
    const mockFetchUserData = vi.fn(() => Promise.resolve());
    const mockSetMinerals = vi.fn(() => Promise.resolve());
    const mockSetStamina = vi.fn(() => Promise.resolve());

    vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: { minerals: 0, stamina: 5 }, error: null })),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        } as any;
      }
      if (table === 'inventory') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        } as any;
      }
      return {
        select: vi.fn(),
        upsert: vi.fn(() => Promise.resolve({ error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      } as any;
    });
    mockGetUserStoreState.mockReturnValue({
      fetchUserData: mockFetchUserData,
      setMinerals: mockSetMinerals,
      setStamina: mockSetStamina,
    });

    await applyPreset('newbie', userId);

    expect(mockFetchUserData).toHaveBeenCalled();
    // refetch가 없어도 정상 동작해야 함
  });

  it('should throw error for setMasteryScore with -1 in non-veteran preset', async () => {
    const customPreset: CustomPreset = {
      id: 'invalid-preset',
      name: 'Invalid',
      description: 'Test',
      actions: [{ type: 'setMasteryScore', value: -1 }],
      isCustom: true,
    };

    saveCustomPreset(customPreset);

    await expect(applyPreset('invalid-preset', userId)).rejects.toThrow(
      'setMasteryScore with value -1 is only supported for veteran preset'
    );
  });

  it('should throw error when preset is not found', async () => {
    await expect(applyPreset('non-existent-preset', userId)).rejects.toThrow(
      'Preset not found: non-existent-preset'
    );
  });
});
