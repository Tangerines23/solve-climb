import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCustomPresets,
  saveCustomPreset,
  exportCustomPresets,
  importCustomPresets,
  type CustomPreset,
} from '../debugPresets';

describe('debugPresets - Error Handling & Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('importCustomPresets - Error Cases', () => {
    it('should throw error for invalid JSON format', () => {
      expect(() => {
        importCustomPresets('{ invalid json }');
      }).toThrow();
    });

    it('should throw error when JSON is not an array', () => {
      expect(() => {
        importCustomPresets('{"id": "test"}');
      }).toThrow('Invalid preset format: must be an array');
    });

    it('should throw error when preset lacks required fields', () => {
      const invalidPresets = [
        { id: 'missing-name' }, // name, actions 누락
        { id: 'missing-actions', name: 'Test' }, // actions 누락
        { name: 'missing-id', actions: [] }, // id 누락
      ];

      invalidPresets.forEach((preset) => {
        expect(() => {
          importCustomPresets(JSON.stringify([preset]));
        }).toThrow('Invalid preset format');
      });
    });

    it('should throw error for empty preset array in invalid format', () => {
      const invalidPreset = { notId: 'wrong' };
      expect(() => {
        importCustomPresets(JSON.stringify([invalidPreset]));
      }).toThrow('Invalid preset format');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long preset names', () => {
      const longName = 'A'.repeat(1000); // 1000 is enough to test storage limits roughly
      const preset: CustomPreset = {
        id: 'long-name',
        name: longName,
        description: 'Description',
        actions: [],
        isCustom: true,
      };

      expect(() => saveCustomPreset(preset)).not.toThrow();
      const presets = getCustomPresets();
      expect(presets[0].name).toBe(longName);
    });

    it('should handle empty actions array', () => {
      const preset: CustomPreset = {
        id: 'empty-actions',
        name: 'Empty Actions',
        description: 'Description',
        actions: [],
        isCustom: true,
      };

      expect(() => saveCustomPreset(preset)).not.toThrow();
      const presets = getCustomPresets();
      expect(presets[0].actions).toEqual([]);
    });

    it('should handle special characters in preset names', () => {
      const preset: CustomPreset = {
        id: 'special-chars',
        name: '테스트!@#$%^&*()_+-=[]{}|;:\'",./<>?',
        description: '특수문자 포함',
        actions: [],
        isCustom: true,
      };

      saveCustomPreset(preset);
      const exported = exportCustomPresets();

      localStorage.clear();
      importCustomPresets(exported);

      const presets = getCustomPresets();
      expect(presets[0].name).toBe(preset.name);
    });

    it('should handle multiple rapid save operations', () => {
      for (let i = 0; i < 20; i++) { // 20 is enough for rapid check
        const preset: CustomPreset = {
          id: `rapid-${i}`,
          name: `Rapid ${i}`,
          description: 'Description',
          actions: [],
          isCustom: true,
        };
        saveCustomPreset(preset);
      }

      const presets = getCustomPresets();
      expect(presets).toHaveLength(20);
    });
  });
});
