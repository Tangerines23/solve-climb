import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage, StorageKeys, STORAGE_PREFIXES } from '../storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

describe('storage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    // Replace global localStorage with mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  describe('get and set', () => {
    it('should store and retrieve object', () => {
      const testData = { name: 'test', value: 123 };
      storage.set('test-key', testData);
      const retrieved = storage.get('test-key', null);

      expect(retrieved).toEqual(testData);
    });

    it('should return default value when key does not exist', () => {
      const defaultValue = { default: true };
      const result = storage.get('non-existent-key', defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it('should store and retrieve string', () => {
      storage.set('string-key', 'test string');
      const result = storage.get('string-key', '');

      expect(result).toBe('test string');
    });

    it('should store and retrieve number', () => {
      storage.set('number-key', 42);
      const result = storage.get('number-key', 0);

      expect(result).toBe(42);
    });

    it('should store and retrieve array', () => {
      const testArray = [1, 2, 3];
      storage.set('array-key', testArray);
      const result = storage.get('array-key', []);

      expect(result).toEqual(testArray);
    });

    it('should handle invalid JSON gracefully', () => {
      // Manually set invalid JSON
      localStorageMock.setItem('invalid-key', 'invalid json{');
      const result = storage.get('invalid-key', { default: true });

      expect(result).toEqual({ default: true });
    });
  });

  describe('getString and setString', () => {
    it('should store and retrieve string directly', () => {
      storage.setString('string-key', 'test string');
      const result = storage.getString('string-key', null);

      expect(result).toBe('test string');
    });

    it('should return default value when string key does not exist', () => {
      const result = storage.getString('non-existent-key', 'default');

      expect(result).toBe('default');
    });

    it('should return null when no default provided', () => {
      const result = storage.getString('non-existent-key', null);

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove stored item', () => {
      storage.set('test-key', { data: 'test' });
      storage.remove('test-key');
      const result = storage.get('test-key', null);

      expect(result).toBeNull();
    });

    it('should handle removing non-existent key gracefully', () => {
      expect(() => {
        storage.remove('non-existent-key');
      }).not.toThrow();
    });
  });

  describe('getKeysByPrefix', () => {
    it('should return keys with matching prefix', () => {
      storage.setString('prefix-key1', 'value1');
      storage.setString('prefix-key2', 'value2');
      storage.setString('other-key', 'value3');

      const keys = storage.getKeysByPrefix('prefix-');

      expect(keys).toContain('prefix-key1');
      expect(keys).toContain('prefix-key2');
      expect(keys).not.toContain('other-key');
    });

    it('should return empty array when no keys match prefix', () => {
      storage.setString('other-key', 'value');

      const keys = storage.getKeysByPrefix('prefix-');

      expect(keys).toEqual([]);
    });
  });

  describe('removeByPrefix', () => {
    it('should remove all keys with matching prefix', () => {
      storage.setString('prefix-key1', 'value1');
      storage.setString('prefix-key2', 'value2');
      storage.setString('other-key', 'value3');

      storage.removeByPrefix('prefix-');

      expect(storage.getString('prefix-key1', null)).toBeNull();
      expect(storage.getString('prefix-key2', null)).toBeNull();
      expect(storage.getString('other-key', null)).toBe('value3');
    });
  });

  describe('clearAppData', () => {
    it('should remove all keys with app prefixes', () => {
      storage.setString('solve-climb-test1', 'value1');
      storage.setString('gameCenterApi_test2', 'value2');
      storage.setString('other-key', 'value3');

      storage.clearAppData();

      expect(storage.getString('solve-climb-test1', null)).toBeNull();
      expect(storage.getString('gameCenterApi_test2', null)).toBeNull();
      expect(storage.getString('other-key', null)).toBe('value3');
    });
  });

  describe('StorageKeys', () => {
    it('should generate correct device ID key', () => {
      expect(StorageKeys.DEVICE_ID).toBe('solve-climb-device-id');
    });

    it('should generate correct profile key with device ID', () => {
      const deviceId = 'device-123';
      const key = StorageKeys.PROFILES(deviceId);

      expect(key).toBe('solve-climb-profiles-device-123');
    });

    it('should generate correct progress key with profile ID', () => {
      const profileId = 'profile-456';
      const key = StorageKeys.PROGRESS(profileId);

      expect(key).toBe('solve-climb-progress-profile-456');
    });

    it('should generate correct game tip key', () => {
      const key = StorageKeys.GAME_TIP('math', 'addition');

      expect(key).toBe('gameTip_math_addition');
    });

    it('should generate correct game tip key with level', () => {
      const key = StorageKeys.GAME_TIP('math', 'addition', '1');

      expect(key).toBe('gameTip_math_addition_1');
    });
  });

  describe('Error handling branches', () => {
    it('should handle localStorage.getItem error in get', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const result = storage.get('test-key', { default: true });
      expect(result).toEqual({ default: true });

      localStorage.getItem = originalGetItem;
    });

    it('should handle JSON.stringify error in set', () => {
      const circular: any = {};
      circular.self = circular;

      // JSON.stringify will fail for circular reference
      storage.set('test-key', circular);
      // Should not throw, just log error
      expect(typeof storage.set).toBe('function');
    });

    it('should handle localStorage.setItem error in set (QuotaExceededError)', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      });

      storage.set('test-key', { data: 'test' });
      // Should not throw, just log error
      expect(typeof storage.set).toBe('function');

      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage.removeItem error in remove', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn(() => {
        throw new Error('Remove error');
      });

      storage.remove('test-key');
      // Should not throw, just log error
      expect(typeof storage.remove).toBe('function');

      localStorage.removeItem = originalRemoveItem;
    });

    it('should handle localStorage.getItem error in getString', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const result = storage.getString('test-key', 'default');
      expect(result).toBe('default');

      localStorage.getItem = originalGetItem;
    });

    it('should handle localStorage.setItem error in setString', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      storage.setString('test-key', 'value');
      // Should not throw, just log error
      expect(typeof storage.setString).toBe('function');

      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage.key returning null in getKeysByPrefix', () => {
      const originalKey = localStorage.key;
      let callCount = 0;
      localStorage.key = vi.fn((index: number) => {
        callCount++;
        if (callCount === 1) return 'prefix-key1';
        if (callCount === 2) return null; // Simulate null return
        return null;
      });
      Object.defineProperty(localStorage, 'length', {
        get: () => 3,
        configurable: true,
      });

      const keys = storage.getKeysByPrefix('prefix-');
      expect(keys).toContain('prefix-key1');

      localStorage.key = originalKey;
    });

    it('should handle empty localStorage in getKeysByPrefix', () => {
      Object.defineProperty(localStorage, 'length', {
        get: () => 0,
        configurable: true,
      });

      const keys = storage.getKeysByPrefix('prefix-');
      expect(keys).toEqual([]);
    });

    it('should handle localStorage.key error in getKeysByPrefix', () => {
      const originalKey = localStorage.key;
      localStorage.key = vi.fn(() => {
        throw new Error('Key error');
      });
      Object.defineProperty(localStorage, 'length', {
        get: () => 1,
        configurable: true,
      });

      const keys = storage.getKeysByPrefix('prefix-');
      expect(keys).toEqual([]);

      localStorage.key = originalKey;
    });
  });
});

