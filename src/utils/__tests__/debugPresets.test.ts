import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  savePresetHistory,
  getPresetHistories,
  clearPresetHistory,
  getCustomPresets,
  saveCustomPreset,
  deleteCustomPreset,
  exportCustomPresets,
  importCustomPresets,
} from '../debugPresets';
import { storageService, STORAGE_KEYS } from '../../services';

describe('debugPresets utility', () => {
  const userId = 'test-user';

  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(setSpy).toHaveBeenCalledWith(STORAGE_KEYS.DEBUG_CUSTOM_PRESETS, []);
    });
  });

  describe('import/export presets', () => {
    it('should export and import custom presets correctly', () => {
      const mockPresets = [
        { id: 'exp1', name: 'Exported', actions: [], isCustom: true as const, description: '' },
      ];
      vi.spyOn(storageService, 'get').mockReturnValue(mockPresets);
      const setSpy = vi.spyOn(storageService, 'set');

      const exported = exportCustomPresets();
      expect(exported).toContain('Exported');

      // Clear mock and import
      vi.spyOn(storageService, 'get').mockReturnValue([]);
      importCustomPresets(exported);
      expect(setSpy).toHaveBeenCalledWith(
        STORAGE_KEYS.DEBUG_CUSTOM_PRESETS,
        expect.arrayContaining([expect.objectContaining({ id: 'exp1' })])
      );
    });

    it('should throw error for invalid import format', () => {
      expect(() => importCustomPresets('invalid-json')).toThrow();
      expect(() => importCustomPresets('[]')).not.toThrow();
      expect(() => importCustomPresets('{}')).toThrow('must be an array');
    });
  });
});
