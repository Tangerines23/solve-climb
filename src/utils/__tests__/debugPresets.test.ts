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
  type CustomPreset,
  type PresetHistory,
} from '../debugPresets';

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
    const newbie = debugPresets.find(p => p.id === 'newbie');
    expect(newbie).toBeDefined();
    expect(newbie?.name).toBe('뉴비 세팅');
  });

  it('should have preset with id "veteran"', () => {
    const veteran = debugPresets.find(p => p.id === 'veteran');
    expect(veteran).toBeDefined();
    expect(veteran?.actions.some(a => a.type === 'setMasteryScore' && a.value === -1)).toBe(true);
  });

  it('should have preset with id "crisis"', () => {
    const crisis = debugPresets.find(p => p.id === 'crisis');
    expect(crisis).toBeDefined();
    expect(crisis?.description).toContain('엣지 케이스');
  });

  it('should have all presets with required fields', () => {
    debugPresets.forEach(preset => {
      expect(preset.id).toBeDefined();
      expect(preset.name).toBeDefined();
      expect(preset.description).toBeDefined();
      expect(Array.isArray(preset.actions)).toBe(true);
    });
  });
});

