import { describe, it, expect, beforeEach } from 'vitest';
import { StorageUtil, StorageKeys, STORAGE_PREFIXES } from '../storage';
import { MockStorageService } from '../../services';

describe('StorageUtil', () => {
  let mockStorage: MockStorageService;
  let storageUtil: StorageUtil;

  beforeEach(() => {
    // 각 테스트마다 독립된 Mock 인스턴스 생성
    mockStorage = new MockStorageService();
    storageUtil = new StorageUtil(mockStorage);
  });

  describe('get/set', () => {
    it('should store and retrieve values', () => {
      const testData = { name: 'John', age: 30 };

      storageUtil.set('user', testData);
      const retrieved = storageUtil.get('user', {});

      expect(retrieved).toEqual(testData);
    });

    it('should return default value when key does not exist', () => {
      const defaultValue = { name: 'Default' };
      const result = storageUtil.get('nonexistent', defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        user: { name: 'John', profile: { age: 30, city: 'Seoul' } },
        settings: { theme: 'dark', notifications: true },
      };

      storageUtil.set('complex', complexData);
      const retrieved = storageUtil.get('complex', {});

      expect(retrieved).toEqual(complexData);
    });
  });

  describe('getString/setString', () => {
    it('should store and retrieve string values', () => {
      storageUtil.setString('text', 'Hello World');
      const retrieved = storageUtil.getString('text');

      expect(retrieved).toBe('Hello World');
    });

    it('should return default value for non-existent string', () => {
      const result = storageUtil.getString('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should return null when no default is provided', () => {
      const result = storageUtil.getString('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove stored values', () => {
      storageUtil.set('temp', 'value');
      expect(storageUtil.get('temp', null)).toBe('value');

      storageUtil.remove('temp');
      expect(storageUtil.get('temp', null)).toBeNull();
    });

    it('should not throw when removing non-existent key', () => {
      expect(() => storageUtil.remove('nonexistent')).not.toThrow();
    });
  });

  describe('getKeysByPrefix', () => {
    it('should find keys by prefix', () => {
      storageUtil.set('solve-climb-user1', 'data1');
      storageUtil.set('solve-climb-user2', 'data2');
      storageUtil.set('other-key', 'data3');

      const keys = storageUtil.getKeysByPrefix('solve-climb-');

      expect(keys).toHaveLength(2);
      expect(keys).toContain('solve-climb-user1');
      expect(keys).toContain('solve-climb-user2');
      expect(keys).not.toContain('other-key');
    });

    it('should return empty array when no keys match', () => {
      storageUtil.set('key1', 'value1');
      const keys = storageUtil.getKeysByPrefix('nonexistent-');

      expect(keys).toEqual([]);
    });
  });

  describe('removeByPrefix', () => {
    it('should remove all keys with given prefix', () => {
      storageUtil.set('solve-climb-user1', 'data1');
      storageUtil.set('solve-climb-user2', 'data2');
      storageUtil.set('other-key', 'data3');

      storageUtil.removeByPrefix('solve-climb-');

      expect(storageUtil.get('solve-climb-user1', null)).toBeNull();
      expect(storageUtil.get('solve-climb-user2', null)).toBeNull();
      expect(storageUtil.get('other-key', null)).toBe('data3');
    });
  });

  describe('clearAppData', () => {
    it('should clear all app-related data', () => {
      // STORAGE_PREFIXES에 정의된 접두사로 데이터 저장
      storageUtil.set('solve-climb-user', 'data1');
      storageUtil.set('gameCenterApi_score', 'data2');
      storageUtil.set('other-app-data', 'data3');

      storageUtil.clearAppData();

      expect(storageUtil.get('solve-climb-user', null)).toBeNull();
      expect(storageUtil.get('gameCenterApi_score', null)).toBeNull();
      expect(storageUtil.get('other-app-data', null)).toBe('data3');
    });
  });

  describe('StorageKeys', () => {
    it('should have correct key constants', () => {
      expect(StorageKeys.DEVICE_ID).toBe('solve-climb-device-id');
      expect(StorageKeys.ACTIVE_PROFILE_ID).toBe('solve-climb-active-profile-id');
      expect(StorageKeys.LOCAL_SESSION).toBe('solve-climb-local-session');
    });

    it('should generate dynamic keys correctly', () => {
      expect(StorageKeys.PROFILES('device123')).toBe('solve-climb-profiles-device123');
      expect(StorageKeys.PROGRESS('profile456')).toBe('solve-climb-progress-profile456');
      expect(StorageKeys.GAME_TIP('math', 'addition', '1')).toBe('gameTip_math_addition_1');
      expect(StorageKeys.GAME_TIP('math', 'addition')).toBe('gameTip_math_addition');
    });
  });

  describe('STORAGE_PREFIXES', () => {
    it('should contain expected prefixes', () => {
      expect(STORAGE_PREFIXES).toContain('solve-climb-');
      expect(STORAGE_PREFIXES).toContain('gameCenterApi_');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values', () => {
      storageUtil.setString('empty', '');
      expect(storageUtil.getString('empty')).toBe('');
    });

    it('should handle null values', () => {
      storageUtil.set('null-value', null);
      // null은 저장되지만, get 시 null이 반환되면 default 값 사용
      const result = storageUtil.get('null-value', 'default');
      // MockStorageService는 null을 그대로 저장하므로 null 반환
      expect(result).toBeNull();
    });

    it('should handle undefined values', () => {
      storageUtil.set('undefined-value', undefined);
      const result = storageUtil.get('undefined-value', 'default');
      // MockStorageService는 undefined를 null로 저장
      expect(result).toBeNull();
    });

    it('should handle arrays', () => {
      const arr = [1, 2, 3, 4, 5];
      storageUtil.set('array', arr);
      expect(storageUtil.get('array', [])).toEqual(arr);
    });

    it('should handle boolean values', () => {
      storageUtil.set('bool-true', true);
      storageUtil.set('bool-false', false);

      expect(storageUtil.get('bool-true', false)).toBe(true);
      expect(storageUtil.get('bool-false', true)).toBe(false);
    });

    it('should handle number values', () => {
      storageUtil.set('number', 42);
      storageUtil.set('float', 3.14);
      storageUtil.set('zero', 0);

      expect(storageUtil.get('number', 0)).toBe(42);
      expect(storageUtil.get('float', 0)).toBe(3.14);
      expect(storageUtil.get('zero', -1)).toBe(0);
    });

    it('should use validator to filter invalid data', () => {
      const invalidData = { score: 'not-a-number' };
      storageUtil.set('score-data', invalidData);

      const defaultValue = { score: 0 };
      const validator = (val: any): val is { score: number } => typeof val?.score === 'number';

      const result = storageUtil.get('score-data', defaultValue, validator);
      expect(result).toEqual(defaultValue);

      // Valid case
      const validData = { score: 100 };
      storageUtil.set('score-data', validData);
      const validResult = storageUtil.get('score-data', defaultValue, validator);
      expect(validResult).toEqual(validData);
    });
  });
});
