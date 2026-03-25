/**
 * Services Module
 *
 * 의존성 주입(DI)을 위한 서비스 계층
 */

export type { IStorageService } from './IStorageService';
export { LocalStorageService } from './LocalStorageService';
export { MockStorageService } from './MockStorageService';
export { STORAGE_KEYS } from './storageKeys';

// 프로덕션용 싱글톤 인스턴스
import { LocalStorageService } from './LocalStorageService';
export const storageService = new LocalStorageService();

/**
 * Zustand Persistence Adapter
 *
 * Zustand의 persist 미들웨어에서 storageService를 사용하도록 변환해주는 어댑터입니다.
 */
import { StateStorage } from 'zustand/middleware';

export const zustandStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = storageService.get<unknown>(name);
    if (value === null) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  },
  setItem: (name: string, value: string): void => {
    try {
      // 이미 JSON 문자열인 경우 객체로 파싱하여 저장 (storageService가 다시 stringify함)
      const parsed = JSON.parse(value);
      storageService.set(name, parsed);
    } catch {
      // 일반 문자열인 경우 그대로 저장
      storageService.set(name, value);
    }
  },
  removeItem: (name: string): void => {
    storageService.remove(name);
  },
};
