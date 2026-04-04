import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageService } from '../LocalStorageService';

describe('LocalStorageService', () => {
  let mockStorage: Storage;
  let service: LocalStorageService;

  beforeEach(() => {
    // Mock for storage
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    } as unknown as Storage;

    service = new LocalStorageService(mockStorage);
  });

  describe('get', () => {
    it('should return null if item does not exist', () => {
      vi.mocked(mockStorage.getItem).mockReturnValue(null);
      expect(service.get('key')).toBeNull();
    });

    it('should return parsed JSON if item exists', () => {
      const data = { foo: 'bar' };
      vi.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify(data));
      expect(service.get('key')).toEqual(data);
    });

    it('should return raw string if JSON parsing fails and T is string', () => {
      const rawString = 'not-json';
      vi.mocked(mockStorage.getItem).mockReturnValue(rawString);
      expect(service.get<string>('key')).toBe(rawString);
    });

    it('should return null and log error if storage.getItem throws', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(mockStorage.getItem).mockImplementation(() => {
        throw new Error('Access denied');
      });
      expect(service.get('key')).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('set', () => {
    it('should stringify and set item', () => {
      const data = { foo: 'bar' };
      service.set('key', data);
      expect(mockStorage.setItem).toHaveBeenCalledWith('key', JSON.stringify(data));
    });

    it('should throw error and log if storage.setItem throws', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(mockStorage.setItem).mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
      expect(() => service.set('key', 'value')).toThrow('Quota exceeded');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('remove', () => {
    it('should remove item', () => {
      service.remove('key');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('key');
    });

    it('should log error if storage.removeItem throws', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(mockStorage.removeItem).mockImplementation(() => {
        throw new Error('Remove failed');
      });
      service.remove('key');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should clear storage', () => {
      service.clear();
      expect(mockStorage.clear).toHaveBeenCalled();
    });

    it('should log error if storage.clear throws', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(mockStorage.clear).mockImplementation(() => {
        throw new Error('Clear failed');
      });
      service.clear();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('keys', () => {
    it('should return all keys', () => {
      Object.defineProperty(mockStorage, 'length', { value: 2 });
      vi.mocked(mockStorage.key).mockReturnValueOnce('key1').mockReturnValueOnce('key2');

      expect(service.keys()).toEqual(['key1', 'key2']);
    });
  });

  describe('length', () => {
    it('should return storage length', () => {
      Object.defineProperty(mockStorage, 'length', { value: 5 });
      expect(service.length).toBe(5);
    });
  });

  describe('hasItem', () => {
    it('should return true if item exists', () => {
      vi.mocked(mockStorage.getItem).mockReturnValue('exists');
      expect(service.hasItem('key')).toBe(true);
    });

    it('should return false if item does not exist', () => {
      vi.mocked(mockStorage.getItem).mockReturnValue(null);
      expect(service.hasItem('key')).toBe(false);
    });
  });
});
