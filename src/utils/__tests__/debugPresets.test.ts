import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  executeDebugAction,
  savePresetHistory,
  getPresetHistories,
  clearPresetHistory,
  applyPreset,
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
} from '../debugPresets';
import { supabase } from '../supabaseClient';
import { useUserStore } from '../../stores/useUserStore';
import { storageService } from '../../services';

vi.mock('../supabaseClient', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  },
}));

describe('debugPresets utility', () => {
  const userId = 'test-user';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeDebugAction', () => {
    it('should call debug_reset_profile for reset action', async () => {
      (supabase.rpc as any).mockResolvedValue({ error: null });
      await executeDebugAction({ type: 'reset', target: 'score' }, userId);
      expect(supabase.rpc).toHaveBeenCalledWith(
        'debug_reset_profile',
        expect.objectContaining({
          p_reset_type: 'score',
        })
      );
    });

    it('should throw error if setTier level is missing', async () => {
      await expect(executeDebugAction({ type: 'setTier' }, userId)).rejects.toThrow(
        'setTier action requires level'
      );
    });

    it('should grant all items by calling rpc for each item', async () => {
      (supabase.from as any)().select.mockResolvedValue({
        data: [{ id: 'item1' }, { id: 'item2' }],
        error: null,
      });
      (supabase.rpc as any).mockResolvedValue({ error: null });

      await executeDebugAction({ type: 'grantAllItems', quantity: 5 }, userId);
      expect(supabase.rpc).toHaveBeenCalledTimes(2);
    });

    it('should handle grantAllBadges with successes and failures', async () => {
      (supabase.from as any)().select.mockResolvedValue({
        data: [{ id: 'badge1' }, { id: 'badge2' }],
        error: null,
      });
      (supabase.rpc as any)
        .mockResolvedValueOnce({ error: null })
        .mockRejectedValueOnce(new Error('Bad error'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await executeDebugAction({ type: 'grantAllBadges' }, userId);

      expect(supabase.rpc).toHaveBeenCalledTimes(2);
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  describe('history management', () => {
    it('should save and retrieve histories', () => {
      const mockHistory = {
        id: '1',
        presetId: 'newbie',
        presetName: 'Newbie',
        appliedAt: new Date(),
        userId,
        success: true,
      };
      const setSpy = vi.spyOn(storageService, 'set');
      vi.spyOn(storageService, 'get').mockReturnValue([mockHistory]);

      savePresetHistory(mockHistory);
      expect(setSpy).toHaveBeenCalled();

      const histories = getPresetHistories();
      expect(histories).toHaveLength(1);
      expect(histories[0].presetId).toBe('newbie');
    });

    it('should clear histories', () => {
      const removeSpy = vi.spyOn(storageService, 'remove');
      clearPresetHistory();
      expect(removeSpy).toHaveBeenCalled();
    });
  });

  describe('custom presets', () => {
    it('should manage custom presets', () => {
      const mockPreset = {
        id: 'custom1',
        name: 'Custom',
        actions: [],
        isCustom: true as const,
        description: 'desc',
      };
      vi.spyOn(storageService, 'get').mockReturnValue([mockPreset]);
      const setSpy = vi.spyOn(storageService, 'set');

      const presets = getCustomPresets();
      expect(presets).toHaveLength(1);

      saveCustomPreset(mockPreset);
      expect(setSpy).toHaveBeenCalled();

      deleteCustomPreset('custom1');
      expect(setSpy).toHaveBeenCalledWith(expect.any(String), []);
    });
  });

  describe('applyPreset', () => {
    it('should sequentially execute actions in a preset', async () => {
      (supabase.rpc as any).mockResolvedValue({ error: null });
      const fetchSpy = vi.spyOn(useUserStore.getState(), 'fetchUserData').mockResolvedValue();

      await applyPreset('newbie', userId);
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('should throw error for unknown preset', async () => {
      await expect(applyPreset('invalid', userId)).rejects.toThrow('Preset not found');
    });
  });
});
