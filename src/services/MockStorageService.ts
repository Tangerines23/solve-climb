import { IStorageService } from './IStorageService';

/**
 * Mock Storage Service for Testing
 *
 * 테스트 환경에서 사용되는 메모리 기반 Storage 구현
 * 각 테스트마다 독립된 인스턴스를 생성하여 완전한 격리 보장
 */
export class MockStorageService implements IStorageService {
  private store = new Map<string, unknown>();

  get<T>(key: string): T | null {
    return (this.store.get(key) as T) ?? null;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  get length(): number {
    return this.store.size;
  }

  hasItem(key: string): boolean {
    return this.store.has(key);
  }

  /**
   * 테스트 헬퍼: 현재 저장된 모든 데이터 반환
   */
  getAll(): Record<string, unknown> {
    return Object.fromEntries(this.store);
  }
}
