import { IStorageService } from './IStorageService';

/**
 * LocalStorage 기반 Storage Service 구현
 *
 * 프로덕션 환경에서 사용되는 실제 localStorage 구현
 */
export class LocalStorageService implements IStorageService {
  constructor(private storage: Storage = window.localStorage) {}

  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      if (item === null) return null;

      try {
        return JSON.parse(item) as T;
      } catch (_parseError) {
        // JSON 파싱 실패 시, T가 string이면 원본 그대로 반환 시도
        // 이는 setString 등으로 raw string이 저장된 경우를 위함
        return item as unknown as T;
      }
    } catch (error) {
      console.error(`Failed to get item from storage: ${key}`, error);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(key, serialized);
    } catch (error) {
      console.error(`Failed to set item in storage: ${key}`, error);
      throw error;
    }
  }

  remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove item from storage: ${key}`, error);
    }
  }

  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Failed to clear storage', error);
    }
  }

  keys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key) keys.push(key);
    }
    return keys;
  }

  get length(): number {
    return this.storage.length;
  }

  hasItem(key: string): boolean {
    return this.storage.getItem(key) !== null;
  }
}
